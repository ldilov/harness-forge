import path from "node:path";

import type { AgentBriefSupportMode, AgentStartBrief, BriefTargetSummary } from "../../domain/runtime/agent-brief.js";
import {
  AGENT_MANIFEST_FILE,
  GENERATED_DIR,
  RUNTIME_AGENT_BRIEF_MD_FILE,
  RUNTIME_DIR,
  RUNTIME_INDEX_FILE,
  STATE_DIR,
  exists,
  readJsonFile
} from "../../shared/index.js";

interface RuntimeIndexTarget {
  targetId: string;
  displayName?: string;
  supportMode?: string;
  instructionSurfaces?: string[];
  runtimeSurfaces?: string[];
}

interface RuntimeIndexDocument {
  authoritativeSurfaces?: string[];
  visibleBridgePaths?: string[];
  targets?: RuntimeIndexTarget[];
}

interface InstallStateDocument {
  installedTargets?: string[];
  installedBundles?: string[];
  timestamps?: {
    updatedAt?: string;
  };
}

interface PackageJsonDocument {
  name?: string;
  scripts?: Record<string, string>;
  dependencies?: Record<string, string>;
  devDependencies?: Record<string, string>;
}

interface BuildAgentBriefInput {
  workspaceRoot: string;
  generatedAt?: string;
}

function toPortablePath(value: string): string {
  return value.replaceAll("\\", "/");
}

async function tryReadJson<T>(filePath: string): Promise<T | null> {
  if (!(await exists(filePath))) return null;
  return readJsonFile<T>(filePath);
}

function inferStack(packageJson: PackageJsonDocument | null): string[] {
  if (!packageJson) return ["Stack detection partial"];
  const dependencies = {
    ...(packageJson.dependencies ?? {}),
    ...(packageJson.devDependencies ?? {})
  };
  const stack = new Set<string>();
  stack.add("Node.js");
  if (dependencies.typescript || dependencies["typescript-eslint"] || packageJson.scripts?.build?.includes("tsc")) stack.add("TypeScript");
  if (dependencies.vitest || packageJson.scripts?.test?.includes("vitest")) stack.add("Vitest");
  if (dependencies.commander) stack.add("CLI");
  return [...stack];
}

function mapSupportMode(targetId: string, supportMode?: string): AgentBriefSupportMode {
  if (targetId === "codex" || targetId === "claude-code") return "first-class";
  if (targetId === "cursor") return "partial";
  if (supportMode === "unsupported") return "unsupported";
  if (supportMode === "native") return "first-class";
  if (supportMode === "bridged" || supportMode === "translated" || supportMode === "documentation-only") return "compatible";
  return "compatible";
}

function buildTargetSummary(target: RuntimeIndexTarget | string): BriefTargetSummary {
  const targetId = typeof target === "string" ? target : target.targetId;
  const supportMode = mapSupportMode(targetId, typeof target === "string" ? undefined : target.supportMode);
  const bridgeSurfaces = typeof target === "string" ? [] : [...(target.instructionSurfaces ?? []), ...(target.runtimeSurfaces ?? [])];
  const caveats =
    targetId === "cursor"
      ? ["Cursor consumes compatible guidance and does not have full runtime-native parity."]
      : supportMode === "first-class"
        ? []
        : [`${targetId} uses compatible Harness Forge guidance rather than full target-native runtime support.`];

  return {
    targetId,
    displayName: typeof target === "string" ? target : (target.displayName ?? targetId),
    supportMode,
    bridgeSurfaces: bridgeSurfaces.length > 0 ? [...new Set(bridgeSurfaces.map(toPortablePath))] : ["AGENTS.md"],
    caveats,
    recommendedBehavior:
      supportMode === "first-class"
        ? "Use the agent brief and command catalog before meaningful coding work."
        : "Use the shared brief as compatible guidance and avoid claiming first-class support."
  };
}

function defaultSurfaces(runtimeIndex: RuntimeIndexDocument | null): string[] {
  return [
    "AGENTS.md",
    `${RUNTIME_DIR}/${RUNTIME_AGENT_BRIEF_MD_FILE}`,
    AGENT_MANIFEST_FILE,
    `${GENERATED_DIR}/agent-command-catalog.json`,
    ...(runtimeIndex?.authoritativeSurfaces ?? [".hforge/library/skills", ".hforge/library/rules", ".hforge/library/knowledge"])
  ].map(toPortablePath);
}

