import path from "node:path";

import type { InstallStateRecord } from "../../domain/state/install-state.js";
import {
  AGENT_MANIFEST_FILE,
  AI_LAYER_ROOT_DIR,
  AI_LAYER_VISIBLE_MODE,
  GENERATED_DIR,
  PACKAGE_ROOT,
  readJsonFile,
  RUNTIME_DIR,
  RUNTIME_INDEX_FILE,
  STATE_DIR,
  exists,
  writeJsonFile
} from "../../shared/index.js";

interface RuntimeTargetSummary {
  targetId: string;
  displayName: string;
  supportMode: string;
  instructionSurfaces: string[];
  runtimeSurfaces: string[];
}

interface RuntimeIndexDocument {
  runtimeSchemaVersion?: number;
  packageVersion?: string;
  visibilityMode?: string;
  authoritativeSurfaces?: string[];
  visibleBridgePaths?: string[];
  targets?: RuntimeTargetSummary[];
}

interface AgentManifestSurface {
  path: string;
  category:
    | "entrypoint"
    | "discovery"
    | "instruction-library"
    | "runtime-state"
    | "state"
    | "generated"
    | "launcher"
    | "target-runtime";
  visibility: "visible-bridge" | "hidden-canonical" | "generated";
  treatAsProductCode: false;
  description: string;
}

export interface AgentManifest {
  version: number;
  generatedAt: string;
  packageName: string;
  packageVersion: string;
  runtimeSchemaVersion: number | null;
  aiLayerRoot: string;
  visibilityMode: string;
  entrypoints: {
    canonicalInstructionFile: string;
    machineReadableManifest: string;
    sharedRuntimeIndex: string;
    commandCatalog: string;
    installState: string;
  };
  resolutionOrder: string[];
  visibleBridgePaths: string[];
  authoritativeSurfaces: string[];
  installedTargets: Array<{
    targetId: string;
    displayName: string;
    supportMode: string;
    instructionSurfaces: string[];
    runtimeSurfaces: string[];
  }>;
  localLaunchers: string[];
  surfaces: AgentManifestSurface[];
  guidance: string[];
}

async function tryReadJson<T>(filePath: string): Promise<T | null> {
  if (!(await exists(filePath))) {
    return null;
  }
  return readJsonFile<T>(filePath);
}

function toPortablePath(value: string): string {
  return value.replaceAll("\\", "/");
}

function createSurface(
  pathValue: string,
  category: AgentManifestSurface["category"],
  visibility: AgentManifestSurface["visibility"],
  description: string
): AgentManifestSurface {
  return {
    path: pathValue,
    category,
    visibility,
    treatAsProductCode: false,
    description
  };
}

function getLocalLauncherPaths(): string[] {
  return [
    `${GENERATED_DIR}/bin/hforge.cmd`,
    `${GENERATED_DIR}/bin/hforge.ps1`,
    `${GENERATED_DIR}/bin/hforge`
  ];
}

function buildSurfaceIndex(runtime: RuntimeIndexDocument | null, launchers: string[]): AgentManifestSurface[] {
  const surfaces = new Map<string, AgentManifestSurface>();
  const visibleBridges = runtime?.visibleBridgePaths ?? ["AGENTS.md", ".agents/skills", ".specify"];
  const authoritative = runtime?.authoritativeSurfaces ?? [
    ".hforge/library/skills",
    ".hforge/library/rules",
    ".hforge/library/knowledge",
    ".hforge/templates",
    ".hforge/runtime",
    ".hforge/state",
    ".hforge/generated"
  ];

  surfaces.set(
    "AGENTS.md",
    createSurface("AGENTS.md", "entrypoint", "visible-bridge", "Canonical human-readable instruction entrypoint for compatible agents.")
  );
  surfaces.set(
    ".agents/skills",
    createSurface(".agents/skills", "discovery", "visible-bridge", "Discovery wrappers that route agents into the hidden canonical skill library.")
  );
  surfaces.set(
    ".specify",
    createSurface(".specify", "discovery", "visible-bridge", "Structured feature flow helpers for spec, plan, tasks, and implementation.")
  );

  for (const bridgePath of visibleBridges) {
    if (bridgePath === "AGENTS.md" || bridgePath === ".agents/skills" || bridgePath === ".specify") {
      continue;
    }
    const category = bridgePath.startsWith(".codex") || bridgePath.startsWith(".claude") ? "target-runtime" : "discovery";
    surfaces.set(
      bridgePath,
      createSurface(bridgePath, category, "visible-bridge", "Visible bridge surface that helps a target runtime discover the hidden AI layer.")
    );
  }

  for (const surfacePath of authoritative) {
    const category =
      surfacePath === ".hforge/runtime"
        ? "runtime-state"
        : surfacePath === ".hforge/state"
          ? "state"
          : surfacePath === ".hforge/generated"
            ? "generated"
            : "instruction-library";
    const description =
      surfacePath === ".hforge/runtime"
        ? "Shared runtime, repo intelligence, task artifacts, and recursive session state."
        : surfacePath === ".hforge/state"
          ? "Install-state and recovery guidance for the current workspace."
          : surfacePath === ".hforge/generated"
            ? "Generated helper outputs such as command catalogs and local launchers."
            : "Canonical hidden AI-layer content used by compatible agents.";
    const visibility = surfacePath === ".hforge/generated" ? "generated" : "hidden-canonical";
    surfaces.set(surfacePath, createSurface(surfacePath, category, visibility, description));
  }

  surfaces.set(
    AGENT_MANIFEST_FILE,
    createSurface(AGENT_MANIFEST_FILE, "generated", "generated", "Machine-readable custom-agent manifest describing bridges, canonical roots, and safe command discovery.")
  );

  for (const launcherPath of launchers) {
    surfaces.set(
      launcherPath,
      createSurface(launcherPath, "launcher", "generated", "Workspace-local launcher that runs Harness Forge without requiring a global install.")
    );
  }

  return [...surfaces.values()].sort((left, right) => left.path.localeCompare(right.path));
}

