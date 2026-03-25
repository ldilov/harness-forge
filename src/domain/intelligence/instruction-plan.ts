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
  recommendations: InstructionRecommendation[];
  recommendedProfiles: string[];
  recommendedSkills: string[];
  generatedArtifacts: string[];
  riskNotes: string[];
}
