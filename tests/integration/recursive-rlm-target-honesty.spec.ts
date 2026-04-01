import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("recursive target honesty integration", () => {
  it("keeps partial targets explicit about translated Typed RLM posture", async () => {
    const [matrix, doc] = await Promise.all([
      fs.readFile(path.join(root, "manifests", "catalog", "harness-capability-matrix.json"), "utf8"),
      fs.readFile(path.join(root, "docs", "target-support-matrix.md"), "utf8")
    ]);

    expect(matrix).toContain("Typed RLM");
    expect(doc).toContain("translated");
    expect(doc).toContain("Cursor receives recursive structured-analysis and Typed RLM promotion");
  });

});
