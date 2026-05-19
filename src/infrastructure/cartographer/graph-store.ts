import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, exists } from "../../shared/fs.js";
import { withPathLock } from "../../shared/path-mutex.js";
import {
  parseProjectGraph,
  type ProjectGraph,
} from "../../domain/cartographer/graph/project-graph.js";
import type { GraphNode } from "../../domain/cartographer/graph/graph-node.js";
import type { GraphEdge } from "../../domain/cartographer/graph/graph-edge.js";
import {
  cartographerGraphDir,
  cartographerGraphPath,
  cartographerNodesPath,
  cartographerEdgesPath,
  cartographerIndexesDir,
  cartographerGraphWriterLockPath,
} from "../../domain/cartographer/paths.js";

export class GraphStore {
  constructor(private readonly workspaceRoot: string) {}

  async exists(): Promise<boolean> {
    return exists(cartographerGraphPath(this.workspaceRoot));
  }

  async read(): Promise<ProjectGraph | null> {
    const graphPath = cartographerGraphPath(this.workspaceRoot);
    if (!(await exists(graphPath))) {
      return null;
    }
    const raw = await fs.readFile(graphPath, "utf8");
    if (raw.length === 0) {
      return null;
    }
    return parseProjectGraph(JSON.parse(raw));
  }

  async write(graph: ProjectGraph): Promise<void> {
    const validated = parseProjectGraph(graph);
    await withPathLock(cartographerGraphWriterLockPath(this.workspaceRoot), async () => {
      const dir = cartographerGraphDir(this.workspaceRoot);
      await ensureDir(dir);
      await ensureDir(cartographerIndexesDir(this.workspaceRoot));
      await this.writeJsonl(cartographerNodesPath(this.workspaceRoot), validated.nodes);
      await this.writeJsonl(cartographerEdgesPath(this.workspaceRoot), validated.edges);
      await this.writeIndexes(validated);
      await this.writeAtomic(
        cartographerGraphPath(this.workspaceRoot),
        `${JSON.stringify(validated, null, 2)}\n`,
      );
    });
  }

  private async writeJsonl(filePath: string, rows: readonly unknown[]): Promise<void> {
    const body = rows.map((row) => JSON.stringify(row)).join("\n");
    await this.writeAtomic(filePath, rows.length === 0 ? "" : `${body}\n`);
  }

  private async writeAtomic(filePath: string, content: string): Promise<void> {
    const tmp = `${filePath}.tmp`;
    await fs.writeFile(tmp, content, "utf8");
    await fs.rename(tmp, filePath);
  }

  private async writeIndexes(graph: ProjectGraph): Promise<void> {
    const byFile: Record<string, string[]> = {};
    const byCommand: Record<string, string[]> = {};
    const byDecision: Record<string, string[]> = {};
    const byFeature: Record<string, string[]> = {};
    for (const node of graph.nodes) {
      this.bucketNode(node, byFile, byCommand, byDecision, byFeature);
    }
    const dir = cartographerIndexesDir(this.workspaceRoot);
    await this.writeAtomic(path.join(dir, "by-file.json"), `${JSON.stringify(byFile, null, 2)}\n`);
    await this.writeAtomic(path.join(dir, "by-command.json"), `${JSON.stringify(byCommand, null, 2)}\n`);
    await this.writeAtomic(path.join(dir, "by-decision.json"), `${JSON.stringify(byDecision, null, 2)}\n`);
    await this.writeAtomic(path.join(dir, "by-feature.json"), `${JSON.stringify(byFeature, null, 2)}\n`);
  }

  private bucketNode(
    node: GraphNode,
    byFile: Record<string, string[]>,
    byCommand: Record<string, string[]>,
    byDecision: Record<string, string[]>,
    byFeature: Record<string, string[]>,
  ): void {
    if (node.kind === "file" || node.kind === "test" || node.kind === "doc") {
      (byFile[node.path] ??= []).push(node.id);
      return;
    }
    if (node.kind === "command") {
      (byCommand[node.name] ??= []).push(node.id);
      return;
    }
    if (node.kind === "decision") {
      (byDecision[node.id] ??= []).push(node.sourcePath);
      return;
    }
    if (node.kind === "feature") {
      (byFeature[node.name] ??= []).push(node.id);
    }
  }
}

export function emptyGraph(root: string, builderVersion: string, now: string): ProjectGraph {
  return {
    schemaVersion: 1,
    version: `graph-${now}`,
    root,
    createdAt: now,
    builderVersion,
    nodes: [],
    edges: [],
    diagnostics: [],
  };
}

export type { GraphNode, GraphEdge };
