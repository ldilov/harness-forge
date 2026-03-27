import crypto from "node:crypto";
import path from "node:path";

import type { BundleManifest, ProfileManifest } from "../../domain/manifests/index.js";
import type { TargetAdapter } from "../../domain/targets/adapter.js";
import type {
  InstallPlan,
  InstallSelection,
  InstallOperation,
  VisibilityPolicySummary
} from "../../domain/operations/install-plan.js";
import { normalizeTargetPath } from "../../infrastructure/filesystem/normalize-target-path.js";
import {
  AI_LAYER_ROOT_DIR,
  AI_LAYER_VISIBLE_MODE,
  AI_LIBRARY_AGENTS_DIR,
  AI_LIBRARY_COMMANDS_DIR,
  AI_LIBRARY_CONTEXTS_DIR,
  AI_LIBRARY_DOCS_DIR,
  AI_LIBRARY_HOOKS_DIR,
  AI_LIBRARY_KNOWLEDGE_DIR,
  AI_LIBRARY_MANIFESTS_DIR,
  AI_LIBRARY_MCP_DIR,
  AI_LIBRARY_PROFILES_DIR,
  AI_LIBRARY_RULES_DIR,
  AI_LIBRARY_SCRIPTS_DIR,
  AI_LIBRARY_SCHEMAS_DIR,
  AI_LIBRARY_SKILLS_DIR,
  AI_LIBRARY_TARGETS_DIR,
  AI_TEMPLATES_DIR,
  AUTHORITATIVE_AI_LAYER_SURFACES,
} from "../../shared/index.js";
import { resolveBundles } from "../planning/resolve-bundles.js";
import { createSharedRuntimePlan } from "./shared-runtime.js";

interface CreateInstallPlanOptions {
  workspaceRoot?: string;
}

const CANONICAL_DESTINATION_MAPPINGS = [
  { source: "templates/workflows", destination: path.posix.join(AI_TEMPLATES_DIR, "workflows") },
  { source: "templates/tasks", destination: path.posix.join(AI_TEMPLATES_DIR, "tasks") },
  { source: "skills", destination: AI_LIBRARY_SKILLS_DIR },
  { source: "rules", destination: AI_LIBRARY_RULES_DIR },
  { source: "knowledge-bases", destination: AI_LIBRARY_KNOWLEDGE_DIR },
  { source: "agents", destination: AI_LIBRARY_AGENTS_DIR },
  { source: "commands", destination: AI_LIBRARY_COMMANDS_DIR },
  { source: "contexts", destination: AI_LIBRARY_CONTEXTS_DIR },
  { source: "docs", destination: AI_LIBRARY_DOCS_DIR },
  { source: "hooks", destination: AI_LIBRARY_HOOKS_DIR },
  { source: "manifests", destination: AI_LIBRARY_MANIFESTS_DIR },
  { source: "mcp", destination: AI_LIBRARY_MCP_DIR },
  { source: "profiles", destination: AI_LIBRARY_PROFILES_DIR },
  { source: "schemas", destination: AI_LIBRARY_SCHEMAS_DIR },
  { source: "scripts", destination: AI_LIBRARY_SCRIPTS_DIR },
  { source: "targets", destination: AI_LIBRARY_TARGETS_DIR }
] as const;

function mapCanonicalAssetPath(assetPath: string): string {
  for (const mapping of CANONICAL_DESTINATION_MAPPINGS) {
    if (assetPath === mapping.source) {
      return mapping.destination;
    }

    if (assetPath.startsWith(`${mapping.source}/`)) {
      return path.posix.join(mapping.destination, assetPath.slice(mapping.source.length + 1));
    }
  }

  return assetPath;
}

