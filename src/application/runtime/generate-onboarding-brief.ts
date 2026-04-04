import path from "node:path";

import type { OnboardingBrief } from "../../domain/runtime/onboarding-brief.js";
import {
  ONBOARDING_BRIEF_SCHEMA_VERSION,
  RUNTIME_DIR,
  RUNTIME_REPO_DIR,
  ONBOARDING_BRIEF_FILE,
  ensureDir,
  writeJsonFile
} from "../../shared/index.js";

export interface OnboardingBriefInput {
  workspaceRoot: string;
  repoType: string;
  detectedLanguages: string[];
  detectedFrameworks: string[];
  keyBoundaries: string[];
  selectedTargets: string[];
  selectedProfile: string;
  recommendedBundles: string[];
}

export async function generateOnboardingBrief(input: OnboardingBriefInput): Promise<OnboardingBrief> {
  const headline = `${input.repoType} repo with ${input.detectedLanguages[0] ?? "unknown"} — targets: ${input.selectedTargets.join(", ")}`;

  const brief: OnboardingBrief = {
    schemaVersion: ONBOARDING_BRIEF_SCHEMA_VERSION,
    generatedAt: new Date().toISOString(),
    repoType: input.repoType,
    detectedLanguages: input.detectedLanguages,
    detectedFrameworks: input.detectedFrameworks,
    keyBoundaries: input.keyBoundaries,
    selectedTargets: input.selectedTargets,
    selectedProfile: input.selectedProfile,
    recommendedBundles: input.recommendedBundles,
    primaryWorkflowRecommendation:
      "Run recommend to get repo-aware guidance, then review to inspect runtime health.",
    nextBestCommand: "hforge recommend --root . --json",
    alternateCommands: [
      "hforge review --root . --json",
      "hforge status --root . --json"
    ].slice(0, 2),
    knownCautions: [],
    headline
  };

  const repoDir = path.join(input.workspaceRoot, RUNTIME_DIR, RUNTIME_REPO_DIR);
  await ensureDir(repoDir);
  await writeJsonFile(path.join(repoDir, ONBOARDING_BRIEF_FILE), brief);
  return brief;
}
