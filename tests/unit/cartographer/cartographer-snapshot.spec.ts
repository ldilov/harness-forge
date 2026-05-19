import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { buildGraph } from "../../../src/application/cartographer/build-graph.js";
import { GraphStore } from "../../../src/infrastructure/cartographer/graph-store.js";
import { CartographerSnapshotProvider } from "../../../src/application/dashboard/cartographer-snapshot.js";

let workspace: string;

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "carto-snap-"));
});
afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("CartographerSnapshotProvider", () => {
  it("reports absent graph cleanly", async () => {
    const snap = await new CartographerSnapshotProvider(workspace).graph();
    expect(snap.present).toBe(false);
    expect(snap.nodeCount).toBe(0);
  });

  it("summarizes node and edge kinds when a graph exists", async () => {
    await fs.mkdir(path.join(workspace, "src"), { recursive: true });
    await fs.writeFile(path.join(workspace, "package.json"), JSON.stringify({ name: "d", scripts: { test: "vitest" } }));
    await fs.writeFile(path.join(workspace, "src/a.ts"), "export const a = 1;\n");
    await fs.writeFile(path.join(workspace, "src/b.ts"), 'import { a } from "./a.js";\n');
    const { graph } = await buildGraph(workspace, "cartographer-1.0.0", new Date().toISOString());
    await new GraphStore(workspace).write(graph);

    const snap = await new CartographerSnapshotProvider(workspace).graph();
    expect(snap.present).toBe(true);
    expect(snap.nodeCount).toBeGreaterThan(0);
    expect(snap.nodeKinds.file).toBeGreaterThanOrEqual(2);
    expect(snap.edgeKinds.imports).toBeGreaterThanOrEqual(1);
  });

  it("returns empty bundle/impact/hook rows when nothing recorded", async () => {
    const provider = new CartographerSnapshotProvider(workspace);
    expect(await provider.bundles()).toEqual([]);
    expect(await provider.impact()).toEqual([]);
    expect(await provider.hooks()).toEqual([]);
  });
});
