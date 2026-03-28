import { execFile } from "node:child_process";
import path from "node:path";
import { promisify } from "node:util";

import type { InstructionPlan } from "../../domain/intelligence/instruction-plan.js";
import type { RepoIntelligenceResult } from "../../domain/intelligence/repo-intelligence.js";
import type {
  InstallPlan,
  SharedRuntimeArtifact,
  SharedRuntimeBridge,
  SharedRuntimePlan,
  SharedRuntimeSurface,
  SharedRuntimeTarget
} from "../../domain/operations/install-plan.js";
import type { TargetAdapter } from "../../domain/targets/adapter.js";
import type { RecursiveLanguageCapabilities } from "../../domain/recursive/language-capabilities.js";
import {
  AI_LAYER_LIBRARY_DIR,
  AI_LAYER_VISIBLE_MODE,
  AI_TEMPLATES_DIR,
  AUTHORITATIVE_AI_LAYER_SURFACES,
  ensureDir,
  exists,
  PACKAGE_ROOT,
  readJsonFile,
  RUNTIME_CACHE_DIR,
  RUNTIME_DECISIONS_DIR,
  RUNTIME_FILE_INTEREST_FILE,
  RUNTIME_DIR,
  RUNTIME_FINDINGS_DIR,
  RUNTIME_IMPACT_ANALYSIS_FILE,
  RUNTIME_INDEX_FILE,
  RUNTIME_INSTRUCTION_PLAN_FILE,
  RUNTIME_README_FILE,
  RUNTIME_SCHEMA_VERSION,
  RUNTIME_RECOMMENDATIONS_FILE,
  RUNTIME_REPO_DIR,
  RUNTIME_REPO_MAP_FILE,
  RUNTIME_RISK_SIGNALS_FILE,
  RUNTIME_RECURSIVE_DIR,
  RUNTIME_RECURSIVE_LANGUAGE_CAPABILITIES_FILE,
  RUNTIME_RECURSIVE_SESSION_FILE,
  RUNTIME_RECURSIVE_SESSIONS_DIR,
  RUNTIME_RECURSIVE_SUMMARY_FILE,
  RUNTIME_SCAN_SUMMARY_FILE,
  RUNTIME_TARGET_SUPPORT_FILE,
  RUNTIME_TASKS_DIR,
  RUNTIME_VALIDATION_GAPS_FILE,
  writeJsonFile,
  writeTextFile
} from "../../shared/index.js";
import { recommendFromIntelligence } from "../recommendations/recommend-from-intelligence.js";
import { deriveRecursiveLanguageCapabilities } from "../recursive/derive-language-capabilities.js";

const execFileAsync = promisify(execFile);

interface PersistedSharedRuntimeDocument {
  version: number;
  runtimeSchemaVersion?: number;
  packageVersion?: string;
  runtimeId: string;
  initializedAt?: string;
  generatedAt: string;
  rootDir: string;
  visibilityMode: InstallPlan["visibilityPolicy"]["mode"];
  authoritativeSurfaces: string[];
  visibleBridgePaths: string[];
  durableSurfaces: SharedRuntimeSurface[];
  cacheSurfaces: SharedRuntimeSurface[];
  targets: SharedRuntimeTarget[];
  discoveryBridges: SharedRuntimeBridge[];
  baselineArtifacts: SharedRuntimeArtifact[];
}

function toPortablePath(value: string): string {
  return value.replaceAll("\\", "/");
}

function toWorkspaceRelative(workspaceRoot: string, value: string): string {
  return toPortablePath(path.relative(workspaceRoot, value) || ".");
}

function createSurface(rootDir: string, id: string, relativePath: string, description: string): SharedRuntimeSurface {
  return {
    id,
    path: path.join(rootDir, relativePath),
    description
  };
}

function createArtifact(
  rootDir: string,
  id: string,
  kind: SharedRuntimeArtifact["kind"],
  relativePath: string,
  description: string,
  source: string
): SharedRuntimeArtifact {
  return {
    id,
    kind,
    path: path.join(rootDir, relativePath),
    description,
    source
  };
}

