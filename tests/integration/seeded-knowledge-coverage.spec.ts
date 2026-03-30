import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

async function listFiles(dir: string): Promise<string[]> {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFiles(absolutePath);
      }

      return [absolutePath];
    })
  );

  return results.flat();
}

describe("seeded knowledge coverage integration", () => {
  it("maps every shipped seeded archive file", async () => {
    const manifest = JSON.parse(await fs.readFile(path.join(root, "manifests/catalog/seeded-knowledge-files.json"), "utf8"));
    const seededRoot = path.join(root, "knowledge-bases/seeded");
    const files = (await listFiles(seededRoot))
      .map((absolutePath) => path.relative(root, absolutePath).replaceAll("\\", "/"))
      .filter((relativePath) => relativePath !== "knowledge-bases/seeded/README.md");

    expect(manifest.files).toHaveLength(files.length);
    expect(files.length).toBeGreaterThan(130);

    const mappedPaths = new Set(manifest.files.map((entry: { packagePath: string }) => entry.packagePath));
    for (const filePath of files) {
      expect(mappedPaths.has(filePath), filePath).toBe(true);
    }
  });
});