export async function buildAgentBrief(input: BuildAgentBriefInput): Promise<AgentStartBrief> {
  const workspaceRoot = input.workspaceRoot;
  const runtimeIndexPath = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_INDEX_FILE);
  const installStatePath = path.join(workspaceRoot, STATE_DIR, "install-state.json");
  const commandCatalogPath = path.join(workspaceRoot, GENERATED_DIR, "agent-command-catalog.json");
  const packageJsonPath = path.join(workspaceRoot, "package.json");
  const [runtimeIndex, installState, packageJson] = await Promise.all([
    tryReadJson<RuntimeIndexDocument>(runtimeIndexPath),
    tryReadJson<InstallStateDocument>(installStatePath),
    tryReadJson<PackageJsonDocument>(packageJsonPath)
  ]);

  const generatedAt = input.generatedAt ?? new Date().toISOString();
  const targetInputs =
    runtimeIndex?.targets && runtimeIndex.targets.length > 0
      ? runtimeIndex.targets
      : (installState?.installedTargets ?? []);
  const targets = targetInputs.map(buildTargetSummary);
  const commandCatalogExists = await exists(commandCatalogPath);
  const runtimeIndexExists = runtimeIndex !== null;
  const sourceRefs = [
    runtimeIndexExists ? `${RUNTIME_DIR}/${RUNTIME_INDEX_FILE}` : null,
    installState ? `${STATE_DIR}/install-state.json` : null,
    AGENT_MANIFEST_FILE,
    commandCatalogExists ? `${GENERATED_DIR}/agent-command-catalog.json` : null
  ].filter((entry): entry is string => entry !== null);

  return {
    schemaVersion: "1.0.0",
    workspace: {
      root: workspaceRoot,
      label: packageJson?.name ?? path.basename(workspaceRoot)
    },
    generatedAt,
    sourceRefs,
    detectedStack: inferStack(packageJson),
    targets,
    authoritativeSurfaces: [...new Set(defaultSurfaces(runtimeIndex))],
    commandResolution: [
      ".hforge/generated/bin/hforge.cmd",
      ".hforge/generated/bin/hforge.ps1",
      ".hforge/generated/bin/hforge",
      "hforge",
      "npx @harness-forge/cli"
    ],
    recommendedNextActions: [
      "Read this agent brief before broad repository scans.",
      "Inspect the command catalog when choosing a Harness Forge command.",
      "Run hforge status --root . --json when workspace state is unclear.",
      "Use hforge recommend . --json or hforge review --root . --json for deeper setup and health signals.",
      "Use hforge refresh --root . --json if runtime summaries appear stale."
    ],
    freshness: {
      status: runtimeIndexExists && commandCatalogExists ? "current" : runtimeIndexExists ? "partial" : "missing",
      reason:
        runtimeIndexExists && commandCatalogExists
          ? "Generated from current runtime index and command catalog state."
          : runtimeIndexExists
            ? "Runtime index exists, but command catalog was not found."
            : "Runtime index was not found, so the brief is using fallback posture.",
      recommendedAction:
        runtimeIndexExists && commandCatalogExists
          ? "Use this brief before broad repository scans."
          : "Run hforge refresh --root . --json or hforge init --root . --json to regenerate runtime orientation."
    },
    fallbackGuidance: [
      "If this brief is missing, run hforge refresh --root . --json in an installed workspace.",
      "If no local launcher exists, use bare hforge, then npx @harness-forge/cli as the final fallback.",
      "Do not claim full Cursor runtime parity; treat Cursor as compatible or partial unless target support metadata says otherwise."
    ],
    orientation: {
      firstRun: "Harness Forge is active for this workspace. Use this brief, AGENTS.md, and the command catalog before editing.",
      sessionStart: "For routine coding work, keep Harness Forge orientation short and start from the generated brief.",
      deeperWork: "For ambiguous, cross-module, high-risk, or long-context work, prefer hforge review, recommend, task, or recursive commands before broad manual scans."
    }
  };
}
