import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("docs quickstart integration", () => {
  it("walks through build, catalog, install preview, and validation", async () => {
    const quickstart = await fs.readFile(path.join(root, "docs", "quickstart.md"), "utf8");

    expect(quickstart).toContain("npx @harness-forge/cli");
    expect(quickstart).toContain("npm run build");
    expect(quickstart).toContain("catalog --json");
    expect(quickstart).toContain("--agent codex --dry-run");
    expect(quickstart).toContain("--target codex --lang typescript --with workflow-quality --dry-run");
    expect(quickstart).toContain("npm run validate:release");
  });
});
