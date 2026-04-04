import { RUNTIME_DIR } from "../../shared/index.js";

export interface OrientationPack {
  profileId: string;
  maxFirstHopTokens: number;
  requiredSurfaces: string[];
  loadOrder: string[];
}

export function buildOrientationPack(profileId: string, maxFirstHopTokens = 8000): OrientationPack {
  const requiredSurfaces = [
    "AGENTS.md",
    ".hforge/agent-manifest.json",
    `${RUNTIME_DIR}/index.json`,
    `${RUNTIME_DIR}/authority-map.json`,
    `${RUNTIME_DIR}/context-budget.json`
  ];

  return {
    profileId,
    maxFirstHopTokens,
    requiredSurfaces,
    loadOrder: [...requiredSurfaces]
  };
}
