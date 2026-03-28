import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { deriveRecursiveLanguageCapabilities } from "../../src/application/recursive/derive-language-capabilities.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("repo intelligence mixed-language integration", () => {
  it("derives an honest recursive capability map for a mixed-language benchmark workspace", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-mixed-language-"));
    tempRoots.push(workspaceRoot);
    await fs.mkdir(path.join(workspaceRoot, "src"), { recursive: true });
    await fs.writeFile(path.join(workspaceRoot, "package.json"), JSON.stringify({ name: "mixed", private: true }, null, 2), "utf8");
    await fs.writeFile(path.join(workspaceRoot, "src", "index.ts"), "export const value = 1;\n", "utf8");
    await fs.writeFile(path.join(workspaceRoot, "service.py"), "def handler():\n    return 'ok'\n", "utf8");

    const capabilities = await deriveRecursiveLanguageCapabilities(workspaceRoot);

    const activeLanguages = capabilities.languages.filter((language) => language.adapterStatus !== "unavailable");
    expect(activeLanguages.length).toBeGreaterThan(1);
    expect(capabilities.languages.some((language) => language.languageId === "typescript" && language.adapterStatus === "available")).toBe(true);
    expect(
      capabilities.languages.some(
        (language) =>
          ["python", "go", "java", "dotnet"].includes(language.languageId) &&
          language.adapterStatus !== "unavailable"
      )
    ).toBe(true);
  });
});
