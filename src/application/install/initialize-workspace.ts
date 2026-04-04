import path from "node:path";

import type { InstallStateRecord } from "../../domain/state/install-state.js";
import { loadInstallState, saveInstallState } from "../../domain/state/install-state.js";
import {
  AGENT_MANIFEST_FILE,
  AI_LAYER_ROOT_DIR,
  AI_LAYER_VISIBLE_MODE,
  AI_LIBRARY_KNOWLEDGE_DIR,
  AI_LIBRARY_RULES_DIR,
  AI_LIBRARY_SKILLS_DIR,
  AI_TEMPLATES_DIR,
  GENERATED_DIR,
  PACKAGE_ROOT,
  RUNTIME_DIR,
  RUNTIME_INDEX_FILE,
  RUNTIME_README_FILE,
  RUNTIME_SCHEMA_VERSION,
  STATE_DIR,
  ensureDir,
  exists,
  readJsonFile,
  writeJsonFile,
  writeTextFile
} from "../../shared/index.js";
import { StartupFileGenerator } from "../behavior/startup-file-generator.js";
import { writeAgentManifest } from "./agent-manifest.js";
import { writeWorkspaceLaunchers } from "./workspace-launcher.js";

interface RuntimeInitDocument {
  version: number;
  runtimeSchemaVersion: number;
  packageVersion: string;
  runtimeId: string;
  initializedAt: string;
  generatedAt: string;
  rootDir: string;
  visibilityMode: string;
  authoritativeSurfaces: string[];
  visibleBridgePaths: string[];
  durableSurfaces: Array<{ id: string; path: string; description: string }>;
  cacheSurfaces: Array<{ id: string; path: string; description: string }>;
  targets: Array<{ targetId: string; displayName: string; supportMode: string; instructionSurfaces: string[]; runtimeSurfaces: string[] }>;
  discoveryBridges: Array<{ id: string; targetId: string; kind: string; path: string; supportMode: string; description: string }>;
  baselineArtifacts: Array<{ id: string; kind: string; path: string; description: string; source: string }>;
  installStateRef: string;
  recoveryGuidanceRef: string;
}

export interface InitializeWorkspaceResult {
  root: string;
  stateDir: string;
  runtimeDir: string;
  statePath: string;
  runtimeIndexPath: string;
  runtimeReadmePath: string;
  guidancePath: string;
  agentManifestPath: string;
  launcherPaths: string[];
  changedFiles: string[];
  installState: InstallStateRecord;
}

function buildRecoveryHints(workspaceRoot: string): string[] {
  return [
    `Rerun "hforge init --root ${workspaceRoot}" safely if initialization was interrupted.`,
    `Use "hforge doctor --root ${workspaceRoot}" to inspect drift or missing runtime surfaces.`,
    `Use "hforge refresh --root ${workspaceRoot}" after an install to regenerate shared runtime summaries.`
  ];
}

function renderRuntimeReadme(runtimeIndex: RuntimeInitDocument): string {
  return [
    "# Harness Forge Runtime",
    "",
    "This workspace is initialized for Harness Forge production-style operation.",
    "",
    `- runtime schema version: \`${runtimeIndex.runtimeSchemaVersion}\``,
    `- package version: \`${runtimeIndex.packageVersion}\``,
    `- hidden AI layer root: \`${AI_LAYER_ROOT_DIR}\``,
    `- agent manifest: \`${AGENT_MANIFEST_FILE}\``,
    `- install state: \`${runtimeIndex.installStateRef}\``,
    `- recovery guidance: \`${runtimeIndex.recoveryGuidanceRef}\``,
    "",
    "The workspace can be initialized repeatedly without deleting existing runtime state.",
    "Once targets are installed, re-run `hforge refresh --root <repo>` to rewrite the shared runtime summary and repo-intelligence baselines."
  ].join("\n") + "\n";
}

