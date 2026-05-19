import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { computeImpact } from "../../../src/domain/cartographer/impact/impact-sim.js";
import { parseProjectGraph, type ProjectGraph } from "../../../src/domain/cartographer/graph/project-graph.js";
import { buildGraph } from "../../../src/application/cartographer/build-graph.js";
import { GraphStore } from "../../../src/infrastructure/cartographer/graph-store.js";
import { simulateImpact } from "../../../src/application/cartographer/simulate-impact.js";
import { ImpactStore } from "../../../src/infrastructure/cartographer/impact-store.js";
import type { DecisionProvider } from "../../../src/application/cartographer/decision-provider.js";

const noDecisions: DecisionProvider = { id: "none", relevantDecisions: async () => [] };

function graphWith(nodes: unknown[], edges: unknown[]): ProjectGraph {
  return parseProjectGraph({
    schemaVersion: 1,
    version: "g",
    root: "/r",
    createdAt: "t",
    builderVersion: "b",
    nodes,
    edges,
    diagnostics: [],
  });
}

function fileNode(p: string) {
  return { kind: "file", id: `file:${p}`, label: p, path: p, sizeBytes: 1, hash: "h", layer: "domain", tags: [] };
}

function importEdge(from: string, to: string) {
  return {
    id: `imports:file:${from}->file:${to}`,
    from: `file:${from}`,
    to: `file:${to}`,
    kind: "imports",
    confidence: 0.95,
    evidence: [],
  };
}

describe("computeImpact", () => {
  it("finds transitive reverse dependents of a changed file", () => {
    const graph = graphWith(
      [fileNode("src/domain/a.ts"), fileNode("src/domain/b.ts"), fileNode("src/domain/c.ts")],
      [importEdge("src/domain/b.ts", "src/domain/a.ts"), importEdge("src/domain/c.ts", "src/domain/b.ts")],
    );
    const result = computeImpact({ graph, changedFiles: ["src/domain/a.ts"], hasLinkedDecision: false });
    const paths = result.impactedFiles.map((r) => r.path);
    expect(paths).toContain("src/domain/b.ts");
    expect(paths).toContain("src/domain/c.ts");
  });

  it("classifies a shared/ change with wide fan-out as architectural", () => {
    const nodes = [fileNode("src/shared/util.ts")];
    const edges = [];
    for (let i = 0; i < 6; i += 1) {
      nodes.push(fileNode(`src/domain/d${i}.ts`));
      edges.push(importEdge(`src/domain/d${i}.ts`, "src/shared/util.ts"));
    }
    const result = computeImpact({
      graph: graphWith(nodes, edges),
      changedFiles: ["src/shared/util.ts"],
      hasLinkedDecision: false,
    });
    expect(result.risk).toBe("architectural");
  });

  it("classifies an isolated leaf change as low risk", () => {
    const graph = graphWith([fileNode("src/domain/lonely.ts")], []);
    const result = computeImpact({ graph, changedFiles: ["src/domain/lonely.ts"], hasLinkedDecision: false });
    expect(result.risk).toBe("low");
  });

  it("escalates to architectural when a decision is linked and fan-out >= 3", () => {
    const nodes = [fileNode("src/domain/x.ts")];
    const edges = [];
    for (let i = 0; i < 3; i += 1) {
      nodes.push(fileNode(`src/domain/y${i}.ts`));
      edges.push(importEdge(`src/domain/y${i}.ts`, "src/domain/x.ts"));
    }
    const result = computeImpact({
      graph: graphWith(nodes, edges),
      changedFiles: ["src/domain/x.ts"],
      hasLinkedDecision: true,
    });
    expect(result.risk).toBe("architectural");
  });

  it("suggests a split for very broad changes", () => {
    const nodes = [fileNode("src/shared/core.ts")];
    const edges = [];
    for (let i = 0; i < 30; i += 1) {
      nodes.push(fileNode(`src/m${i % 5}/f${i}.ts`));
      edges.push(importEdge(`src/m${i % 5}/f${i}.ts`, "src/shared/core.ts"));
    }
    const result = computeImpact({
      graph: graphWith(nodes, edges),
      changedFiles: ["src/shared/core.ts"],
      hasLinkedDecision: false,
    });
    expect(result.suggestedSplit.length).toBeGreaterThan(0);
  });

  it("caps speculative (--goal) analysis at high and labels it predicted", () => {
    const nodes = [fileNode("src/shared/util.ts")];
    const edges = [];
    for (let i = 0; i < 6; i += 1) {
      nodes.push(fileNode(`src/domain/s${i}.ts`));
      edges.push(importEdge(`src/domain/s${i}.ts`, "src/shared/util.ts"));
    }
    const result = computeImpact({
      graph: graphWith(nodes, edges),
      changedFiles: ["src/shared/util.ts"],
      hasLinkedDecision: false,
      speculative: true,
    });
    expect(result.risk).toBe("high");
    expect(result.explanation).toContain("predicted seed file(s)");
  });

  it("is honest when changed paths are not indexed", () => {
    const graph = graphWith([fileNode("src/domain/a.ts")], []);
    const result = computeImpact({ graph, changedFiles: ["src/ghost.ts"], hasLinkedDecision: false });
    expect(result.explanation).toContain("not indexed as file nodes");
    expect(result.confidenceNote).toContain("Static analysis only");
  });
});

describe("simulateImpact", () => {
  let workspace: string;

  beforeEach(async () => {
    workspace = await fs.mkdtemp(path.join(os.tmpdir(), "carto-impact-"));
  });
  afterEach(async () => {
    await fs.rm(workspace, { recursive: true, force: true });
  });

  it("throws when no graph exists", async () => {
    await expect(
      simulateImpact({ workspaceRoot: workspace, files: ["a.ts"], decisionProvider: noDecisions }),
    ).rejects.toThrow(/hforge graph build/);
  });

  it("analyzes explicit files and persists a retrievable report", async () => {
    await fs.mkdir(path.join(workspace, "src"), { recursive: true });
    await fs.writeFile(path.join(workspace, "package.json"), JSON.stringify({ name: "d", scripts: { test: "vitest" } }));
    await fs.writeFile(path.join(workspace, "src/a.ts"), "export const a = 1;\n");
    await fs.writeFile(path.join(workspace, "src/b.ts"), 'import { a } from "./a.js";\nexport const b = a;\n');
    const { graph } = await buildGraph(workspace, "cartographer-1.0.0", new Date().toISOString());
    await new GraphStore(workspace).write(graph);

    const { report } = await simulateImpact({
      workspaceRoot: workspace,
      files: ["src/a.ts"],
      decisionProvider: noDecisions,
    });
    expect(report.changedFiles).toEqual(["src/a.ts"]);
    expect(report.impactedFiles.map((r) => r.path)).toContain("src/b.ts");
    expect(report.recommendedCommands.map((c) => c.command)).toContain("npm run test");

    const store = new ImpactStore(workspace);
    await store.write(report);
    const reread = await store.read(report.id);
    expect(reread?.id).toBe(report.id);
    expect(reread?.risk).toBe(report.risk);
  });

  it("rejects path-traversal impact ids on read", async () => {
    await expect(new ImpactStore(workspace).read("../../etc/passwd")).rejects.toThrow(/invalid artifact id/);
  });
});
