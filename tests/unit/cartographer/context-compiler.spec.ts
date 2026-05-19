import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildGraph } from "../../../src/application/cartographer/build-graph.js";
import { GraphStore } from "../../../src/infrastructure/cartographer/graph-store.js";
import { compileContext } from "../../../src/application/cartographer/compile-context.js";
import { BundleStore } from "../../../src/infrastructure/cartographer/bundle-store.js";
import { redactSecrets } from "../../../src/infrastructure/cartographer/store-safety.js";
import { tokenizeGoal, rankFiles } from "../../../src/domain/cartographer/context/ranking.js";
import { applyBudget } from "../../../src/domain/cartographer/context/token-budget.js";
import { parseProjectGraph } from "../../../src/domain/cartographer/graph/project-graph.js";
import type { DecisionProvider } from "../../../src/application/cartographer/decision-provider.js";

let workspace: string;

const noDecisions: DecisionProvider = {
  id: "none",
  relevantDecisions: async () => [],
};

async function write(rel: string, body: string): Promise<void> {
  const full = path.join(workspace, rel);
  await fs.mkdir(path.dirname(full), { recursive: true });
  await fs.writeFile(full, body, "utf8");
}

async function seedGraph(): Promise<void> {
  await write("package.json", JSON.stringify({ name: "demo", scripts: { test: "vitest", build: "tsc" } }));
  await write("src/dashboard/server.ts", `export const startServer = () => 1;\n`);
  await write("src/dashboard/app.ts", `import { startServer } from "./server.js";\nexport const app = startServer();\n`);
  await write("src/unrelated/util.ts", `export const util = 2;\n`);
  await write("docs/dashboard-design.md", `# Dashboard design\n`);
  const { graph } = await buildGraph(workspace, "cartographer-1.0.0", new Date().toISOString());
  await new GraphStore(workspace).write(graph);
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "carto-ctx-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("ranking primitives", () => {
  it("tokenizes a goal and drops stop words", () => {
    expect(tokenizeGoal("add an impact panel to the dashboard")).toEqual(["impact", "panel", "dashboard"]);
  });

  it("ranks goal-keyword-matching files above unrelated ones", () => {
    const graph = parseProjectGraph({
      schemaVersion: 1,
      version: "g",
      root: "/r",
      createdAt: "t",
      builderVersion: "b",
      nodes: [
        { kind: "file", id: "file:src/dashboard.ts", label: "x", path: "src/dashboard.ts", sizeBytes: 1, hash: "h", layer: "domain", tags: [] },
        { kind: "file", id: "file:src/other.ts", label: "y", path: "src/other.ts", sizeBytes: 1, hash: "h", layer: "domain", tags: [] },
      ],
      edges: [],
      diagnostics: [],
    });
    const ranked = rankFiles({ goal: "fix dashboard", seedFiles: [], graph });
    expect(ranked[0]?.path).toBe("src/dashboard.ts");
  });
});

describe("applyBudget", () => {
  it("truncates beyond the small file limit and reports omissions", () => {
    const refs = Array.from({ length: 15 }, (_, i) => ({
      id: `file:f${i}.ts`,
      path: `f${i}.ts`,
      score: 15 - i,
      reason: "r",
      evidence: [],
    }));
    const result = applyBudget(refs, "small", () => 10);
    expect(result.selected.length).toBe(10);
    expect(result.truncated).toBe(true);
    expect(result.omitted.length).toBe(5);
  });

  it("truncates when the token ceiling is hit before the file limit", () => {
    const refs = Array.from({ length: 5 }, (_, i) => ({
      id: `file:f${i}.ts`,
      path: `f${i}.ts`,
      score: 1,
      reason: "r",
      evidence: [],
    }));
    const result = applyBudget(refs, "small", () => 3000);
    expect(result.selected.length).toBe(1);
    expect(result.truncated).toBe(true);
  });

  it("always includes at least the top-ranked ref even when it exceeds the ceiling", () => {
    const refs = [{ id: "file:huge.ts", path: "huge.ts", score: 9, reason: "r", evidence: [] }];
    const result = applyBudget(refs, "small", () => 999999);
    expect(result.selected).toHaveLength(1);
    expect(result.truncated).toBe(false);
  });
});

