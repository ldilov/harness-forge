import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  deriveTestEdges,
  deriveDocumentEdges,
  deriveCommandEdges,
  deriveImplementsEdges,
  collectExportNames,
} from "../../../src/infrastructure/cartographer/scan/edge-enrichment.js";
import { buildGraph } from "../../../src/application/cartographer/build-graph.js";

describe("deriveTestEdges", () => {
  const indexed = new Set(["src/a.ts", "src/b.ts"]);

  it("emits a high-confidence tests edge when the test imports the source", () => {
    const tests = new Map([["tests/a.spec.ts", 'import { a } from "../src/a.js";']]);
    const resolve = () => ["src/a.ts"];
    const edges = deriveTestEdges(tests, resolve, indexed);
    expect(edges).toHaveLength(1);
    expect(edges[0]?.kind).toBe("tests");
    expect(edges[0]?.confidence).toBe(0.92);
    expect(edges[0]?.to).toBe("file:src/a.ts");
  });

  it("falls back to basename mirror at lower confidence with a unique match", () => {
    const tests = new Map([["tests/b.test.ts", "describe('b', () => {});"]]);
    const edges = deriveTestEdges(tests, () => [], indexed);
    expect(edges).toHaveLength(1);
    expect(edges[0]?.to).toBe("file:src/b.ts");
    expect(edges[0]?.confidence).toBe(0.8);
  });

  it("skips ambiguous mirror matches (no ghost or guess edges)", () => {
    const ambiguous = new Set(["src/util.ts", "src/lib/util.ts"]);
    const tests = new Map([["tests/util.test.ts", ""]]);
    expect(deriveTestEdges(tests, () => [], ambiguous)).toEqual([]);
  });

  it("excludes helper/fixture/mock test files from mirror edges", () => {
    const tests = new Map([["tests/a.mock.ts", ""]]);
    expect(deriveTestEdges(tests, () => [], indexed)).toEqual([]);
  });

  it("excludes barrel-like basenames (index/constants/types) from mirror edges", () => {
    const idx = new Set(["src/index.ts"]);
    const tests = new Map([["tests/index.test.ts", ""]]);
    expect(deriveTestEdges(tests, () => [], idx)).toEqual([]);
  });
});

describe("deriveDocumentEdges", () => {
  const indexed = new Set(["src/a.ts"]);

  it("emits a documents edge only for a resolvable markdown link", () => {
    const docs = new Map([["docs/x.md", "see [a](../src/a.ts) and [ext](https://x.com)"]]);
    const edges = deriveDocumentEdges(docs, indexed);
    expect(edges).toHaveLength(1);
    expect(edges[0]?.to).toBe("file:src/a.ts");
    expect(edges[0]?.confidence).toBe(0.9);
  });

  it("never emits ghost edges for non-existent or bare-symbol references", () => {
    const docs = new Map([["docs/x.md", "use `SomeService` and [gone](../src/gone.ts)"]]);
    expect(deriveDocumentEdges(docs, indexed)).toEqual([]);
  });
});

describe("deriveCommandEdges", () => {
  const indexed = new Set(["scripts/build.mjs", "src/index.ts"]);

  it("links explicit script paths and skips globs", () => {
    const scripts = new Map([
      ["build", "node scripts/build.mjs"],
      ["lint", "eslint 'src/**/*.ts'"],
    ]);
    const edges = deriveCommandEdges(scripts, indexed);
    const usesCommand = edges.filter((e) => e.kind === "uses-command");
    expect(usesCommand).toHaveLength(1);
    expect(usesCommand[0]?.from).toBe("file:scripts/build.mjs");
    expect(usesCommand[0]?.to).toBe("command:build");
  });

  it("emits a verifies edge for test-style scripts", () => {
    const scripts = new Map([["test", "vitest run src/index.ts"]]);
    const edges = deriveCommandEdges(scripts, indexed);
    expect(edges.some((e) => e.kind === "verifies" && e.from === "command:test")).toBe(true);
  });
});

