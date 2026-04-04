import type { BundleManifest } from "../../domain/manifests/index.js";

export interface PackFootprintSummary {
  packId: string;
  files: number;
  managedRoots: string[];
}

export function summarizePackFootprint(bundles: BundleManifest[]): PackFootprintSummary[] {
  return bundles.map((bundle) => ({
    packId: bundle.id,
    files: bundle.paths.length,
    managedRoots: [...new Set(bundle.paths.map((entry) => entry.split("/")[0] ?? entry))].sort((left, right) =>
      left.localeCompare(right)
    )
  }));
}
