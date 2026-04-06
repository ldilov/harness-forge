import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("recursive release alignment integration", () => {
  it("keeps operator docs and generated-artifact docs aligned on recursive structured-analysis promotion", async () => {
    const [readme, commands, artifacts, targets] = await Promise.all([
      fs.readFile(path.join(root, "README.md"), "utf8"),
      fs.readFile(path.join(root, "docs", "commands.md"), "utf8"),
      fs.readFile(path.join(root, "docs", "generated-artifacts.md"), "utf8"),
      fs.readFile(path.join(root, "docs", "target-support-matrix.md"), "utf8")
    ]);

    // README is a living document — check for recursive mention in any form
    expect(readme).toContain("recursive");
    expect(commands).toContain("recursive run");
    expect(commands).toContain("hforge update");
    expect(artifacts).toContain("recursive structured-analysis capability map");
    expect(targets).toContain("Recursive structured analysis");
  });
});
