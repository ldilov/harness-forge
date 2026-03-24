import fg from "fast-glob";

export interface MigrationMapping {
  sourceComponentId: string;
  detectedPaths: string[];
  suggestedBundleIds: string[];
  warnings: string[];
  manualFollowUps: string[];
}

export async function scanReferenceInstall(root: string): Promise<MigrationMapping[]> {
  const findings = await fg(["agents/*.md", "commands/*.md", "rules/**/*.md"], { cwd: root });

  if (findings.length === 0) {
    return [];
  }

  return [
    {
      sourceComponentId: "reference-package",
      detectedPaths: findings,
      suggestedBundleIds: ["baseline:agents", "baseline:commands", "baseline:rules"],
      warnings: ["Review renamed or unsupported components before apply."],
      manualFollowUps: ["Compare legacy hooks and target-specific settings."]
    }
  ];
}