function createTargetRuntimeSummary(
  workspaceRoot: string,
  targetId: string,
  target: TargetAdapter
): { targetSummary: SharedRuntimeTarget; discoveryBridges: SharedRuntimeBridge[] } {
  const bridge = target.sharedRuntimeBridge ?? {
    instructionSurfaces: ["AGENTS.md"],
    runtimeSurfaces: [path.join(RUNTIME_DIR, RUNTIME_INDEX_FILE), path.join(RUNTIME_DIR, RUNTIME_README_FILE)],
    supportMode: "native" as const,
    authoritativeSurfaces: [...AUTHORITATIVE_AI_LAYER_SURFACES],
    visibleBridgePaths: ["AGENTS.md", ".agents/skills", ".specify"],
    visibilityMode: AI_LAYER_VISIBLE_MODE
  };
  const instructionSurfaces = bridge.instructionSurfaces.map((surfacePath) => path.join(workspaceRoot, surfacePath));
  const runtimeSurfaces = (bridge.runtimeSurfaces ?? []).map((surfacePath) => path.join(workspaceRoot, surfacePath));
  const discoveryBridges: SharedRuntimeBridge[] = [
    ...instructionSurfaces.map((surfacePath, index) => ({
      id: `${targetId}:instruction:${index + 1}`,
      targetId,
      kind: "instruction" as const,
      path: surfacePath,
      supportMode: bridge.supportMode,
      description: `${target.displayName} discovery surface`
    })),
    ...runtimeSurfaces.map((surfacePath, index) => ({
      id: `${targetId}:runtime:${index + 1}`,
      targetId,
      kind: "runtime" as const,
      path: surfacePath,
      supportMode: bridge.supportMode,
      description: `${target.displayName} shared-runtime companion surface`
    }))
  ];

  return {
    targetSummary: {
      targetId,
      displayName: target.displayName,
      supportMode: bridge.supportMode,
      instructionSurfaces,
      runtimeSurfaces,
      ...(bridge.notes ? { notes: bridge.notes } : {})
    },
    discoveryBridges
  };
}

