import { NpmSourceAdapter } from "../../../infrastructure/sentinel/world/adapters/npm-source.js";
import { RuntimeLtsSourceAdapter } from "../../../infrastructure/sentinel/world/adapters/runtime-lts-source.js";
import { WorldCache, WorldCursorsStore, WorldSourcesStore } from "../../../infrastructure/sentinel/stores/world-store.js";
import {
  type WorldSourceAdapter,
} from "../../../domain/sentinel/world/world-source-adapter.js";
import {
  parseWatchRef,
  type WorldSourcesFile,
  type WorldWatchRef,
} from "../../../domain/sentinel/world/world-event.js";
import type { ObservationDraft } from "../../../infrastructure/sentinel/stores/observation-store.js";
import {
  applyRelevance,
  currentNodeMajor,
  readLocalDependencyTree,
  scoreRelevance,
  type DependencyTree,
} from "./relevance-scorer.js";
import { policyFetch, NetworkBlockedError } from "../../../infrastructure/sentinel/world/policy-fetch.js";
import { PACKAGE_ROOT } from "../../../shared/index.js";
import fs from "node:fs/promises";
import path from "node:path";

const USER_AGENT_BASE = "harness-forge-sentinel";

interface SyncOptions {
  readonly workspaceRoot: string;
  readonly sourceFilter?: string | null;
}

export interface SyncOutcome {
  readonly source: string;
  readonly fetched: number;
  readonly emitted: number;
  readonly skipped: number;
  readonly errors: readonly string[];
  readonly fromCache: boolean;
}

export interface OrchestratorResult {
  readonly outcomes: readonly SyncOutcome[];
  readonly drafts: readonly ObservationDraft[];
}

async function readUserAgent(): Promise<string> {
  try {
    const pkg = JSON.parse(await fs.readFile(path.join(PACKAGE_ROOT, "package.json"), "utf8")) as { readonly version?: string };
    return `${USER_AGENT_BASE}/${pkg.version ?? "0.0.0"}`;
  } catch {
    return `${USER_AGENT_BASE}/0.0.0`;
  }
}

function adaptersForSources(
  workspaceRoot: string,
  sources: WorldSourcesFile,
  fetchImpl: typeof policyFetch,
): readonly WorldSourceAdapter[] {
  const adapters: WorldSourceAdapter[] = [];
  for (const name of sources.watch.npm) {
    adapters.push(
      new NpmSourceAdapter({
        packageName: name,
        cache: new WorldCache(workspaceRoot, "npm"),
        fetchImpl,
      }),
    );
  }
  for (const name of sources.watch.runtime) {
    adapters.push(
      new RuntimeLtsSourceAdapter({
        runtime: name,
        cache: new WorldCache(workspaceRoot, "runtime"),
        fetchImpl,
      }),
    );
  }
  return adapters;
}

function matchFilter(adapter: WorldSourceAdapter, filter: string | null | undefined): boolean {
  if (filter === undefined || filter === null) {
    return true;
  }
  return adapter.id === filter || adapter.subject === filter;
}

export class WorldOrchestrator {
  constructor(private readonly fetchImpl: typeof policyFetch = policyFetch) {}

  async sync(options: SyncOptions): Promise<OrchestratorResult> {
    const sources = await new WorldSourcesStore(options.workspaceRoot).read();
    if (!sources.enabled) {
      return { outcomes: [], drafts: [] };
    }
    const adapters = adaptersForSources(options.workspaceRoot, sources, this.fetchImpl);
    if (adapters.length === 0) {
      return { outcomes: [], drafts: [] };
    }
    const userAgent = await readUserAgent();
    const cursors = new WorldCursorsStore(options.workspaceRoot);
    const tree = await readLocalDependencyTree(options.workspaceRoot);
    const nodeMajor = currentNodeMajor();
    const drafts: ObservationDraft[] = [];
    const outcomes: SyncOutcome[] = [];
    let total = 0;
    for (const adapter of adapters) {
      if (!matchFilter(adapter, options.sourceFilter ?? null)) {
        continue;
      }
      if (total >= sources.policies.maxSignalsPerRun) {
        outcomes.push({
          source: adapter.id,
          fetched: 0,
          emitted: 0,
          skipped: 1,
          errors: [],
          fromCache: false,
        });
        continue;
      }
      const ref: WorldWatchRef = { kind: adapter.kind, name: adapter.subject };
      const cursor = await cursors.get(ref);
      try {
        const result = await adapter.fetchSince({
          cursor,
          maxEvents: Math.max(1, sources.policies.maxSignalsPerRun - total),
          userAgent,
        });
        let emitted = 0;
        let skipped = 0;
        for (const event of result.events) {
          if (total >= sources.policies.maxSignalsPerRun) {
            skipped += 1;
            continue;
          }
          const draft = adapter.normalize(event);
          const score = scoreRelevance({ draft, tree, nodeMajor });
          const downgraded = applyRelevance(draft, score, sources.policies.relevanceFloor);
          if (downgraded === null) {
            skipped += 1;
            continue;
          }
          drafts.push({
            ...downgraded,
            metadata: {
              ...(downgraded.metadata ?? {}),
              relevance: { score: score.score, reason: score.reason },
            },
          });
          emitted += 1;
          total += 1;
        }
        if (result.nextCursor !== cursor) {
          await cursors.set(ref, result.nextCursor);
        }
        outcomes.push({
          source: adapter.id,
          fetched: result.events.length,
          emitted,
          skipped,
          errors: [],
          fromCache: result.fromCache,
        });
      } catch (error: unknown) {
        if (error instanceof NetworkBlockedError) {
          outcomes.push({
            source: adapter.id,
            fetched: 0,
            emitted: 0,
            skipped: 0,
            errors: [error.message],
            fromCache: false,
          });
          continue;
        }
        outcomes.push({
          source: adapter.id,
          fetched: 0,
          emitted: 0,
          skipped: 0,
          errors: [error instanceof Error ? error.message : String(error)],
          fromCache: false,
        });
      }
    }
    return { outcomes, drafts };
  }
}

export function describeWatchRef(value: string): WorldWatchRef | null {
  return parseWatchRef(value);
}

export function tree(workspaceRoot: string): Promise<DependencyTree> {
  return readLocalDependencyTree(workspaceRoot);
}
