export interface PostInstallBriefData {
  headline: string;
  repoType: string;
  selectedTargets: string[];
  selectedProfile: string;
  nextBestCommand: string;
}

export function formatPostInstallSummary(
  brief: PostInstallBriefData,
  briefPath: string
): string {
  return [
    `\n\u2705 ${brief.headline}`,
    `   Repo type: ${brief.repoType}`,
    `   Targets: ${brief.selectedTargets.join(", ")}`,
    `   Profile: ${brief.selectedProfile}`,
    `\n   Next: ${brief.nextBestCommand}`,
    `   Brief: ${briefPath}`
  ].join("\n");
}
