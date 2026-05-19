import fs from "node:fs/promises";
import { ensureDir, exists } from "../../shared/fs.js";
import { withPathLock } from "../../shared/path-mutex.js";
import {
  parseContextBundle,
  type ContextBundle,
} from "../../domain/cartographer/context/context-bundle.js";
import {
  cartographerContextDir,
  cartographerBundleJsonPath,
  cartographerBundleMarkdownPath,
} from "../../domain/cartographer/paths.js";
import { redactSecrets, assertSafeArtifactId, isSafeArtifactId, writeAtomicFile } from "./store-safety.js";

function renderMarkdown(bundle: ContextBundle): string {
  const lines: string[] = [];
  lines.push(`# Task Context Bundle: ${bundle.goal}`, "");
  lines.push(`- Bundle: ${bundle.id}`);
  lines.push(`- Graph version: ${bundle.graphVersion}`);
  lines.push(`- Budget: ${bundle.budget}`);
  lines.push(`- Context truncated: ${bundle.contextTruncated ? "yes" : "no"}`);
  lines.push(
    `- Graph freshness: indexed ${bundle.graphFreshness.indexedAt}; ${bundle.graphFreshness.modifiedSinceIndex.length} file(s) changed since`,
    "",
  );
  lines.push("## Relevant files");
  for (const ref of bundle.relevantFiles) {
    lines.push(`- ${ref.path ?? ref.id} (score ${ref.score}) — ${ref.reason}`);
  }
  lines.push("", "## Relevant docs");
  for (const ref of bundle.relevantDocs) {
    lines.push(`- ${ref.path ?? ref.id} — ${ref.reason}`);
  }
  lines.push("", "## Relevant decisions");
  for (const ref of bundle.relevantDecisions) {
    lines.push(`- ${ref.id}: ${ref.title ?? ref.id} — ${ref.reason}`);
  }
  lines.push("", "## Recommended commands");
  for (const cmd of bundle.recommendedCommands) {
    lines.push(`- \`${cmd.command}\` (${cmd.cost}) — ${cmd.reason}`);
  }
  lines.push("", "## Constraints");
  for (const constraint of bundle.constraints) {
    lines.push(`- ${constraint}`);
  }
  if (bundle.diagnostics.length > 0) {
    lines.push("", "## Diagnostics");
    for (const diag of bundle.diagnostics) {
      lines.push(`- ${diag}`);
    }
  }
  return `${redactSecrets(lines.join("\n"))}\n`;
}

export class BundleStore {
  constructor(private readonly workspaceRoot: string) {}

  async write(bundle: ContextBundle): Promise<void> {
    const validated = parseContextBundle(bundle);
    assertSafeArtifactId(validated.id);
    const jsonPath = cartographerBundleJsonPath(this.workspaceRoot, validated.id);
    await withPathLock(jsonPath, async () => {
      await ensureDir(cartographerContextDir(this.workspaceRoot));
      const jsonBody = `${redactSecrets(JSON.stringify(validated, null, 2))}\n`;
      await writeAtomicFile(jsonPath, jsonBody);
      await writeAtomicFile(
        cartographerBundleMarkdownPath(this.workspaceRoot, validated.id),
        renderMarkdown(validated),
      );
    });
  }

  async read(bundleId: string): Promise<ContextBundle | null> {
    assertSafeArtifactId(bundleId);
    const jsonPath = cartographerBundleJsonPath(this.workspaceRoot, bundleId);
    if (!(await exists(jsonPath))) {
      return null;
    }
    try {
      return parseContextBundle(JSON.parse(await fs.readFile(jsonPath, "utf8")));
    } catch {
      return null;
    }
  }

  async list(): Promise<readonly string[]> {
    const dir = cartographerContextDir(this.workspaceRoot);
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

  async delete(bundleId: string): Promise<boolean> {
    assertSafeArtifactId(bundleId);
    const jsonPath = cartographerBundleJsonPath(this.workspaceRoot, bundleId);
    return withPathLock(jsonPath, async () => {
      if (!(await exists(jsonPath))) {
        return false;
      }
      await fs.rm(jsonPath, { force: true });
      await fs.rm(cartographerBundleMarkdownPath(this.workspaceRoot, bundleId), { force: true });
      return true;
    });
  }
}
