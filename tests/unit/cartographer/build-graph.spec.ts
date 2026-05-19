import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildGraph } from "../../../src/application/cartographer/build-graph.js";
import { GraphStore } from "../../../src/infrastructure/cartographer/graph-store.js";

let workspace: string;

async function write(rel: string, body: string): Promise<void> {
  const full = path.join(workspace, rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, body, "utf8");
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "carto-build-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("buildGraph", () => {
  it("builds file/test/doc/command nodes and import edges on a TS fixture", async () => {
    await write("package.json", JSON.stringify({ name: "demo", scripts: { test: "vitest", build: "tsc" } }));
    await write("src/a.ts", `export const a = 1;\n`);
    await write("src/b.ts", `import { a } from "./a.js";\nexport const b = a + 1;\n`);
    await write("tests/b.spec.ts", `import { b } from "../src/b.js";\n`);
    await write("docs/readme.md", `# Demo\n`);

    const { graph } = await buildGraph(workspace, "cartographer-1.0.0", new Date().toISOString());

    const kinds = graph.nodes.map((n) => n.kind);
    expect(kinds).toContain("file");
    expect(kinds).toContain("test");
    expect(kinds).toContain("doc");
    expect(kinds).toContain("command");

    const importEdge = graph.edges.find((e) => e.kind === "imports");
    expect(importEdge?.from).toBe("file:src/b.ts");
    expect(importEdge?.to).toBe("file:src/a.ts");

    const commandNames = graph.nodes.filter((n) => n.kind === "command").map((n) => n.label).sort();
    expect(commandNames).toEqual(["build", "test"]);
  });

  it("skips secret-like files and never indexes them", async () => {
    await write(".env", "SECRET_KEY=abc\n");
    await write("config/secrets/key.pem", "-----PRIVATE-----\n");
    await write("src/ok.ts", `export const ok = true;\n`);

    const { graph } = await buildGraph(workspace, "cartographer-1.0.0", new Date().toISOString());
    const paths = graph.nodes.filter((n) => n.kind === "file").map((n) => (n.kind === "file" ? n.path : ""));
    expect(paths).toContain("src/ok.ts");
    expect(paths.some((p) => p.includes(".env") || p.includes("secrets"))).toBe(false);
  });

  it("excludes real secret files but keeps source files that merely contain 'secret' in the name", async () => {
    await write(".env", "SECRET_KEY=abc\n");
    await write("src/server.key", "-----PRIVATE-----\n");
    await write("src/secrets-manager.ts", `export const loadSecrets = () => ({});\n`);
    await write("src/credential-validation.ts", `export const validate = () => true;\n`);
    await write("src/not-a-secret.ts", `export const ok = true;\n`);

    const { graph } = await buildGraph(workspace, "cartographer-1.0.0", new Date().toISOString());
    const filePaths = graph.nodes
      .filter((n) => n.kind === "file")
      .map((n) => (n.kind === "file" ? n.path : ""));

    expect(filePaths).toContain("src/secrets-manager.ts");
    expect(filePaths).toContain("src/credential-validation.ts");
    expect(filePaths).toContain("src/not-a-secret.ts");
    expect(filePaths.some((p) => p === ".env" || p.endsWith("server.key"))).toBe(false);
  });

  it("emits exactly one import edge when a target is reachable via two specifier forms", async () => {
    await write("src/foo.ts", `export const foo = 1;\n`);
    await write(
      "src/bar.ts",
      `import { foo } from "./foo.js";\nimport type { Foo } from "./foo";\nexport const bar = foo;\n`,
    );
    const { graph } = await buildGraph(workspace, "cartographer-1.0.0", new Date().toISOString());
    const fooEdges = graph.edges.filter(
      (e) => e.from === "file:src/bar.ts" && e.to === "file:src/foo.ts" && e.kind === "imports",
    );
    expect(fooEdges).toHaveLength(1);
  });

  it("does not create edges to nodes that were never indexed", async () => {
    await write("src/only.ts", `import { ghost } from "./ghost.js";\nexport const only = 1;\n`);
    const { graph } = await buildGraph(workspace, "cartographer-1.0.0", new Date().toISOString());
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    for (const edge of graph.edges) {
      expect(nodeIds.has(edge.from)).toBe(true);
      expect(nodeIds.has(edge.to)).toBe(true);
    }
  });

  it("flags a dynamic non-literal import as a diagnostic, not a crash", async () => {
    await write("package.json", JSON.stringify({ name: "demo" }));
    await write("src/dyn.ts", `const p = "x"; export const m = import(p);\n`);
    const { graph } = await buildGraph(workspace, "cartographer-1.0.0", new Date().toISOString());
    expect(graph.diagnostics.some((d) => d.analyzer === "ts-import-extractor")).toBe(true);
  });

  it("round-trips through GraphStore and writes nodes/edges JSONL + indexes", async () => {
    await write("package.json", JSON.stringify({ name: "demo", scripts: { test: "vitest" } }));
    await write("src/a.ts", `export const a = 1;\n`);
    await write("src/b.ts", `import { a } from "./a.js";\n`);

    const { graph } = await buildGraph(workspace, "cartographer-1.0.0", new Date().toISOString());
    const store = new GraphStore(workspace);
    await store.write(graph);

    const reread = await store.read();
    expect(reread).not.toBeNull();
    expect(reread?.nodes.length).toBe(graph.nodes.length);

    const nodesJsonl = await fs.readFile(
      path.join(workspace, ".hforge/cartographer/graph/nodes.jsonl"),
      "utf8",
    );
    expect(nodesJsonl.trim().split("\n").length).toBe(graph.nodes.length);

    const byCommand = JSON.parse(
      await fs.readFile(path.join(workspace, ".hforge/cartographer/graph/indexes/by-command.json"), "utf8"),
    ) as Record<string, string[]>;
    expect(byCommand.test).toEqual(["command:test"]);
  });

  it("serializes concurrent writes through the path-mutex writer lock", async () => {
    await write("package.json", JSON.stringify({ name: "demo" }));
    await write("src/a.ts", `export const a = 1;\n`);
    const { graph } = await buildGraph(workspace, "cartographer-1.0.0", new Date().toISOString());
    const store = new GraphStore(workspace);
    await Promise.all([store.write(graph), store.write(graph), store.write(graph)]);
    const reread = await store.read();
    expect(reread?.nodes.length).toBe(graph.nodes.length);
  });
});