export function createSharedRuntimePlan(
  workspaceRoot: string,
  targetId: string,
  target: TargetAdapter
): SharedRuntimePlan {
  const rootDir = path.join(workspaceRoot, RUNTIME_DIR);
  const { targetSummary, discoveryBridges } = createTargetRuntimeSummary(workspaceRoot, targetId, target);
  const authoritativeSurfaces = (target.sharedRuntimeBridge?.authoritativeSurfaces ?? [...AUTHORITATIVE_AI_LAYER_SURFACES]).map(
    (surface) => path.join(workspaceRoot, surface)
  );
  const visibleBridgePaths = [...new Set(target.sharedRuntimeBridge?.visibleBridgePaths ?? target.sharedRuntimeBridge?.instructionSurfaces ?? ["AGENTS.md"])]
    .map((surface) => path.join(workspaceRoot, surface));

  return {
    runtimeId: "workspace-runtime",
    rootDir,
    indexPath: path.join(rootDir, RUNTIME_INDEX_FILE),
    readmePath: path.join(rootDir, RUNTIME_README_FILE),
    visibilityMode: target.sharedRuntimeBridge?.visibilityMode ?? AI_LAYER_VISIBLE_MODE,
    authoritativeSurfaces,
    visibleBridgePaths,
    durableSurfaces: [
      createSurface(path.join(workspaceRoot, AI_LAYER_LIBRARY_DIR), "library-skills", "skills", "Canonical hidden skill library for installed workspaces."),
      createSurface(path.join(workspaceRoot, AI_LAYER_LIBRARY_DIR), "library-rules", "rules", "Canonical hidden engineering rules and constraints."),
      createSurface(path.join(workspaceRoot, AI_LAYER_LIBRARY_DIR), "library-knowledge", "knowledge", "Canonical hidden knowledge packs and examples."),
      createSurface(path.join(workspaceRoot, AI_TEMPLATES_DIR), "templates", ".", "Canonical hidden task and workflow templates."),
      createSurface(rootDir, "repo", RUNTIME_REPO_DIR, "Structured repository understanding and architecture anchors."),
      createSurface(rootDir, "findings", RUNTIME_FINDINGS_DIR, "Durable findings, risks, and evidence-backed observations."),
      createSurface(rootDir, "tasks", RUNTIME_TASKS_DIR, "Task packs, requirements, implementation notes, and review context."),
      createSurface(rootDir, "decisions", RUNTIME_DECISIONS_DIR, "Durable decision records and maintainership rationale."),
      createSurface(rootDir, "recursive", RUNTIME_RECURSIVE_DIR, "Optional recursive session runtime for difficult work.")
    ],
    cacheSurfaces: [
      createSurface(rootDir, "cache", RUNTIME_CACHE_DIR, "Compact working-memory and resumability state for active work.")
    ],
    targets: [targetSummary],
    discoveryBridges,
    baselineArtifacts: [
      createArtifact(rootDir, "repo-map", "repo", `${RUNTIME_REPO_DIR}/${RUNTIME_REPO_MAP_FILE}`, "Structured repository map and boundary summary.", "hforge cartograph --json"),
      createArtifact(rootDir, "recommendations", "repo", `${RUNTIME_REPO_DIR}/${RUNTIME_RECOMMENDATIONS_FILE}`, "Evidence-backed bundle, profile, skill, and validation recommendations.", "hforge recommend --json"),
      createArtifact(rootDir, "target-support", "support", `${RUNTIME_REPO_DIR}/${RUNTIME_TARGET_SUPPORT_FILE}`, "Portable target support summary derived from the capability matrix.", "hforge recommend --json"),
      createArtifact(rootDir, "instruction-plan", "instruction", `${RUNTIME_REPO_DIR}/${RUNTIME_INSTRUCTION_PLAN_FILE}`, "Target-aware instruction bridge plans for installed runtimes.", "hforge synthesize-instructions --json"),
      createArtifact(rootDir, "scan-summary", "repo", `${RUNTIME_REPO_DIR}/${RUNTIME_SCAN_SUMMARY_FILE}`, "Baseline repository scan signals and detected stack evidence.", "hforge scan --json"),
      createArtifact(rootDir, "validation-gaps", "finding", `${RUNTIME_FINDINGS_DIR}/${RUNTIME_VALIDATION_GAPS_FILE}`, "Detected validation gaps that should influence runtime guidance.", "hforge scan --json"),
      createArtifact(rootDir, "risk-signals", "finding", `${RUNTIME_FINDINGS_DIR}/${RUNTIME_RISK_SIGNALS_FILE}`, "Detected risk signals that should influence runtime guidance.", "hforge scan --json"),
      createArtifact(
        rootDir,
        "recursive-language-capabilities",
        "repo",
        `${RUNTIME_RECURSIVE_DIR}/${RUNTIME_RECURSIVE_LANGUAGE_CAPABILITIES_FILE}`,
        "Canonical recursive structured-analysis capability map for supported languages and execution posture.",
        "hforge recursive capabilities --json"
      )
    ]
  };
}

