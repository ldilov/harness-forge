import fs from "node:fs/promises";
import path from "node:path";
import { pathToFileURL } from "node:url";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("target support matrix integration", () => {
  it("matches the generated support document derived from canonical capability truth", async () => {
    const helperModule = await import(
      pathToFileURL(path.join(root, "scripts", "ci", "capability-matrix-shared.mjs")).href
    );
    const { taxonomy, matrix } = await helperModule.loadCapabilityInputs(root);
    const expected = helperModule.renderTargetSupportMarkdown(taxonomy, matrix);
    const actual = await fs.readFile(path.join(root, "docs", "target-support-matrix.md"), "utf8");

    expect(actual).toBe(expected);
    expect(actual).toContain("Harness Forge keeps one canonical target-capability truth source");
    expect(actual).toContain("Typed hooks");
    expect(actual).toContain("documentation-only");
  });
});
