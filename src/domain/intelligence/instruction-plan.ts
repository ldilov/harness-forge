export interface InstructionRecommendation {
  path: string;
  surfaceType: string;
  reason: string;
  confidence: number;
  evidence: string[];
  writeMode: "recommend-only" | "diff" | "write";
}

export interface InstructionPlan {
  workspaceId: string;
  targetId: string;
  scopeStrategy: "root-only" | "mixed-scope" | "scoped-heavy";
  generatedAt?: string;
  sharedRuntimeRoot?: string;
  sharedRuntimeBridges?: string[];
  sharedRuntimeArtifacts?: string[];
  authoritativeAiLayerRoot?: string;
  authoritativeHiddenSurfaces?: string[];
  visibleBridgePaths?: string[];
  recommendations: InstructionRecommendation[];
  recommendedProfiles: string[];
  recommendedSkills: string[];
  generatedArtifacts: string[];
  riskNotes: string[];
}