export async function initializeWorkspace(
  workspaceRoot: string,
  packageRoot = PACKAGE_ROOT
): Promise<InitializeWorkspaceResult> {
  const packageJson = await readJsonFile<{ version: string }>(path.join(packageRoot, "package.json"));
  const timestamp = new Date().toISOString();
  const stateDir = path.join(workspaceRoot, STATE_DIR);
  const runtimeDir = path.join(workspaceRoot, RUNTIME_DIR);
  const statePath = path.join(stateDir, "install-state.json");
  const runtimeIndexPath = path.join(runtimeDir, RUNTIME_INDEX_FILE);
  const runtimeReadmePath = path.join(runtimeDir, RUNTIME_README_FILE);
  const guidancePath = path.join(stateDir, "post-install-guidance.txt");
  const agentManifestPath = path.join(workspaceRoot, AGENT_MANIFEST_FILE);

  await Promise.all([
    ensureDir(stateDir),
    ensureDir(runtimeDir),
    ensureDir(path.join(workspaceRoot, GENERATED_DIR)),
    ensureDir(path.join(workspaceRoot, AI_LIBRARY_SKILLS_DIR)),
    ensureDir(path.join(workspaceRoot, AI_LIBRARY_RULES_DIR)),
    ensureDir(path.join(workspaceRoot, AI_LIBRARY_KNOWLEDGE_DIR)),
    ensureDir(path.join(workspaceRoot, AI_TEMPLATES_DIR))
  ]);

  const [existingState, existingRuntimeIndex] = await Promise.all([
    loadInstallState(workspaceRoot),
    (async () => ((await exists(runtimeIndexPath)) ? readJsonFile<RuntimeInitDocument>(runtimeIndexPath) : null))()
  ]);

  const runtimeIndex: RuntimeInitDocument = {
    version: existingRuntimeIndex?.version ?? RUNTIME_SCHEMA_VERSION,
    runtimeSchemaVersion: RUNTIME_SCHEMA_VERSION,
    packageVersion: packageJson.version,
    runtimeId: existingRuntimeIndex?.runtimeId ?? "workspace-runtime",
    initializedAt: existingRuntimeIndex?.initializedAt ?? timestamp,
    generatedAt: timestamp,
    rootDir: ".hforge/runtime",
    visibilityMode: existingRuntimeIndex?.visibilityMode ?? AI_LAYER_VISIBLE_MODE,
    authoritativeSurfaces:
      existingRuntimeIndex?.authoritativeSurfaces ?? [
        ".hforge/library/skills",
        ".hforge/library/rules",
        ".hforge/library/knowledge",
        ".hforge/templates",
        ".hforge/runtime",
        ".hforge/state",
        ".hforge/generated"
      ],
    visibleBridgePaths: existingRuntimeIndex?.visibleBridgePaths ?? ["AGENTS.md", ".agents/skills", ".specify"],
    durableSurfaces:
      existingRuntimeIndex?.durableSurfaces ?? [
        { id: "library-skills", path: ".hforge/library/skills", description: "Canonical installed skill library." },
        { id: "library-rules", path: ".hforge/library/rules", description: "Canonical installed engineering rules." },
        { id: "library-knowledge", path: ".hforge/library/knowledge", description: "Canonical installed knowledge packs." },
        { id: "templates", path: ".hforge/templates", description: "Canonical installed task and workflow templates." },
        { id: "runtime", path: ".hforge/runtime", description: "Shared runtime, task artifacts, and repo intelligence." }
      ],
    cacheSurfaces:
      existingRuntimeIndex?.cacheSurfaces ?? [
        { id: "cache", path: ".hforge/runtime/cache", description: "Compact working-memory and cache surfaces." }
      ],
    targets: existingRuntimeIndex?.targets ?? [],
    discoveryBridges: existingRuntimeIndex?.discoveryBridges ?? [],
    baselineArtifacts: existingRuntimeIndex?.baselineArtifacts ?? [],
    installStateRef: ".hforge/state/install-state.json",
    recoveryGuidanceRef: ".hforge/state/post-install-guidance.txt"
  };

  const installState: InstallStateRecord = {
    version: existingState?.version ?? 2,
    packageVersion: packageJson.version,
    runtimeSchemaVersion: RUNTIME_SCHEMA_VERSION,
    installedTargets: existingState?.installedTargets ?? [],
    installedBundles: existingState?.installedBundles ?? [],
    appliedPlanHash: existingState?.appliedPlanHash ?? "",
    fileWrites: [...new Set([...(existingState?.fileWrites ?? []), statePath, runtimeIndexPath, runtimeReadmePath, guidancePath])],
    backupSnapshots: existingState?.backupSnapshots ?? [],
    timestamps: {
      createdAt: existingState?.timestamps.createdAt ?? timestamp,
      updatedAt: timestamp
    },
    lastValidationStatus: existingState?.lastValidationStatus ?? "unknown",
    visibilityMode: existingState?.visibilityMode ?? AI_LAYER_VISIBLE_MODE,
    aiLayerRoot: existingState?.aiLayerRoot ?? path.join(workspaceRoot, AI_LAYER_ROOT_DIR),
    hiddenCanonicalRoots:
      existingState?.hiddenCanonicalRoots ?? [
        path.join(workspaceRoot, AI_LIBRARY_SKILLS_DIR),
        path.join(workspaceRoot, AI_LIBRARY_RULES_DIR),
        path.join(workspaceRoot, AI_LIBRARY_KNOWLEDGE_DIR),
        path.join(workspaceRoot, AI_TEMPLATES_DIR),
        path.join(workspaceRoot, RUNTIME_DIR)
      ],
    visibleBridgePaths: existingState?.visibleBridgePaths ?? [
      path.join(workspaceRoot, "AGENTS.md"),
      path.join(workspaceRoot, ".agents", "skills"),
      path.join(workspaceRoot, ".specify")
    ],
    lastAction: "init",
    recoveryHints: buildRecoveryHints(workspaceRoot)
  };

  const guidance = [
    "Harness Forge initialization completed.",
    "",
    `Workspace root: ${workspaceRoot}`,
    `Runtime schema version: ${RUNTIME_SCHEMA_VERSION}`,
    `Package version: ${packageJson.version}`,
    "",
    `Agent manifest: ${path.join(workspaceRoot, AGENT_MANIFEST_FILE)}`,
    "",
    "Local launchers:",
    `- Windows CMD: ${path.join(workspaceRoot, GENERATED_DIR, "bin", "hforge.cmd")}`,
    `- PowerShell: ${path.join(workspaceRoot, GENERATED_DIR, "bin", "hforge.ps1")}`,
    `- POSIX shell: ${path.join(workspaceRoot, GENERATED_DIR, "bin", "hforge")}`,
    "",
    "Next steps:",
    '- run "hforge install --target codex --root <repo> --yes" for an explicit target install',
    '- or run "hforge bootstrap --root <repo> --yes" to autodetect and install recommended surfaces',
    '- use the generated local launcher when you do not want a global npm install',
    '- run "hforge shell setup --yes" if you want bare hforge available on PATH without a global install',
    '- or run "npm install -g @harness-forge/cli" if you prefer a global npm-managed install',
    '- rerun "hforge init --root <repo>" safely if setup was interrupted',
    '- use "hforge doctor --root <repo>" if runtime state looks incomplete'
  ].join("\n") + "\n";

  const launchers = await writeWorkspaceLaunchers(workspaceRoot);
  const launcherPaths = [launchers.cmdPath, launchers.ps1Path, launchers.shellPath];

  await Promise.all([
    saveInstallState(workspaceRoot, installState),
    writeJsonFile(runtimeIndexPath, runtimeIndex),
    writeTextFile(runtimeReadmePath, renderRuntimeReadme(runtimeIndex)),
    writeTextFile(guidancePath, guidance)
  ]);
  await writeAgentManifest(workspaceRoot, packageRoot);

  // Generate behavior promotion startup files
  const startupGenerator = new StartupFileGenerator(workspaceRoot);
  await startupGenerator.generate();

  return {
    root: workspaceRoot,
    stateDir,
    runtimeDir,
    statePath,
    runtimeIndexPath,
    runtimeReadmePath,
    guidancePath,
    agentManifestPath,
    launcherPaths,
    changedFiles: [statePath, runtimeIndexPath, runtimeReadmePath, guidancePath, agentManifestPath, ...launcherPaths],
    installState
  };
}