function normalizeExistingRuntimeDocument(value: unknown): PersistedSharedRuntimeDocument | null {
  if (!value || typeof value !== "object") {
    return null;
  }

  const record = value as Record<string, unknown>;
  const rawBridges = Array.isArray(record.discoveryBridges) ? (record.discoveryBridges as Array<Record<string, unknown>>) : [];
  const legacyTargetId = typeof record.targetId === "string" ? record.targetId : null;
  const targets: SharedRuntimeTarget[] = Array.isArray(record.targets)
    ? (record.targets as SharedRuntimeTarget[])
    : legacyTargetId
      ? [
          {
            targetId: legacyTargetId,
            displayName: legacyTargetId,
            supportMode:
              (rawBridges.find((bridge) => typeof bridge.supportMode === "string")?.supportMode as SharedRuntimeTarget["supportMode"]) ??
              "native",
            instructionSurfaces: rawBridges
              .filter((bridge) => bridge.kind === "instruction" && typeof bridge.path === "string")
              .map((bridge) => String(bridge.path)),
            runtimeSurfaces: rawBridges
              .filter((bridge) => bridge.kind === "runtime" && typeof bridge.path === "string")
              .map((bridge) => String(bridge.path)),
            ...(typeof record.notes === "string" ? { notes: record.notes } : {})
          }
        ]
      : [];

  return {
    version: typeof record.version === "number" ? record.version : 1,
    runtimeSchemaVersion: typeof record.runtimeSchemaVersion === "number" ? record.runtimeSchemaVersion : undefined,
    packageVersion: typeof record.packageVersion === "string" ? record.packageVersion : undefined,
    runtimeId: typeof record.runtimeId === "string" ? record.runtimeId : "workspace-runtime",
    initializedAt: typeof record.initializedAt === "string" ? record.initializedAt : undefined,
    generatedAt: typeof record.generatedAt === "string" ? record.generatedAt : new Date().toISOString(),
    rootDir: typeof record.rootDir === "string" ? record.rootDir : RUNTIME_DIR,
    visibilityMode: record.visibilityMode === "hidden-ai-layer" ? "hidden-ai-layer" : AI_LAYER_VISIBLE_MODE,
    authoritativeSurfaces: Array.isArray(record.authoritativeSurfaces)
      ? (record.authoritativeSurfaces as string[])
      : [...AUTHORITATIVE_AI_LAYER_SURFACES],
    visibleBridgePaths: Array.isArray(record.visibleBridgePaths) ? (record.visibleBridgePaths as string[]) : [],
    durableSurfaces: Array.isArray(record.durableSurfaces) ? (record.durableSurfaces as SharedRuntimeSurface[]) : [],
    cacheSurfaces: Array.isArray(record.cacheSurfaces) ? (record.cacheSurfaces as SharedRuntimeSurface[]) : [],
    targets,
    discoveryBridges: rawBridges.map((bridge, index) => ({
      id: typeof bridge.id === "string" ? bridge.id : `legacy:${index + 1}`,
      targetId:
        typeof bridge.targetId === "string"
          ? bridge.targetId
          : targets[0]?.targetId ?? "legacy",
      kind: bridge.kind === "support-doc" ? "support-doc" : bridge.kind === "runtime" ? "runtime" : "instruction",
      path: typeof bridge.path === "string" ? bridge.path : "",
      supportMode:
        bridge.supportMode === "translated" || bridge.supportMode === "documentation-only" || bridge.supportMode === "unsupported"
          ? bridge.supportMode
          : "native",
      description: typeof bridge.description === "string" ? bridge.description : "Legacy shared-runtime bridge"
    })),
    baselineArtifacts: Array.isArray(record.baselineArtifacts) ? (record.baselineArtifacts as SharedRuntimeArtifact[]) : []
  };
}

function toPortableSurface(workspaceRoot: string, surface: SharedRuntimeSurface): SharedRuntimeSurface {
  return {
    ...surface,
    path: toWorkspaceRelative(workspaceRoot, surface.path)
  };
}

function toPortableArtifact(workspaceRoot: string, artifact: SharedRuntimeArtifact): SharedRuntimeArtifact {
  return {
    ...artifact,
    path: toWorkspaceRelative(workspaceRoot, artifact.path)
  };
}

function toPortableBridge(workspaceRoot: string, bridge: SharedRuntimeBridge): SharedRuntimeBridge {
  return {
    ...bridge,
    path: toWorkspaceRelative(workspaceRoot, bridge.path)
  };
}

function toPortableTarget(workspaceRoot: string, target: SharedRuntimeTarget): SharedRuntimeTarget {
  return {
    ...target,
    instructionSurfaces: target.instructionSurfaces.map((surface) => toWorkspaceRelative(workspaceRoot, surface)),
    runtimeSurfaces: target.runtimeSurfaces.map((surface) => toWorkspaceRelative(workspaceRoot, surface))
  };
}

function toPortableRuntimeDocument(
  workspaceRoot: string,
  runtime: SharedRuntimePlan,
  packageJson: { version: string }
): PersistedSharedRuntimeDocument {
  return {
    version: 2,
    runtimeSchemaVersion: RUNTIME_SCHEMA_VERSION,
    packageVersion: packageJson.version,
    runtimeId: runtime.runtimeId,
    initializedAt: new Date().toISOString(),
    generatedAt: new Date().toISOString(),
    rootDir: toWorkspaceRelative(workspaceRoot, runtime.rootDir),
    visibilityMode: runtime.visibilityMode,
    authoritativeSurfaces: runtime.authoritativeSurfaces.map((surface) => toWorkspaceRelative(workspaceRoot, surface)),
    visibleBridgePaths: runtime.visibleBridgePaths.map((surface) => toWorkspaceRelative(workspaceRoot, surface)),
    durableSurfaces: runtime.durableSurfaces.map((surface) => toPortableSurface(workspaceRoot, surface)),
    cacheSurfaces: runtime.cacheSurfaces.map((surface) => toPortableSurface(workspaceRoot, surface)),
    targets: runtime.targets.map((target) => toPortableTarget(workspaceRoot, target)),
    discoveryBridges: runtime.discoveryBridges.map((bridge) => toPortableBridge(workspaceRoot, bridge)),
    baselineArtifacts: runtime.baselineArtifacts.map((artifact) => toPortableArtifact(workspaceRoot, artifact))
  };
}