export async function writeAgentManifest(
  workspaceRoot: string,
  packageRoot = PACKAGE_ROOT
): Promise<{ path: string; manifest: AgentManifest }> {
  const [packageJson, runtimeIndex, installState] = await Promise.all([
    readJsonFile<{ name: string; version: string }>(path.join(packageRoot, "package.json")),
    tryReadJson<RuntimeIndexDocument>(path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_INDEX_FILE)),
    tryReadJson<InstallStateRecord>(path.join(workspaceRoot, STATE_DIR, "install-state.json"))
  ]);

  const launcherPaths = getLocalLauncherPaths();
  const manifestPath = path.join(workspaceRoot, AGENT_MANIFEST_FILE);
  const installedTargets =
    runtimeIndex?.targets?.map((target) => ({
      targetId: target.targetId,
      displayName: target.displayName,
      supportMode: target.supportMode,
      instructionSurfaces: target.instructionSurfaces,
      runtimeSurfaces: target.runtimeSurfaces
    })) ??
    (installState?.installedTargets ?? []).map((targetId) => ({
      targetId,
      displayName: targetId,
      supportMode: "unknown",
      instructionSurfaces: [],
      runtimeSurfaces: []
    }));

  const manifest: AgentManifest = {
    version: 1,
    generatedAt: new Date().toISOString(),
    packageName: packageJson.name,
    packageVersion: runtimeIndex?.packageVersion ?? packageJson.version,
    runtimeSchemaVersion: runtimeIndex?.runtimeSchemaVersion ?? installState?.runtimeSchemaVersion ?? null,
    aiLayerRoot: AI_LAYER_ROOT_DIR,
    visibilityMode: runtimeIndex?.visibilityMode ?? installState?.visibilityMode ?? AI_LAYER_VISIBLE_MODE,
    entrypoints: {
      canonicalInstructionFile: "AGENTS.md",
      machineReadableManifest: AGENT_MANIFEST_FILE,
      sharedRuntimeIndex: `${RUNTIME_DIR}/${RUNTIME_INDEX_FILE}`,
      commandCatalog: `${GENERATED_DIR}/agent-command-catalog.json`,
      installState: `${STATE_DIR}/install-state.json`
    },
    resolutionOrder: [
      "AGENTS.md",
      ".hforge/agent-manifest.json",
      ".hforge/runtime/index.json",
      ".hforge/generated/agent-command-catalog.json",
      ".agents/skills/<skill>/SKILL.md",
      ".hforge/library/skills/<skill>/SKILL.md"
    ],
    visibleBridgePaths:
      runtimeIndex?.visibleBridgePaths ??
      (installState?.visibleBridgePaths?.map((entry) => toPortablePath(path.relative(workspaceRoot, entry))) ?? ["AGENTS.md", ".agents/skills", ".specify"]),
    authoritativeSurfaces:
      runtimeIndex?.authoritativeSurfaces ??
      (installState?.hiddenCanonicalRoots?.map((entry) => toPortablePath(path.relative(workspaceRoot, entry))) ?? [
        ".hforge/library/skills",
        ".hforge/library/rules",
        ".hforge/library/knowledge",
        ".hforge/templates",
        ".hforge/runtime",
        ".hforge/state",
        ".hforge/generated"
      ]),
    installedTargets,
    localLaunchers: launcherPaths,
    surfaces: buildSurfaceIndex(runtimeIndex, launcherPaths),
    guidance: [
      "Treat AGENTS.md as the primary human-readable instruction entrypoint.",
      "Use .agents/skills/ for discovery and .hforge/library/skills/ for canonical execution contracts.",
      "Treat .hforge/library/, .hforge/templates/, .hforge/runtime/, .hforge/state/, and .hforge/generated/ as AI-layer surfaces rather than product code.",
      "Use .hforge/generated/agent-command-catalog.json to discover safe CLI commands before inventing your own execution path."
    ]
  };

  await writeJsonFile(manifestPath, manifest);
  return { path: manifestPath, manifest };
}
