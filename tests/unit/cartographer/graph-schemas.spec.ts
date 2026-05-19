import { describe, expect, it } from "vitest";

import {
  parseGraphNode,
  layerForPath,
} from "../../../src/domain/cartographer/graph/graph-node.js";
import {
  parseGraphEdge,
  edgeId,
} from "../../../src/domain/cartographer/graph/graph-edge.js";
import {
  parseProjectGraph,
  neighbors,
  reverseReachable,
  findNode,
  type ProjectGraph,
} from "../../../src/domain/cartographer/graph/project-graph.js";

function sampleGraph(): ProjectGraph {
  return parseProjectGraph({
    schemaVersion: 1,
    version: "graph-x",
    root: "/repo",
    createdAt: "2026-05-18T00:00:00.000Z",
    builderVersion: "cartographer-1.0.0",
    nodes: [
      { kind: "file", id: "file:a.ts", label: "a.ts", path: "a.ts", sizeBytes: 1, hash: "h", layer: "domain", tags: [] },
      { kind: "file", id: "file:b.ts", label: "b.ts", path: "b.ts", sizeBytes: 1, hash: "h", layer: "domain", tags: [] },
      { kind: "file", id: "file:c.ts", label: "c.ts", path: "c.ts", sizeBytes: 1, hash: "h", layer: "domain", tags: [] },
    ],
    edges: [
      { id: "imports:file:b.ts->file:a.ts", from: "file:b.ts", to: "file:a.ts", kind: "imports", confidence: 0.95, evidence: [] },
      { id: "imports:file:c.ts->file:b.ts", from: "file:c.ts", to: "file:b.ts", kind: "imports", confidence: 0.95, evidence: [] },
    ],
    diagnostics: [],
  });
}

describe("graph-node schema", () => {
  it("accepts a valid file node and applies defaults", () => {
    const node = parseGraphNode({
      kind: "file",
      id: "file:x.ts",
      label: "x.ts",
      path: "x.ts",
      sizeBytes: 10,
      hash: "sha256-abc",
    });
    expect(node.kind).toBe("file");
    expect(node.tags).toEqual([]);
  });

  it("rejects an unknown node kind", () => {
    expect(() => parseGraphNode({ kind: "alien", id: "x", label: "x" })).toThrow();
  });

  it("derives architecture layer from a src path", () => {
    expect(layerForPath("src/domain/cartographer/graph/graph-node.ts")).toBe("domain");
    expect(layerForPath("src/cli/commands/graph.ts")).toBe("cli");
    expect(layerForPath("scripts/foo.mjs")).toBe("unknown");
  });
});

describe("graph-edge schema", () => {
  it("rejects confidence outside 0..1", () => {
    expect(() =>
      parseGraphEdge({ id: "e", from: "a", to: "b", kind: "imports", confidence: 1.5 }),
    ).toThrow();
  });

  it("builds a deterministic edge id", () => {
    expect(edgeId("file:a", "file:b", "imports")).toBe("imports:file:a->file:b");
  });
});

describe("project-graph traversal", () => {
  it("finds a node by id", () => {
    expect(findNode(sampleGraph(), "file:b.ts")?.id).toBe("file:b.ts");
    expect(findNode(sampleGraph(), "missing")).toBeNull();
  });

  it("returns directional neighbors", () => {
    const g = sampleGraph();
    expect(neighbors(g, "file:b.ts", { direction: "in" }).map((e) => e.from)).toEqual(["file:c.ts"]);
    expect(neighbors(g, "file:b.ts", { direction: "out" }).map((e) => e.to)).toEqual(["file:a.ts"]);
    expect(neighbors(g, "file:b.ts").length).toBe(2);
  });

  it("computes reverse-reachable distances for impact analysis", () => {
    const distances = reverseReachable(sampleGraph(), "file:a.ts", { kinds: ["imports"] });
    expect(distances.get("file:b.ts")).toBe(1);
    expect(distances.get("file:c.ts")).toBe(2);
  });
});
