import path from "node:path";

import type { OnboardingBrief } from "../../domain/runtime/onboarding-brief.js";
import {
  RUNTIME_DIR,
  RUNTIME_REPO_DIR,
  ONBOARDING_BRIEF_MD_FILE,
  ensureDir,
  writeTextFile
} from "../../shared/index.js";

export function renderOnboardingBriefMarkdown(brief: OnboardingBrief): string {
  const sections: string[] = [];

  sections.push(`# ${brief.headline}`);
  sections.push(`> Generated at ${brief.generatedAt}`);

  sections.push("## Detected Languages");
  sections.push(
    brief.detectedLanguages.length > 0
      ? brief.detectedLanguages.map((lang) => `- ${lang}`).join("\n")
      : "_none detected_"
  );

  sections.push("## Detected Frameworks");
  sections.push(
    brief.detectedFrameworks.length > 0
      ? brief.detectedFrameworks.map((fw) => `- ${fw}`).join("\n")
      : "_none detected_"
  );

  sections.push("## Key Boundaries");
  sections.push(
    brief.keyBoundaries.length > 0
      ? brief.keyBoundaries.map((boundary) => `- ${boundary}`).join("\n")
      : "_none identified_"
  );

  sections.push("## Selected Targets");
  sections.push(brief.selectedTargets.map((target) => `- ${target}`).join("\n"));

  sections.push("## Recommended Bundles");
  sections.push(
    brief.recommendedBundles.length > 0
      ? brief.recommendedBundles.map((bundle) => `- ${bundle}`).join("\n")
      : "_none_"
  );

  sections.push("## Next Command");
  sections.push(`\`\`\`\n${brief.nextBestCommand}\n\`\`\``);

  if (brief.alternateCommands.length > 0) {
    sections.push("## Alternate Commands");
    sections.push(brief.alternateCommands.map((cmd) => `- \`${cmd}\``).join("\n"));
  }

  if (brief.knownCautions.length > 0) {
    sections.push("## Cautions");
    sections.push(brief.knownCautions.map((caution) => `- ${caution}`).join("\n"));
  }

  return sections.join("\n\n") + "\n";
}

export async function writeOnboardingBriefMarkdown(
  workspaceRoot: string,
  brief: OnboardingBrief
): Promise<string> {
  const repoDir = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_REPO_DIR);
  await ensureDir(repoDir);
  const mdPath = path.join(repoDir, ONBOARDING_BRIEF_MD_FILE);
  const content = renderOnboardingBriefMarkdown(brief);
  await writeTextFile(mdPath, content);
  return mdPath;
}
