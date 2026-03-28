import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { initializeWorkspace } from "../../src/application/install/initialize-workspace.js";

describe("init idempotency contract", () => {
  it("initializes the workspace repeatedly without losing created state", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-init-contract-"));

    const first = await initializeWorkspace(workspaceRoot);
    const second = await initializeWorkspace(workspaceRoot);
    const runtimeIndex = JSON.parse(await fs.readFile(second.runtimeIndexPath, "utf8"));

    expect(first.installState.runtimeSchemaVersion).toBe(3);
    expect(second.installState.timestamps.createdAt).toBe(first.installState.timestamps.createdAt);
    expect(runtimeIndex.runtimeSchemaVersion).toBe(3);
    expect(runtimeIndex.packageVersion).toBe("0.1.0");
    await expect(fs.access(second.guidancePath)).resolves.toBeUndefined();
  });
});