describe("redactSecrets", () => {
  it("masks API-key and JWT shaped values", () => {
    const redacted = redactSecrets("token sk-abcdefghijklmnop12345 and eyJhbGciOi.eyJzdWIiOiJ.aBcDeFgHiJ");
    expect(redacted).not.toContain("sk-abcdefghijklmnop12345");
    expect(redacted).toContain("[REDACTED]");
  });

  it("masks Anthropic and OpenAI-project key formats containing hyphens", () => {
    const redacted = redactSecrets("key sk-ant-api03-AbCdEfGhIjKlMnOpQrStUvWx and sk-proj-aAbBcCdDeEfFgGhHiIjJ");
    expect(redacted).not.toContain("sk-ant-api03-AbCdEfGhIjKlMnOpQrStUvWx");
    expect(redacted).not.toContain("sk-proj-aAbBcCdDeEfFgGhHiIjJ");
  });

  it("masks Slack, GitLab, npm, and Bearer token shapes", () => {
    const redacted = redactSecrets(
      "xoxb-1111111111-abcdefghijkl glpat-AbCdEfGhIjKlMnOpQrSt Bearer abcdefghijklmnopqrstuvwxyz",
    );
    expect(redacted).not.toContain("xoxb-1111111111-abcdefghijkl");
    expect(redacted).not.toContain("glpat-AbCdEfGhIjKlMnOpQrSt");
    expect(redacted).not.toContain("Bearer abcdefghijklmnopqrstuvwxyz");
  });
});

describe("BundleStore path-traversal hardening", () => {
  it("rejects bundle ids that escape the context directory", async () => {
    const store = new BundleStore(workspace);
    await expect(store.read("../../.env")).rejects.toThrow(/invalid artifact id/);
    await expect(store.delete("../../../etc/passwd")).rejects.toThrow(/invalid artifact id/);
  });

  it("returns null on a corrupt bundle JSON instead of throwing", async () => {
    const dir = path.join(workspace, ".hforge/cartographer/context-bundles");
    await fs.mkdir(dir, { recursive: true });
    await fs.writeFile(path.join(dir, "bnd_corrupt.json"), "{ not json", "utf8");
    expect(await new BundleStore(workspace).read("bnd_corrupt")).toBeNull();
  });
});

describe("compileContext", () => {
  it("throws a helpful error when no graph exists", async () => {
    await expect(
      compileContext({ workspaceRoot: workspace, goal: "x", decisionProvider: noDecisions }),
    ).rejects.toThrow(/hforge graph build/);
  });

  it("produces a bundle ranking goal-relevant files and recommending test/build commands", async () => {
    await seedGraph();
    const { bundle } = await compileContext({
      workspaceRoot: workspace,
      goal: "improve the dashboard server",
      decisionProvider: noDecisions,
    });
    const files = bundle.relevantFiles.map((r) => r.path);
    expect(files).toContain("src/dashboard/server.ts");
    expect(files).not.toContain("src/unrelated/util.ts");
    const commands = bundle.recommendedCommands.map((c) => c.command).sort();
    expect(commands).toEqual(["npm run build", "npm run test"]);
    expect(bundle.relevantDocs.map((d) => d.path)).toContain("docs/dashboard-design.md");
  });

  it("marks the bundle stale when a file changed after indexing", async () => {
    await seedGraph();
    await write("src/dashboard/server.ts", `export const startServer = () => 999;\n`);
    const { bundle } = await compileContext({
      workspaceRoot: workspace,
      goal: "dashboard",
      decisionProvider: noDecisions,
    });
    expect(bundle.graphFreshness.modifiedSinceIndex).toContain("src/dashboard/server.ts");
    expect(bundle.diagnostics.some((d) => d.includes("stale"))).toBe(true);
  });

  it("persists and re-reads a bundle via BundleStore (MD + JSON sidecar)", async () => {
    await seedGraph();
    const { bundle } = await compileContext({
      workspaceRoot: workspace,
      goal: "dashboard work",
      decisionProvider: noDecisions,
    });
    const store = new BundleStore(workspace);
    await store.write(bundle);
    const reread = await store.read(bundle.id);
    expect(reread?.id).toBe(bundle.id);
    const md = await fs.readFile(
      path.join(workspace, ".hforge/cartographer/context-bundles", `${bundle.id}.md`),
      "utf8",
    );
    expect(md).toContain("# Task Context Bundle: dashboard work");
    const ids = await store.list();
    expect(ids).toContain(bundle.id);
    expect(await store.delete(bundle.id)).toBe(true);
    expect(await store.read(bundle.id)).toBeNull();
  });
});
