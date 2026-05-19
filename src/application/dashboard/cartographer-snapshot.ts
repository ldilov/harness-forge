import { GraphStore } from "../../infrastructure/cartographer/graph-store.js";
import { BundleStore } from "../../infrastructure/cartographer/bundle-store.js";
import { ImpactStore } from "../../infrastructure/cartographer/impact-store.js";
import { HookRunStore } from "../../infrastructure/cartographer/hook-run-store.js";
import type { GraphEdge } from "../../domain/cartographer/graph/graph-edge.js";

const MAX_LIMIT = 1000;

export interface CartographerGraphSnapshot {
  readonly present: boolean;
  readonly version: string | null;
  readonly createdAt: string | null;
  readonly nodeCount: number;
  readonly edgeCount: number;
  readonly nodeKinds: Readonly<Record<string, number>>;
  readonly edgeKinds: Readonly<Record<string, number>>;
  readonly diagnosticCount: number;
}

export interface CartographerBundleRow {
  readonly id: string;
  readonly goal: string;
  readonly createdAt: string;
  readonly budget: string;
  readonly fileCount: number;
  readonly decisionCount: number;
  readonly contextTruncated: boolean;
}

export interface CartographerImpactRow {
  readonly id: string;
  readonly createdAt: string;
  readonly risk: string;
  readonly changedFileCount: number;
  readonly impactedFileCount: number;
}

export interface CartographerHookRow {
  readonly id: string;
  readonly createdAt: string;
  readonly event: string;
  readonly mode: string;
  readonly status: string;
  readonly cached: boolean;
  readonly recommendedCount: number;
  readonly executedCount: number;
}

function bound(limit: number): number {
  return Number.isFinite(limit) ? Math.min(MAX_LIMIT, Math.max(1, limit)) : 50;
}

function tally(items: readonly string[]): Readonly<Record<string, number>> {
  const out: Record<string, number> = {};
  for (const item of items) {
    out[item] = (out[item] ?? 0) + 1;
  }
  return out;
}

export class CartographerSnapshotProvider {
  constructor(private readonly workspaceRoot: string) {}

  async graph(): Promise<CartographerGraphSnapshot> {
    const graph = await new GraphStore(this.workspaceRoot).read();
    if (graph === null) {
      return {
        present: false,
        version: null,
        createdAt: null,
        nodeCount: 0,
        edgeCount: 0,
        nodeKinds: {},
        edgeKinds: {},
        diagnosticCount: 0,
      };
    }
    return {
      present: true,
      version: graph.version,
      createdAt: graph.createdAt,
      nodeCount: graph.nodes.length,
      edgeCount: graph.edges.length,
      nodeKinds: tally(graph.nodes.map((node) => node.kind)),
      edgeKinds: tally(graph.edges.map((edge: GraphEdge) => edge.kind)),
      diagnosticCount: graph.diagnostics.length,
    };
  }

  async bundles(limit = 50): Promise<readonly CartographerBundleRow[]> {
    const store = new BundleStore(this.workspaceRoot);
    const ids = await store.list();
    const rows: CartographerBundleRow[] = [];
    for (const id of ids.slice(-bound(limit))) {
      const bundle = await store.read(id);
      if (bundle === null) {
        continue;
      }
      rows.push({
        id: bundle.id,
        goal: bundle.goal,
        createdAt: bundle.createdAt,
        budget: bundle.budget,
        fileCount: bundle.relevantFiles.length,
        decisionCount: bundle.relevantDecisions.length,
        contextTruncated: bundle.contextTruncated,
      });
    }
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async impact(limit = 50): Promise<readonly CartographerImpactRow[]> {
    const store = new ImpactStore(this.workspaceRoot);
    const ids = await store.list();
    const rows: CartographerImpactRow[] = [];
    for (const id of ids.slice(-bound(limit))) {
      const report = await store.read(id);
      if (report === null) {
        continue;
      }
      rows.push({
        id: report.id,
        createdAt: report.createdAt,
        risk: report.risk,
        changedFileCount: report.changedFiles.length,
        impactedFileCount: report.impactedFiles.length,
      });
    }
    return rows.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  async hooks(limit = 50): Promise<readonly CartographerHookRow[]> {
    const runs = await new HookRunStore(this.workspaceRoot).recent(bound(limit));
    return runs
      .map((run) => ({
        id: run.id,
        createdAt: run.createdAt,
        event: run.event,
        mode: run.mode,
        status: run.status,
        cached: run.cached,
        recommendedCount: run.recommendedCommands.length,
        executedCount: run.executedCommands.length,
      }))
      .reverse();
  }
}
