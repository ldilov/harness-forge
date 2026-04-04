import fs from "node:fs/promises";

import { afterEach, describe, expect, it } from "vitest";

import { deriveRecursiveRuntimeInventory } from "../../src/application/recursive/derive-runtime-inventory.js";
import { executeRecursiveLanguageModel } from "../../src/application/recursive/execute-rlm.js";
import { provisionRecursiveRuntime } from "../../src/application/recursive/provision-runtime.js";
import { listRecursiveCodeCells, loadRecursiveCodeCellResult, loadRecursiveRuntimeInventory } from "../../src/infrastructure/recursive/session-store.js";
import { createRecursiveRlmSession, createRecursiveRlmWorkspace, fixturePath } from "./recursive-rlm-test-helpers.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("recursive code cell integration", () => {
  it("runs one bounded code cell and stores its verdict", async () => {
    const workspaceRoot = await createRecursiveRlmWorkspace("hforge-recursive-cells-");
    tempRoots.push(workspaceRoot);

    const planned = await createRecursiveRlmSession(workspaceRoot);
    await executeRecursiveLanguageModel({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      sourceFile: fixturePath("action-bundles", "code-cell.json")
    });

    const cells = await listRecursiveCodeCells(workspaceRoot, planned.session.sessionId);
    const result = await loadRecursiveCodeCellResult(workspaceRoot, planned.session.sessionId, cells[0]!.cellId);
    expect(cells[0]?.languageId).toBe("javascript");
    expect(result?.verdict).toBe("completed");
  });

  it("uses the detected runtime inventory for python or powershell cells and publishes helper artifacts", async () => {
    const workspaceRoot = await createRecursiveRlmWorkspace("hforge-recursive-runtime-aware-cells-");
    tempRoots.push(workspaceRoot);

    const inventory = await deriveRecursiveRuntimeInventory(workspaceRoot);
    const preferredRuntime =
      inventory.runtimes.find((entry) => entry.runtimeId === "python" && entry.availability === "available")?.runtimeId ??
      inventory.runtimes.find((entry) => entry.runtimeId === "powershell" && entry.availability === "available")?.runtimeId;

    if (!preferredRuntime) {
      return;
    }

    await provisionRecursiveRuntime({
      workspaceRoot,
      runtimeId: preferredRuntime
    });

    const planned = await createRecursiveRlmSession(workspaceRoot);
    await executeRecursiveLanguageModel({
      workspaceRoot,
      sessionId: planned.session.sessionId,
      sourceFile:
        preferredRuntime === "python"
          ? fixturePath("action-bundles", "python-code-cell.json")
          : fixturePath("action-bundles", "powershell-code-cell.json")
    });

    const cells = await listRecursiveCodeCells(workspaceRoot, planned.session.sessionId);
    const result = await loadRecursiveCodeCellResult(workspaceRoot, planned.session.sessionId, cells[0]!.cellId);
    const refreshedInventory = await loadRecursiveRuntimeInventory(workspaceRoot);

    expect(cells[0]?.languageId).toBe(preferredRuntime);
    expect(cells[0]?.helperRefs.length).toBeGreaterThan(0);
    expect(result?.verdict).toBe("completed");
    expect(result?.helperRefs.length).toBeGreaterThan(0);
    expect(refreshedInventory?.runtimes.find((entry) => entry.runtimeId === preferredRuntime)?.managed).toBe(true);
  });
});