function mergeRuntimeDocuments(
  existing: PersistedSharedRuntimeDocument | null,
  current: PersistedSharedRuntimeDocument
): PersistedSharedRuntimeDocument {
  const durableSurfaces = new Map<string, SharedRuntimeSurface>();
  const cacheSurfaces = new Map<string, SharedRuntimeSurface>();
  const targets = new Map<string, SharedRuntimeTarget>();
  const discoveryBridges = new Map<string, SharedRuntimeBridge>();
  const baselineArtifacts = new Map<string, SharedRuntimeArtifact>();
  const authoritativeSurfaces = new Set<string>();
  const visibleBridgePaths = new Set<string>();

  for (const surface of [...(existing?.durableSurfaces ?? []), ...current.durableSurfaces]) {
    durableSurfaces.set(surface.id, surface);
  }
  for (const surface of [...(existing?.cacheSurfaces ?? []), ...current.cacheSurfaces]) {
    cacheSurfaces.set(surface.id, surface);
  }
  for (const target of [...(existing?.targets ?? []), ...current.targets]) {
    targets.set(target.targetId, target);
  }
  for (const bridge of [...(existing?.discoveryBridges ?? []), ...current.discoveryBridges]) {
    discoveryBridges.set(`${bridge.targetId}:${bridge.kind}:${bridge.path}`, bridge);
  }
  for (const artifact of [...(existing?.baselineArtifacts ?? []), ...current.baselineArtifacts]) {
    baselineArtifacts.set(artifact.id, artifact);
  }
  for (const surface of [...(existing?.authoritativeSurfaces ?? []), ...current.authoritativeSurfaces]) {
    authoritativeSurfaces.add(surface);
  }
  for (const surface of [...(existing?.visibleBridgePaths ?? []), ...current.visibleBridgePaths]) {
    visibleBridgePaths.add(surface);
  }

  return {
    version: 2,
    runtimeSchemaVersion: current.runtimeSchemaVersion ?? existing?.runtimeSchemaVersion ?? RUNTIME_SCHEMA_VERSION,
    packageVersion: current.packageVersion ?? existing?.packageVersion,
    runtimeId: current.runtimeId,
    initializedAt: existing?.initializedAt ?? current.initializedAt ?? new Date().toISOString(),
    generatedAt: new Date().toISOString(),
    rootDir: current.rootDir,
    visibilityMode: current.visibilityMode,
    authoritativeSurfaces: [...authoritativeSurfaces].sort((left, right) => left.localeCompare(right)),
    visibleBridgePaths: [...visibleBridgePaths].sort((left, right) => left.localeCompare(right)),
    durableSurfaces: [...durableSurfaces.values()].sort((left, right) => left.id.localeCompare(right.id)),
    cacheSurfaces: [...cacheSurfaces.values()].sort((left, right) => left.id.localeCompare(right.id)),
    targets: [...targets.values()].sort((left, right) => left.targetId.localeCompare(right.targetId)),
    discoveryBridges: [...discoveryBridges.values()].sort((left, right) =>
      `${left.targetId}:${left.id}`.localeCompare(`${right.targetId}:${right.id}`)
    ),
    baselineArtifacts: [...baselineArtifacts.values()].sort((left, right) => left.id.localeCompare(right.id))
  };
}

async function runJsonScript<T>(scriptRelativePath: string, workspaceRoot: string, args: string[] = []): Promise<T> {
  const scriptPath = path.join(PACKAGE_ROOT, scriptRelativePath);
  const { stdout } = await execFileAsync(process.execPath, [scriptPath, workspaceRoot, ...args, "--json"], {
    cwd: PACKAGE_ROOT,
    maxBuffer: 1024 * 1024 * 4
  });
  return JSON.parse(stdout) as T;
}

