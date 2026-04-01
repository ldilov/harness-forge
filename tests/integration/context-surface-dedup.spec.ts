import { spawnSync } from "node:child_process";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const nodeCommand = process.execPath;

describe("context surface dedup integration", () => {
  it("passes the dedicated deduplication validation slice", () => {
    const result = spawnSync(nodeCommand, [path.join(root, "scripts", "ci", "validate-context-surface-dedup.mjs")], {
      cwd: root,
      encoding: "utf8"
    });

    expect(result.status).toBe(0);
  });
});
