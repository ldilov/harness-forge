import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("package lifecycle contract", () => {
  it("keeps zero-build npx surfaces wired for published and git-sourced installs", async () => {
    const packageJson = JSON.parse(await fs.readFile(path.join(root, "package.json"), "utf8"));

    expect(packageJson.bin?.hforge).toBe("./dist/cli/index.js");
    expect(packageJson.files).toContain("dist");
    expect(packageJson.scripts?.prepare).toBe("npm run build");
    expect(packageJson.scripts?.prepack).toBe("npm run build");
    expect(packageJson.scripts?.prepublishOnly).toContain("npm run validate:release");
  });
});
