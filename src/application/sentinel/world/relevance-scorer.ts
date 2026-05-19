import path from "node:path";
import { exists, readJsonFile } from "../../../shared/fs.js";
import type { ObservationDraft } from "../../../infrastructure/sentinel/stores/observation-store.js";

interface PackageJson {
  readonly dependencies?: Record<string, string>;
  readonly devDependencies?: Record<string, string>;
  readonly peerDependencies?: Record<string, string>;
  readonly optionalDependencies?: Record<string, string>;
}

export interface DependencyTree {
  readonly direct: ReadonlySet<string>;
  readonly dev: ReadonlySet<string>;
  readonly peer: ReadonlySet<string>;
  readonly optional: ReadonlySet<string>;
}

export async function readLocalDependencyTree(workspaceRoot: string): Promise<DependencyTree> {
  const pkgPath = path.join(workspaceRoot, "package.json");
  if (!(await exists(pkgPath))) {
    return { direct: new Set(), dev: new Set(), peer: new Set(), optional: new Set() };
  }
  const pkg = await readJsonFile<PackageJson>(pkgPath);
  return {
    direct: new Set(Object.keys(pkg.dependencies ?? {})),
    dev: new Set(Object.keys(pkg.devDependencies ?? {})),
    peer: new Set(Object.keys(pkg.peerDependencies ?? {})),
    optional: new Set(Object.keys(pkg.optionalDependencies ?? {})),
  };
}

export interface RelevanceScoreInputs {
  readonly draft: ObservationDraft;
  readonly tree: DependencyTree;
  readonly nodeMajor?: string | null;
}

export interface RelevanceScore {
  readonly score: number;
  readonly reason: string;
}

function scoreNpmDraft(draft: ObservationDraft, tree: DependencyTree): RelevanceScore {
  const subject = draft.subject;
  if (tree.direct.has(subject)) {
    return { score: 1, reason: "direct dependency" };
  }
  if (tree.peer.has(subject)) {
    return { score: 0.85, reason: "peer dependency" };
  }
  if (tree.dev.has(subject)) {
    return { score: 0.7, reason: "dev dependency" };
  }
  if (tree.optional.has(subject)) {
    return { score: 0.4, reason: "optional dependency" };
  }
  return { score: 0.1, reason: "package not in local dependency tree" };
}

function scoreRuntimeDraft(draft: ObservationDraft, nodeMajor: string | null | undefined): RelevanceScore {
  const major = (draft.metadata as { readonly major?: string } | undefined)?.major ?? null;
  if (major === null || major === undefined) {
    return { score: 0.5, reason: "runtime event without major version" };
  }
  if (nodeMajor !== null && nodeMajor !== undefined && nodeMajor === major) {
    return { score: 1, reason: `current Node.js runtime is ${major}` };
  }
  return { score: 0.6, reason: "non-current Node.js major" };
}

export function scoreRelevance(inputs: RelevanceScoreInputs): RelevanceScore {
  if (inputs.draft.source.startsWith("npm:")) {
    return scoreNpmDraft(inputs.draft, inputs.tree);
  }
  if (inputs.draft.source.startsWith("runtime:")) {
    return scoreRuntimeDraft(inputs.draft, inputs.nodeMajor);
  }
  return { score: 0.5, reason: "unscored source kind; using neutral relevance" };
}

export function applyRelevance(
  draft: ObservationDraft,
  score: RelevanceScore,
  floor: number,
): ObservationDraft | null {
  if (score.score < floor) {
    return null;
  }
  if (score.score < 0.5 && draft.severity !== "info") {
    return { ...draft, severity: "info" };
  }
  return draft;
}

export function currentNodeMajor(): string {
  return process.versions.node.split(".")[0] ?? "0";
}
