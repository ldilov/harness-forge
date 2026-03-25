import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("framework pack surface integration", () => {
  it("publishes the first framework wave through the public catalog docs", async () => {
    const catalogDoc = await fs.readFile(path.join(root, "docs", "catalog", "framework-packs.md"), "utf8");

    for (const framework of [
      "react",
      "vite",
      "express",
      "fastapi",
      "django",
      "spring-boot",
      "aspnet-core",
      "gin",
      "ktor",
      "symfony"
    ]) {
      expect(catalogDoc).toContain(`\`${framework}\``);
    }
  });
});
