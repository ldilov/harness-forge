import type { BundleManifest, ProfileManifest } from "../../domain/manifests/index.js";
import { HarnessForgeError } from "../../shared/index.js";

export interface ResolvedBundleSet {
  selected: BundleManifest[];
  warnings: string[];
  conflicts: string[];
}

export function resolveBundles(
  bundles: BundleManifest[],
  profiles: ProfileManifest[],
  profileId: string | undefined,
  requestedBundleIds: string[]
): ResolvedBundleSet {
  const warnings: string[] = [];
  const conflicts: string[] = [];
  const bundleMap = new Map(bundles.map((bundle) => [bundle.id, bundle]));
  const profile = profileId ? profiles.find((item) => item.id === profileId) : undefined;
  const selectedIds = new Set<string>(requestedBundleIds);

  for (const id of profile?.bundleIds ?? []) {
    selectedIds.add(id);
  }

  const queue = [...selectedIds];
  while (queue.length > 0) {
    const bundleId = queue.shift();
    if (!bundleId) {
      continue;
    }

    const bundle = bundleMap.get(bundleId);
    if (!bundle) {
      throw new HarnessForgeError(`Unknown bundle id: ${bundleId}`, "UNKNOWN_BUNDLE");
    }

    for (const dependency of bundle.dependencies) {
      if (!selectedIds.has(dependency)) {
        selectedIds.add(dependency);
        queue.push(dependency);
      }
    }
  }

  const selected = [...selectedIds].map((id) => bundleMap.get(id)).filter(Boolean) as BundleManifest[];

  for (const bundle of selected) {
    const bundleConflicts = bundle.conflicts.filter((conflict) => selectedIds.has(conflict));
    if (bundleConflicts.length > 0) {
      conflicts.push(`${bundle.id} conflicts with ${bundleConflicts.join(", ")}`);
    }
    if (bundle.optional) {
      warnings.push(`${bundle.id} is optional and may require extra setup.`);
    }
  }

  return { selected, warnings: [...new Set(warnings)], conflicts: [...new Set(conflicts)] };
}
