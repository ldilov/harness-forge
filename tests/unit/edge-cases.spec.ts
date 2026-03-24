import path from "node:path";

import { describe, expect, it } from "vitest";

import { normalizeTargetPath } from "../../src/infrastructure/filesystem/normalize-target-path.js";

describe("normalizeTargetPath", () => {
  it("keeps paths inside the workspace root", () => {
    const root = path.resolve(path.sep, "repo");
    expect(normalizeTargetPath(root, "docs/readme.md").startsWith(root)).toBe(true);
  });

  it("rejects path traversal", () => {
    expect(() => normalizeTargetPath("/repo", "../escape.txt")).toThrow();
  });
});
