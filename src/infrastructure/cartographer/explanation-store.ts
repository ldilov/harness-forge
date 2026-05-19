import fs from "node:fs/promises";
import { ensureDir, exists } from "../../shared/fs.js";
import { withPathLock } from "../../shared/path-mutex.js";
import {
  parseExplanation,
  renderExplanationMarkdown,
  type Explanation,
} from "../../domain/cartographer/explain/explanation.js";
import {
  cartographerExplanationsDir,
  cartographerExplanationJsonPath,
  cartographerExplanationMarkdownPath,
} from "../../domain/cartographer/paths.js";
import {
  redactSecrets,
  assertSafeArtifactId,
  isSafeArtifactId,
  writeAtomicFile,
} from "./store-safety.js";

export class ExplanationStore {
  constructor(private readonly workspaceRoot: string) {}

  async write(explanation: Explanation): Promise<void> {
    const validated = parseExplanation(explanation);
    assertSafeArtifactId(validated.id);
    const jsonPath = cartographerExplanationJsonPath(this.workspaceRoot, validated.id);
    await withPathLock(jsonPath, async () => {
      await ensureDir(cartographerExplanationsDir(this.workspaceRoot));
      await writeAtomicFile(jsonPath, `${redactSecrets(JSON.stringify(validated, null, 2))}\n`);
      await writeAtomicFile(
        cartographerExplanationMarkdownPath(this.workspaceRoot, validated.id),
        redactSecrets(renderExplanationMarkdown(validated)),
      );
    });
  }

  async read(explanationId: string): Promise<Explanation | null> {
    assertSafeArtifactId(explanationId);
    const jsonPath = cartographerExplanationJsonPath(this.workspaceRoot, explanationId);
    if (!(await exists(jsonPath))) {
      return null;
    }
    try {
      return parseExplanation(JSON.parse(await fs.readFile(jsonPath, "utf8")));
    } catch {
      return null;
    }
  }

  async list(): Promise<readonly string[]> {
    const dir = cartographerExplanationsDir(this.workspaceRoot);
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
