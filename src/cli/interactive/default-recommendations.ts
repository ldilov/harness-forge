import { discoverWorkspaceTargets } from "../../application/install/discover-workspace-targets.js";
import { exists } from "../../shared/index.js";
import type { OptionalModuleId, SetupProfileId } from "./setup-intent.js";

export interface SetupRecommendations {
  recommendedTargets: string[];
  recommendedProfile: SetupProfileId;
  recommendedModules: OptionalModuleId[];
  folderMode: "current-directory" | "custom-path" | "new-folder";
}

export async function recommendSetupDefaults(workspaceRoot: string): Promise<SetupRecommendations> {
  const discoveredTargets = await discoverWorkspaceTargets(workspaceRoot);
  const packageJsonPresent = await exists(`${workspaceRoot}/package.json`);
  const tsconfigPresent = await exists(`${workspaceRoot}/tsconfig.json`);
  const recommendedTargets = discoveredTargets.length > 0 ? discoveredTargets.map((item) => item.targetId) : ["codex"];
  const recommendedProfile: SetupProfileId = tsconfigPresent || packageJsonPresent ? "recommended" : "quick";
  const recommendedModules: OptionalModuleId[] =
    recommendedProfile === "recommended"
      ? ["working-memory", "task-pack-support", "export-support"]
      : ["export-support"];

  return {
    recommendedTargets,
    recommendedProfile,
    recommendedModules,
    folderMode: "current-directory"
  };
}
