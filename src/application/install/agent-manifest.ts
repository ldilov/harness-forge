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
  commandExecution: {
    preferredOrder: string[];
    modes: Array<{
      id: string;
      platform: "any" | "windows" | "posix";
      commandPrefix: string;
      whenToUse: string;
    }>;
  };
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
  surfaces.set(
    ".hforge/runtime/recursive/language-capabilities.json",
    createSurface(
      ".hforge/runtime/recursive/language-capabilities.json",
      "runtime-state",
      "generated",
      "Canonical recursive structured-analysis capability map for language adapter depth and execution posture."
    )
  );
  surfaces.set(
    ".hforge/runtime/recursive/sessions",
    createSurface(
      ".hforge/runtime/recursive/sessions",
      "runtime-state",
      "hidden-canonical",
      "Session-scoped recursive runtime state, including structured runs, policy, summaries, and future promotion traces."
    )
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
    commandExecution: {
      preferredOrder: ["workspace-launcher-windows", "workspace-launcher-powershell", "workspace-launcher-posix", "bare-hforge", "npx-package"],
      modes: [
        {
          id: "workspace-launcher-windows",
          platform: "windows",
          commandPrefix: ".\\.hforge\\generated\\bin\\hforge.cmd",
          whenToUse: "Preferred in installed Windows workspaces when bare hforge is unavailable on PATH."
        },
        {
          id: "workspace-launcher-powershell",
          platform: "windows",
          commandPrefix: ".\\.hforge\\generated\\bin\\hforge.ps1",
          whenToUse: "Use in PowerShell when the CMD launcher is not the preferred shell entrypoint."
        },
        {
          id: "workspace-launcher-posix",
          platform: "posix",
          commandPrefix: "./.hforge/generated/bin/hforge",
          whenToUse: "Preferred in installed POSIX workspaces when bare hforge is unavailable on PATH."
        },
        {
          id: "bare-hforge",
          platform: "any",
          commandPrefix: "hforge",
          whenToUse: "Use when hforge is already available on PATH through shell setup or global install."
        },
        {
          id: "npx-package",
          platform: "any",
          commandPrefix: "npx @harness-forge/cli",
          whenToUse: "Fallback when no local launcher is available yet or when the agent is operating before install."
        }
      ]
    },
    surfaces: buildSurfaceIndex(runtimeIndex, launcherPaths),
    guidance: [
      "Treat AGENTS.md as the primary human-readable instruction entrypoint.",
      "Use .agents/skills/ for discovery and .hforge/library/skills/ for canonical execution contracts.",
      "Treat .hforge/library/, .hforge/templates/, .hforge/runtime/, .hforge/state/, and .hforge/generated/ as AI-layer surfaces rather than product code.",
      "Use .hforge/generated/agent-command-catalog.json to discover safe CLI commands before inventing your own execution path.",
      "Resolve command execution in this order: workspace launcher, bare hforge on PATH, then npx @harness-forge/cli.",
      "Use .hforge/runtime/recursive/language-capabilities.json to discover recursive structured-analysis support before attempting repository-wide recursive analysis.",
      "Use hforge recursive capabilities --root . --json, hforge recursive run <sessionId> --file <snippet> --json, hforge recursive run <sessionId> --stdin --json, hforge recursive runs <sessionId> --json, and hforge recursive inspect-run <sessionId> <runId> --json as the promoted recursive structured-analysis command family.",
      "Use hforge update --root . --yes or hforge update --root . --dry-run --yes to refresh managed Harness Forge surfaces without discarding gathered runtime state."
    ]
  };

  await writeJsonFile(manifestPath, manifest);
  return { path: manifestPath, manifest };
}
