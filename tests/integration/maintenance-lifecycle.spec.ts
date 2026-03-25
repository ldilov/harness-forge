import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { createAuditReport } from "../../src/application/maintenance/audit-install.js";
import { createDiffInstallReport } from "../../src/application/maintenance/diff-install.js";
import { createDoctorReport } from "../../src/application/maintenance/doctor-workspace.js";
import { createPrunePlan } from "../../src/application/maintenance/prune-install.js";
import { syncInstallState } from "../../src/application/maintenance/sync-install.js";
import { createUpgradeSurfaceReport } from "../../src/application/maintenance/upgrade-surface.js";
import { loadInstallState, saveInstallState } from "../../src/domain/state/install-state.js";

const repoRoot = process.cwd();
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("maintenance lifecycle integration", () => {
  it("diagnoses drift and supports sync, prune, and upgrade reporting", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-maint-"));
    tempRoots.push(tempRoot);

    const existingFile = path.join(tempRoot, "managed", "present.md");
    const duplicateFile = path.join(tempRoot, "managed", "duplicate.md");
    const missingFile = path.join(tempRoot, "managed", "missing.md");
    await fs.mkdir(path.dirname(existingFile), { recursive: true });
    await fs.writeFile(existingFile, "ok\n", "utf8");
    await fs.writeFile(duplicateFile, "ok\n", "utf8");

    await saveInstallState(tempRoot, {
      version: 1,
      installedTargets: ["codex", "codex"],
      installedBundles: ["baseline:agents", "baseline:agents", "missing:bundle"],
      appliedPlanHash: "test",
      fileWrites: [existingFile, duplicateFile, duplicateFile, missingFile],
      backupSnapshots: [],
      timestamps: {
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      lastValidationStatus: "unknown"
    });

    const audit = await createAuditReport(tempRoot, repoRoot);
    expect(audit.missingManagedPaths).toContain(missingFile);
    expect(audit.missingBundles).toContain("missing:bundle");

    const doctor = await createDoctorReport(tempRoot, repoRoot);
    expect(doctor.status).toBe("warning");

    const diff = await createDiffInstallReport(tempRoot);
    expect(diff.missing).toContain(missingFile);
    expect(diff.present).toContain(existingFile);

    const syncPreview = await syncInstallState(tempRoot, false);
    expect(syncPreview.changed).toBe(true);
    await syncInstallState(tempRoot, true);

    const prunePreview = await createPrunePlan(tempRoot, false);
    expect(prunePreview.removed).toContain(duplicateFile);
    await createPrunePlan(tempRoot, true);

    const upgraded = await createUpgradeSurfaceReport(tempRoot, repoRoot);
    expect(upgraded.installedTargets).toContain("codex");
    expect(upgraded.recommendation).toContain("release validation");

    const persistedState = await loadInstallState(tempRoot);
    expect(persistedState?.installedTargets).toEqual(["codex"]);
    expect(persistedState?.fileWrites.filter((filePath) => filePath === duplicateFile)).toHaveLength(1);
  });
});
