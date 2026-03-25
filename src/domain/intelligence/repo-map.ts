export interface RepoFact {
  id: string;
  confidence: number;
  evidence: string[];
}

export interface RepoServiceBoundary {
  id: string;
  path: string;
  classification: string;
}

export interface RepoMap {
  workspaceId: string;
  workspaceType: string;
  dominantLanguages: RepoFact[];
  frameworks: RepoFact[];
  services: RepoServiceBoundary[];
  criticalPaths: string[];
  highRiskPaths: string[];
  existingInstructionSurfaces: string[];
  qualityGaps: RepoFact[];
  supportingEvidence: string[];
}
