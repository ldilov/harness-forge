import path from "node:path";

export const CARTOGRAPHER_ROOT_DIR = ".hforge/cartographer";
export const CARTOGRAPHER_GRAPH_DIR = path.join(CARTOGRAPHER_ROOT_DIR, "graph");
export const CARTOGRAPHER_GRAPH_FILE = "graph.json";
export const CARTOGRAPHER_NODES_FILE = "nodes.jsonl";
export const CARTOGRAPHER_EDGES_FILE = "edges.jsonl";
export const CARTOGRAPHER_INDEX_STATE_FILE = "file-index-state.json";
export const CARTOGRAPHER_GRAPH_WRITER_LOCK = ".writer.lock";
export const CARTOGRAPHER_INDEXES_DIR = "indexes";
export const CARTOGRAPHER_VERSIONS_DIR = "versions";
export const CARTOGRAPHER_CONTEXT_DIR = path.join(CARTOGRAPHER_ROOT_DIR, "context-bundles");
export const CARTOGRAPHER_IMPACT_DIR = path.join(CARTOGRAPHER_ROOT_DIR, "impact");
export const CARTOGRAPHER_HOOKS_DIR = path.join(CARTOGRAPHER_ROOT_DIR, "agent-hooks");
export const CARTOGRAPHER_HOOK_RUNS_FILE = "runs.jsonl";
export const CARTOGRAPHER_HOOK_CACHE_FILE = "cache.json";

export function cartographerContextDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_CONTEXT_DIR);
}

export function cartographerImpactDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_IMPACT_DIR);
}

export const CARTOGRAPHER_EXPLANATIONS_DIR = path.join(CARTOGRAPHER_ROOT_DIR, "explanations");

export function cartographerExplanationsDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_EXPLANATIONS_DIR);
}

export function cartographerExplanationJsonPath(workspaceRoot: string, explanationId: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_EXPLANATIONS_DIR, `${explanationId}.json`);
}

export function cartographerExplanationMarkdownPath(workspaceRoot: string, explanationId: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_EXPLANATIONS_DIR, `${explanationId}.md`);
}

export const CARTOGRAPHER_AGENT_TRIGGERS_FILE = ".hforge/agent-triggers.yaml";

export function cartographerHooksDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_HOOKS_DIR);
}

export function cartographerHookRunsPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_HOOKS_DIR, CARTOGRAPHER_HOOK_RUNS_FILE);
}

export function cartographerHookCachePath(workspaceRoot: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_HOOKS_DIR, CARTOGRAPHER_HOOK_CACHE_FILE);
}

export function cartographerAgentTriggersPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_AGENT_TRIGGERS_FILE);
}

export function cartographerImpactJsonPath(workspaceRoot: string, impactId: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_IMPACT_DIR, `${impactId}.json`);
}

export function cartographerImpactMarkdownPath(workspaceRoot: string, impactId: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_IMPACT_DIR, `${impactId}.md`);
}

export function cartographerBundleJsonPath(workspaceRoot: string, bundleId: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_CONTEXT_DIR, `${bundleId}.json`);
}

export function cartographerBundleMarkdownPath(workspaceRoot: string, bundleId: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_CONTEXT_DIR, `${bundleId}.md`);
}

export function cartographerGraphDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_GRAPH_DIR);
}

export function cartographerGraphPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_GRAPH_DIR, CARTOGRAPHER_GRAPH_FILE);
}

export function cartographerNodesPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_GRAPH_DIR, CARTOGRAPHER_NODES_FILE);
}

export function cartographerEdgesPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_GRAPH_DIR, CARTOGRAPHER_EDGES_FILE);
}

export function cartographerIndexStatePath(workspaceRoot: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_GRAPH_DIR, CARTOGRAPHER_INDEX_STATE_FILE);
}

export function cartographerGraphWriterLockPath(workspaceRoot: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_GRAPH_DIR, CARTOGRAPHER_GRAPH_WRITER_LOCK);
}

export function cartographerIndexesDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_GRAPH_DIR, CARTOGRAPHER_INDEXES_DIR);
}

export function cartographerVersionsDir(workspaceRoot: string): string {
  return path.join(workspaceRoot, CARTOGRAPHER_GRAPH_DIR, CARTOGRAPHER_VERSIONS_DIR);
}