describe("deriveImplementsEdges", () => {
  it("links a class to the file exporting the interface it implements (unique match)", () => {
    const exports = collectExportNames(new Map([["src/port.ts", "export interface Repo {}"]]));
    const sources = new Map([["src/impl.ts", "export class SqlRepo implements Repo {}"]]);
    const edges = deriveImplementsEdges(sources, exports);
    expect(edges).toHaveLength(1);
    expect(edges[0]?.kind).toBe("implements");
    expect(edges[0]?.from).toBe("file:src/impl.ts");
    expect(edges[0]?.to).toBe("file:src/port.ts");
  });

  it("skips when the interface owner is ambiguous", () => {
    const exports = collectExportNames(
      new Map([["src/a.ts", "export interface Repo {}"], ["src/b.ts", "export type Repo = {}"]]),
    );
    const sources = new Map([["src/impl.ts", "class X implements Repo {}"]]);
    expect(deriveImplementsEdges(sources, exports)).toEqual([]);
  });

  it("ignores export declarations inside comments and string literals (no ghost owner)", () => {
    const exports = collectExportNames(
      new Map([["src/doc.ts", '/* export interface Ghost {} */\nconst s = "export class Ghost {}";\n']]),
    );
    const sources = new Map([["src/impl.ts", "class X implements Ghost {}"]]);
    expect(deriveImplementsEdges(sources, exports)).toEqual([]);
  });

  it("handles `extends Base implements Iface` and generic interface clauses", () => {
    const exports = collectExportNames(new Map([["src/port.ts", "export interface Port {}"]]));
    const sources = new Map([
      ["src/impl.ts", "class Impl<T> extends Base<T> implements Port<T>, Other {}"],
    ]);
    const edges = deriveImplementsEdges(sources, exports);
    expect(edges).toHaveLength(1);
    expect(edges[0]?.to).toBe("file:src/port.ts");
  });
});

describe("buildGraph edge enrichment integration", () => {
  let workspace: string;

  beforeEach(async () => {
    workspace = await fs.mkdtemp(path.join(os.tmpdir(), "carto-enrich-"));
  });
  afterEach(async () => {
    await fs.rm(workspace, { recursive: true, force: true });
  });

  it("produces tests, documents, implements, and uses-command edges end-to-end", async () => {
    await fs.mkdir(path.join(workspace, "src"), { recursive: true });
    await fs.mkdir(path.join(workspace, "tests"), { recursive: true });
    await fs.mkdir(path.join(workspace, "docs"), { recursive: true });
    await fs.writeFile(path.join(workspace, "package.json"), JSON.stringify({ name: "d", scripts: { build: "node scripts/run.mjs" } }));
    await fs.mkdir(path.join(workspace, "scripts"), { recursive: true });
    await fs.writeFile(path.join(workspace, "scripts/run.mjs"), "console.log(1);\n");
    await fs.writeFile(path.join(workspace, "src/port.ts"), "export interface Port {}\n");
    await fs.writeFile(path.join(workspace, "src/impl.ts"), 'import type { Port } from "./port.js";\nexport class Impl implements Port {}\n');
    await fs.writeFile(path.join(workspace, "tests/impl.spec.ts"), 'import { Impl } from "../src/impl.js";\n');
    await fs.writeFile(path.join(workspace, "docs/guide.md"), "See [impl](../src/impl.ts)\n");

    const { graph } = await buildGraph(workspace, "cartographer-1.0.0", new Date().toISOString());
    const kinds = new Set(graph.edges.map((e) => e.kind));
    expect(kinds.has("tests")).toBe(true);
    expect(kinds.has("documents")).toBe(true);
    expect(kinds.has("implements")).toBe(true);
    expect(kinds.has("uses-command")).toBe(true);

    const testEdge = graph.edges.find((e) => e.kind === "tests");
    expect(testEdge?.to).toBe("file:src/impl.ts");
    const implEdge = graph.edges.find((e) => e.kind === "implements");
    expect(implEdge?.to).toBe("file:src/port.ts");
  });

  it("keeps all edges pointing at existing nodes (no ghost edges)", async () => {
    await fs.mkdir(path.join(workspace, "src"), { recursive: true });
    await fs.writeFile(path.join(workspace, "package.json"), JSON.stringify({ name: "d" }));
    await fs.writeFile(path.join(workspace, "src/a.ts"), "export const a = 1;\n");
    await fs.writeFile(path.join(workspace, "docs.md"), "[missing](./src/nope.ts)\n");
    const { graph } = await buildGraph(workspace, "cartographer-1.0.0", new Date().toISOString());
    const nodeIds = new Set(graph.nodes.map((n) => n.id));
    for (const edge of graph.edges) {
      expect(nodeIds.has(edge.from)).toBe(true);
      expect(nodeIds.has(edge.to)).toBe(true);
    }
  });
});