async function loadRuntimeBaselines(
  workspaceRoot: string,
  targetIds: string[]
): Promise<{
  repoIntelligence: RepoIntelligenceResult;
  repoMap: Record<string, unknown>;
  instructionPlans: InstructionPlan[];
  generatedAt: string;
}> {
  const [repoIntelligence, repoMap, instructionPlans] = await Promise.all([
    recommendFromIntelligence(workspaceRoot),
    runJsonScript<Record<string, unknown>>("scripts/intelligence/cartograph-repo.mjs", workspaceRoot),
    Promise.all(
      targetIds.map((targetId) =>
        runJsonScript<InstructionPlan>("scripts/intelligence/synthesize-instructions.mjs", workspaceRoot, ["--target", targetId])
      )
    )
  ]);

  return {
    repoIntelligence,
    repoMap,
    instructionPlans,
    generatedAt: repoIntelligence.generatedAt ?? new Date().toISOString()
  };
}

async function writeRuntimeBaselineArtifacts(
  workspaceRoot: string,
  runtime: SharedRuntimePlan,
  mergedDocument: PersistedSharedRuntimeDocument
): Promise<void> {
  const baselines = await loadRuntimeBaselines(
    workspaceRoot,
    mergedDocument.targets.map((target) => target.targetId)
  );
  const artifactsById = new Map(runtime.baselineArtifacts.map((artifact) => [artifact.id, artifact]));
  const scanSummary = {
    generatedAt: baselines.repoIntelligence.generatedAt ?? baselines.generatedAt,
    root: baselines.repoIntelligence.root,
    repoType: baselines.repoIntelligence.repoType,
    dominantLanguages: baselines.repoIntelligence.dominantLanguages,
    frameworkMatches: baselines.repoIntelligence.frameworkMatches,
    buildSignals: baselines.repoIntelligence.buildSignals,
    testSignals: baselines.repoIntelligence.testSignals,
    deploymentSignals: baselines.repoIntelligence.deploymentSignals
  };
  const recursiveCapabilities = await deriveRecursiveLanguageCapabilities(workspaceRoot, baselines.repoIntelligence);
  recursiveCapabilities.generatedAt = baselines.generatedAt;

  await Promise.all([
    writeJsonFile(artifactsById.get("repo-map")!.path, baselines.repoMap),
    writeJsonFile(artifactsById.get("recommendations")!.path, {
      generatedAt: baselines.generatedAt,
      root: baselines.repoIntelligence.root,
      repoType: baselines.repoIntelligence.repoType,
      recommendations: baselines.repoIntelligence.recommendations
    }),
    writeJsonFile(artifactsById.get("target-support")!.path, {
      generatedAt: baselines.generatedAt,
      targets: baselines.repoIntelligence.targetSupport ?? []
    }),
    writeJsonFile(artifactsById.get("instruction-plan")!.path, {
      generatedAt: baselines.generatedAt,
      plans: baselines.instructionPlans
    }),
    writeJsonFile(artifactsById.get("scan-summary")!.path, scanSummary),
    writeJsonFile(artifactsById.get("validation-gaps")!.path, {
      generatedAt: baselines.generatedAt,
      items: baselines.repoIntelligence.missingValidationSurfaces
    }),
    writeJsonFile(artifactsById.get("risk-signals")!.path, {
      generatedAt: baselines.generatedAt,
      items: baselines.repoIntelligence.riskSignals
    }),
    writeJsonFile(artifactsById.get("recursive-language-capabilities")!.path, recursiveCapabilities)
  ]);
}

