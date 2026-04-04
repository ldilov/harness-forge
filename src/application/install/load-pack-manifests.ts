import type { BundleManifest, ProfileManifest } from "../../domain/manifests/index.js";
import type { PackManifest, PackSelectionMode } from "../../domain/runtime/pack-manifest.js";

function inferManagedRoots(paths: string[]): string[] {
  const roots = new Set<string>();
  for (const entry of paths) {
    if (entry.startsWith("skills") || entry.startsWith(".agents/skills")) {
      roots.add(".hforge/library/skills");
    }
    if (entry.startsWith("rules")) {
      roots.add(".hforge/library/rules");
    }
    if (entry.startsWith("knowledge-bases")) {
      roots.add(".hforge/library/knowledge");
    }
    if (entry.startsWith("templates") || entry.startsWith(".specify")) {
      roots.add(".hforge/templates");
    }
    if (
      entry.startsWith("docs") ||
      entry.startsWith("commands") ||
      entry.startsWith("contexts") ||
      entry.startsWith("scripts")
    ) {
      roots.add(".hforge/runtime");
    }
    if (entry === "AGENTS.md" || entry.startsWith("targets")) {
      roots.add(".hforge/generated");
    }
  }

  if (roots.size === 0) {
    roots.add(".hforge/runtime");
  }

  return [...roots].sort((left, right) => left.localeCompare(right));
}

function inferKind(bundle: BundleManifest): string {
  if (bundle.family === "target-runtime") {
    return "target-runtime";
  }
  if (bundle.family === "baseline") {
    return "core";
  }
  return bundle.family;
}

function inferSelectionMode(
  bundle: BundleManifest,
  recommendedBundleIds: Set<string>
): PackSelectionMode {
  if (bundle.defaultInstall) {
    return "default";
  }
  if (recommendedBundleIds.has(bundle.id)) {
    return "profile";
  }
  return "explicit";
}

export function mapBundlesToPackManifests(
  bundles: BundleManifest[],
  profiles: ProfileManifest[] = []
): PackManifest[] {
  const recommendedBundleIds = new Set(
    profiles.flatMap((profile) => profile.bundleIds)
  );

  return bundles
    .map((bundle) => ({
      packId: bundle.id,
      title: bundle.id,
      description: bundle.description,
      kind: inferKind(bundle),
      sourceBundleIds: [bundle.id],
      dependsOn: bundle.dependencies,
      conflictsWith: bundle.conflicts,
      managedRoots: inferManagedRoots(bundle.paths),
      selectionMode: inferSelectionMode(bundle, recommendedBundleIds),
      optional: bundle.optional,
      defaultEnabled: bundle.defaultInstall,
      targetPosture: Object.fromEntries(
        bundle.targets.map((targetId) => [targetId, "full" as const])
      )
    }))
    .sort((left, right) => left.packId.localeCompare(right.packId));
}
