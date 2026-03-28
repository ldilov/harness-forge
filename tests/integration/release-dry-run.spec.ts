import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("release dry-run integration", () => {
  it("keeps the smoke and docs-alignment release checks executable", () => {
    const smoke = spawnSync(process.execPath, [path.join(root, "scripts", "ci", "smoke-runner.mjs")], {
      cwd: root,
      encoding: "utf8"
    });
    const docs = spawnSync(process.execPath, [path.join(root, "scripts", "ci", "validate-doc-command-alignment.mjs")], {
      cwd: root,
      encoding: "utf8"
    });

    expect(smoke.status).toBe(0);
    expect(smoke.stdout).toContain("\"ok\": true");
    expect(docs.status).toBe(0);
    expect(docs.stdout).toContain("\"ok\": true");
  });
});