function renderSharedRuntimeReadme(runtime: PersistedSharedRuntimeDocument): string {
  const lines = [
    "# Harness Forge Shared Runtime",
    "",
    "This workspace uses `.hforge/` as the hidden AI layer for Harness Forge.",
    "`.hforge/runtime/` is the shared intelligence runtime, while `.hforge/library/` and `.hforge/templates/` hold the canonical hidden operating content.",
    "",
    "## Runtime Version",
    `- schema version: \`${runtime.runtimeSchemaVersion ?? RUNTIME_SCHEMA_VERSION}\``,
    ...(runtime.packageVersion ? [`- package version: \`${runtime.packageVersion}\``] : []),
    ...(runtime.initializedAt ? [`- initialized at: \`${runtime.initializedAt}\``] : []),
    `- generated at: \`${runtime.generatedAt}\``,
    "",
    "## Visibility Policy",
    `- mode: \`${runtime.visibilityMode}\``,
    ...runtime.authoritativeSurfaces.map((surface) => `- hidden canonical: \`${surface}\``),
    ...runtime.visibleBridgePaths.map((surface) => `- visible bridge: \`${surface}\``),
    "",
    "## Installed Targets",
    ...runtime.targets.flatMap((target) => [
      `- \`${target.targetId}\` (${target.supportMode}) - ${target.displayName}`,
      ...target.instructionSurfaces.map((surface) => `  - instruction: \`${surface}\``),
      ...target.runtimeSurfaces.map((surface) => `  - runtime: \`${surface}\``),
      ...(target.notes ? [`  - notes: ${target.notes}`] : [])
    ]),
    "",
    "## Durable Surfaces",
    ...runtime.durableSurfaces.map((surface) => `- \`${surface.path}/\` - ${surface.description}`),
    `- \`.hforge/runtime/tasks/TASK-XXX/${RUNTIME_FILE_INTEREST_FILE}\` - Task-aware ranked file context for an active task`,
    `- \`.hforge/runtime/tasks/TASK-XXX/${RUNTIME_IMPACT_ANALYSIS_FILE}\` - Derived impact analysis for an active task`,
    `- \`.hforge/runtime/recursive/${RUNTIME_RECURSIVE_SESSIONS_DIR}/RS-XXX/${RUNTIME_RECURSIVE_SESSION_FILE}\` - Optional recursive draft session with budget, handles, and promotion state`,
    `- \`.hforge/runtime/recursive/${RUNTIME_RECURSIVE_SESSIONS_DIR}/RS-XXX/${RUNTIME_RECURSIVE_SUMMARY_FILE}\` - Deterministic recursive handoff summary for the session`,
    `- \`.hforge/runtime/recursive/${RUNTIME_RECURSIVE_LANGUAGE_CAPABILITIES_FILE}\` - Canonical recursive structured-analysis capability map for language adapter depth and execution posture`,
    "",
    "## Short-Term Cache",
    ...runtime.cacheSurfaces.map((surface) => `- \`${surface.path}/\` - ${surface.description}`),
    "",
    "## Baseline Runtime Artifacts",
    ...runtime.baselineArtifacts.map((artifact) => `- \`${artifact.path}\` - ${artifact.description} (source: ${artifact.source})`),
    "",
    "## Discovery Bridges",
    ...runtime.discoveryBridges.map(
      (bridge) => `- \`${bridge.path}\` [${bridge.targetId}, ${bridge.supportMode}] - ${bridge.description}`
    )
  ];

  return `${lines.join("\n")}\n`;
}

export async function writeSharedRuntime(
  workspaceRoot: string,
  plan: InstallPlan,
  packageRoot = PACKAGE_ROOT
): Promise<SharedRuntimePlan | null> {
  const runtime = plan.sharedRuntime;
  if (!runtime) {
    return null;
  }
  const packageJson = await readJsonFile<{ version: string }>(path.join(packageRoot, "package.json"));

  await ensureDir(runtime.rootDir);
  for (const surface of [...runtime.durableSurfaces, ...runtime.cacheSurfaces]) {
    await ensureDir(surface.path);
  }
  for (const artifact of runtime.baselineArtifacts) {
    await ensureDir(path.dirname(artifact.path));
  }

  const existingRuntime = (await exists(runtime.indexPath))
    ? normalizeExistingRuntimeDocument(await readJsonFile<unknown>(runtime.indexPath))
    : null;
  const portableDocument = toPortableRuntimeDocument(workspaceRoot, runtime, packageJson);
  portableDocument.initializedAt = existingRuntime?.initializedAt ?? portableDocument.initializedAt;
  const mergedDocument = mergeRuntimeDocuments(existingRuntime, portableDocument);

  await writeRuntimeBaselineArtifacts(workspaceRoot, runtime, mergedDocument);
  await writeJsonFile(runtime.indexPath, mergedDocument);
  await writeTextFile(runtime.readmePath, renderSharedRuntimeReadme(mergedDocument));

  return runtime;
}
