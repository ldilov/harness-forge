import { type SurfaceTier } from "../../domain/runtime/authority-and-dedup.js";

export interface SurfaceTierEntry {
  surfacePath: string;
  tier: SurfaceTier;
  defaultInclusion: boolean;
  dropOrderRank: number;
}

export interface SurfaceTierIndex {
  schemaVersion: string;
  generatedAt: string;
  entries: SurfaceTierEntry[];
}

export function buildSurfaceTierIndex(entries: SurfaceTierEntry[]): SurfaceTierIndex {
  return {
    schemaVersion: "1.0.0",
    generatedAt: new Date().toISOString(),
    entries: [...entries].sort((a, b) => a.surfacePath.localeCompare(b.surfacePath))
  };
}
