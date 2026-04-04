import { Command } from "commander";
import path from "node:path";

import { loadProfileManifests } from "../../domain/manifests/index.js";
import type { RecommendationEvidenceDocument } from "../../domain/runtime/recommendation-evidence.js";
import {
  DEFAULT_WORKSPACE_ROOT,
  PACKAGE_ROOT,
  RECOMMENDATION_EVIDENCE_FILE,
  RUNTIME_DIR,
  RUNTIME_REPO_DIR,
  ValidationError,
  exists,
  readJsonFile
} from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

async function loadRecommendationEvidence(workspaceRoot: string): Promise<RecommendationEvidenceDocument | null> {
  const evidencePath = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_REPO_DIR, RECOMMENDATION_EVIDENCE_FILE);
  if (!(await exists(evidencePath))) {
    return null;
  }
  return readJsonFile<RecommendationEvidenceDocument>(evidencePath);
}

export function registerProfileCommands(program: Command): void {
  const profile = program.command("profile").description("Inspect install profiles used by runtime packs.");

  profile
    .command("list")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const [profiles, evidence] = await Promise.all([
        loadProfileManifests(PACKAGE_ROOT),
        loadRecommendationEvidence(workspaceRoot)
      ]);
      const result = {
        workspaceRoot,
        profiles,
        recommendationEvidence: evidence?.records.filter((record) => record.subjectType === "profile") ?? []
      };
      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });

  profile
    .command("inspect <profileId>")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (profileId, options) => {
      const workspaceRoot = path.resolve(options.root);
      const [profiles, evidence] = await Promise.all([
        loadProfileManifests(PACKAGE_ROOT),
        loadRecommendationEvidence(workspaceRoot)
      ]);
      const profile = profiles.find((entry) => entry.id === profileId);
      if (!profile) {
        throw new ValidationError(`Profile ${profileId} not found.`);
      }
      const result = {
        profile,
        recommendationEvidence:
          evidence?.records.filter((record) => record.subjectType === "profile" && record.subjectId === profileId) ?? []
      };
      console.log(options.json ? toJson(result) : JSON.stringify(result, null, 2));
    });
}
