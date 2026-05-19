import fs from "node:fs/promises";
import { ensureDir, exists } from "../../shared/fs.js";
import { withPathLock } from "../../shared/path-mutex.js";
import {
  parseImpactAnalysis,
  type ImpactAnalysis,
} from "../../domain/cartographer/impact/impact-report.js";
import {
  cartographerImpactDir,
  cartographerImpactJsonPath,
  cartographerImpactMarkdownPath,
} from "../../domain/cartographer/paths.js";
import { redactSecrets, assertSafeArtifactId, isSafeArtifactId, writeAtomicFile } from "./store-safety.js";

function renderMarkdown(report: ImpactAnalysis): string {
  const lines: string[] = [];
  lines.push(`# Change Impact: ${report.id}`, "");
  lines.push(`- Risk: **${report.risk}**`);
  lines.push(`- Graph version: ${report.graphVersion}`);
  lines.push(`- Changed files: ${report.changedFiles.length}`, "");
  lines.push(`> ${report.explanation}`, "");
  lines.push("## Impacted files");
  for (const ref of report.impactedFiles.slice(0, 50)) {
    lines.push(`- ${ref.path ?? ref.id} (score ${ref.score}) — ${ref.reason}`);
  }
  lines.push("", "## Impacted modules");
  for (const ref of report.impactedModules) {
    lines.push(`- ${ref.path ?? ref.id} — ${ref.reason}`);
  }
  lines.push("", "## Impacted decisions");
  for (const ref of report.impactedDecisions) {
    lines.push(`- ${ref.id}: ${ref.title ?? ref.id} — ${ref.reason}`);
  }
  lines.push("", "## Recommended commands");
  for (const cmd of report.recommendedCommands) {
    lines.push(`- \`${cmd.command}\` (${cmd.cost}) — ${cmd.reason}`);
  }
  if (report.suggestedSplit.length > 0) {
    lines.push("", "## Suggested split");
    for (const step of report.suggestedSplit) {
      lines.push(`- ${step}`);
    }
  }
  lines.push("", "## Confidence");
  lines.push(report.confidenceNote);
  return `${redactSecrets(lines.join("\n"))}\n`;
}

export class ImpactStore {
  constructor(private readonly workspaceRoot: string) {}

  async write(report: ImpactAnalysis): Promise<void> {
    const validated = parseImpactAnalysis(report);
    assertSafeArtifactId(validated.id);
    const jsonPath = cartographerImpactJsonPath(this.workspaceRoot, validated.id);
    await withPathLock(jsonPath, async () => {
      await ensureDir(cartographerImpactDir(this.workspaceRoot));
      await writeAtomicFile(jsonPath, `${redactSecrets(JSON.stringify(validated, null, 2))}\n`);
      await writeAtomicFile(
        cartographerImpactMarkdownPath(this.workspaceRoot, validated.id),
        renderMarkdown(validated),
      );
    });
  }

  async read(impactId: string): Promise<ImpactAnalysis | null> {
    assertSafeArtifactId(impactId);
    const jsonPath = cartographerImpactJsonPath(this.workspaceRoot, impactId);
    if (!(await exists(jsonPath))) {
      return null;
    }
    try {
      return parseImpactAnalysis(JSON.parse(await fs.readFile(jsonPath, "utf8")));
    } catch {
      return null;
    }
  }

  async list(): Promise<readonly string[]> {
    const dir = cartographerImpactDir(this.workspaceRoot);
    if (!(await exists(dir))) {
      return [];
    }
    const entries = await fs.readdir(dir);
    return entries
      .filter((name) => name.endsWith(".json"))
      .map((name) => name.slice(0, -".json".length))
      .filter((id) => isSafeArtifactId(id))
      .sort();
  }
}
