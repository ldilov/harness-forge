import type { ProfileManifest } from "../../domain/manifests/index.js";
import type { RepoIntelligenceResult, RepoRecommendation } from "../../domain/intelligence/repo-intelligence.js";
import type {
  RecommendationEvidenceDocument,
  RecommendationEvidenceRecord
} from "../../domain/runtime/recommendation-evidence.js";

export function resolveProfile(profileId: string | undefined, profiles: ProfileManifest[]): ProfileManifest | null {
  if (!profileId) {
    return null;
  }

  return profiles.find((profile) => profile.id === profileId) ?? null;
}

function toEvidenceRecord(
  subjectType: RecommendationEvidenceRecord["subjectType"],
  subjectId: string,
  selectedBy: RecommendationEvidenceRecord["selectedBy"],
  recommendation: RepoRecommendation | undefined
): RecommendationEvidenceRecord {
  return {
    subjectType,
    subjectId,
    selectedBy,
    matchedRecommendation: Boolean(recommendation),
    ...(recommendation ? { confidence: recommendation.confidence, why: recommendation.why } : {}),
    evidence: recommendation?.evidence ?? [],
    source: recommendation ? "repo-intelligence" : "explicit-selection"
  };
}

export function buildRecommendationEvidence(
  profileId: string | undefined,
  packIds: string[],
  intelligence: RepoIntelligenceResult | null
): RecommendationEvidenceDocument {
  const profileRecommendations = new Map(
    (intelligence?.recommendations.profiles ?? []).map((recommendation) => [recommendation.id, recommendation])
  );
  const packRecommendations = new Map(
    (intelligence?.recommendations.bundles ?? []).map((recommendation) => [recommendation.id, recommendation])
  );

  const records: RecommendationEvidenceRecord[] = [];
  if (profileId) {
    const profileRecommendation = profileRecommendations.get(profileId);
    records.push(
      toEvidenceRecord(
        "profile",
        profileId,
        profileRecommendation ? "recommendation" : "profile",
        profileRecommendation
      )
    );
  }

  for (const packId of [...new Set(packIds)]) {
    const packRecommendation = packRecommendations.get(packId);
    records.push(
      toEvidenceRecord(
        "pack",
        packId,
        packRecommendation ? "recommendation" : profileId ? "profile" : "explicit",
        packRecommendation
      )
    );
  }

  return {
    generatedAt: intelligence?.generatedAt ?? new Date().toISOString(),
    records
  };
}