function createVisibilityPolicy(workspaceRoot: string, target: TargetAdapter): VisibilityPolicySummary {
  const bridge = target.sharedRuntimeBridge;
  const hiddenCanonicalRoots = (bridge?.authoritativeSurfaces ?? [...AUTHORITATIVE_AI_LAYER_SURFACES]).map((surface) =>
    normalizeTargetPath(workspaceRoot, surface)
  );
  const visibleBridgePaths = [
    ...new Set(bridge?.visibleBridgePaths ?? [...(bridge?.instructionSurfaces ?? ["AGENTS.md"]), ".agents/skills", ".specify"])
  ].map((surface) => normalizeTargetPath(workspaceRoot, surface));

  return {
    mode: bridge?.visibilityMode ?? AI_LAYER_VISIBLE_MODE,
    aiLayerRoot: normalizeTargetPath(workspaceRoot, AI_LAYER_ROOT_DIR),
    hiddenCanonicalRoots,
    visibleBridgePaths
  };
}

function createOperation(
  contentRoot: string,
  workspaceRoot: string,
  target: TargetAdapter,
  bundle: BundleManifest,
  assetPath: string
): InstallOperation {
  const destinationHint = target.pathMappings[assetPath] ?? mapCanonicalAssetPath(assetPath);
  const mergeStrategy = target.mergeRules[assetPath] ?? "copy";
  return {
    type:
      mergeStrategy === "append-once"
        ? "append-once"
        : mergeStrategy === "remove"
          ? "remove"
          : mergeStrategy === "skip"
            ? "skip"
            : mergeStrategy.startsWith("merge")
              ? "merge"
              : "copy",
    bundleId: bundle.id,
    sourcePath: path.join(contentRoot, assetPath),
    destinationPath: normalizeTargetPath(workspaceRoot, destinationHint),
    mergeStrategy,
    reason: `${bundle.id}:${assetPath}`,
    riskLevel: "low",
    backupRequired: true
  };
}

export function createInstallPlan(
  root: string,
  selection: InstallSelection,
  bundles: BundleManifest[],
  profiles: ProfileManifest[],
  target: TargetAdapter,
  options: CreateInstallPlanOptions = {}
): InstallPlan {
  const contentRoot = root;
  const workspaceRoot = options.workspaceRoot ?? selection.rootPath ?? root;

  const requestedBundleIds = [
    ...selection.bundleIds,
    ...selection.languageIds.map((id) => `lang:${id}`),
    ...selection.frameworkIds.map((id) => `framework:${id}`),
    ...selection.capabilityIds.map((id) => `capability:${id}`)
  ];

  const targetRuntimeBundle = `target-runtime:${selection.targetId}`;
  if (bundles.some((bundle) => bundle.id === targetRuntimeBundle) && !requestedBundleIds.includes(targetRuntimeBundle)) {
    requestedBundleIds.push(targetRuntimeBundle);
  }

  const resolved = resolveBundles(bundles, profiles, selection.profileId, requestedBundleIds);
  const operations = resolved.selected.flatMap((bundle) => {
    if (bundle.targets.length > 0 && !bundle.targets.includes(selection.targetId)) {
      resolved.warnings.push(`${bundle.id} does not target ${selection.targetId} and was skipped.`);
      return [];
    }
    return bundle.paths.map((assetPath) => createOperation(contentRoot, workspaceRoot, target, bundle, assetPath));
  });
  const visibilityPolicy = createVisibilityPolicy(workspaceRoot, target);
  const sharedRuntime = createSharedRuntimePlan(workspaceRoot, selection.targetId, target);
  const hash = crypto
    .createHash("sha256")
    .update(
      JSON.stringify({
        selection: { ...selection, rootPath: workspaceRoot },
        operations,
        visibilityPolicy,
        sharedRuntime
      })
    )
    .digest("hex");

  return {
    planId: crypto.randomUUID(),
    selection: { ...selection, rootPath: workspaceRoot },
    operations,
    visibilityPolicy,
    sharedRuntime,
    warnings: [...new Set(resolved.warnings)],
    conflicts: resolved.conflicts,
    backupRequirements: operations.filter((item) => item.backupRequired).map((item) => item.destinationPath),
    hash,
    validationSummary: [
      `${resolved.selected.length} bundles selected`,
      `${operations.length} operations planned`,
      `content root: ${contentRoot}`,
      `workspace root: ${workspaceRoot}`,
      `visibility: ${visibilityPolicy.mode}`,
      `shared runtime: ${sharedRuntime.rootDir}`
    ]
  };
}
