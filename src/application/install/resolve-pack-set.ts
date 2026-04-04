import type { BundleManifest } from "../../domain/manifests/index.js";
import type { PackManifest } from "../../domain/runtime/pack-manifest.js";

export interface ResolvedPackSet {
  packs: PackManifest[];
  conflicts: string[];
  missingDependencies: string[];
}

export function resolvePackSet(
  packManifests: PackManifest[],
  selectedBundleIds: string[],
  bundles: BundleManifest[]
): ResolvedPackSet {
  const packById = new Map(packManifests.map((pack) => [pack.packId, pack]));
  const selectedIds = new Set(
    selectedBundleIds.length > 0
      ? selectedBundleIds
      : bundles.filter((bundle) => bundle.defaultInstall).map((bundle) => bundle.id)
  );
  const resolvedIds = new Set<string>();
  const packs: PackManifest[] = [];
  const conflicts = new Set<string>();
  const missingDependencies = new Set<string>();

  const visit = (packId: string): void => {
    if (resolvedIds.has(packId)) {
      return;
    }

    const pack = packById.get(packId);
    if (!pack) {
      return;
    }

    resolvedIds.add(packId);
    packs.push(pack);

    for (const dependency of pack.dependsOn) {
      if (!packById.has(dependency)) {
        missingDependencies.add(`${pack.packId} requires missing dependency ${dependency}`);
        continue;
      }
      visit(dependency);
    }

    for (const conflict of pack.conflictsWith) {
      if (selectedIds.has(conflict) || resolvedIds.has(conflict)) {
        conflicts.add(`${pack.packId} conflicts with ${conflict}`);
      }
    }
  };

  for (const selectedId of selectedIds) {
    visit(selectedId);
  }

  return {
    packs: packs.sort((left, right) => left.packId.localeCompare(right.packId)),
    conflicts: [...conflicts].sort((left, right) => left.localeCompare(right)),
    missingDependencies: [...missingDependencies].sort((left, right) => left.localeCompare(right))
  };
}
