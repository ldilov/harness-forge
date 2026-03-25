import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import {
  appendEffectivenessSignal,
  readEffectivenessSignals,
  summarizeEffectivenessSignals
} from "../../src/infrastructure/observability/local-metrics-store.js";

const repoRoot = process.cwd();
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("observability and drift integration", () => {
  it("records local effectiveness signals and reports knowledge coverage without drift", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-obsv-"));
    tempRoots.push(tempRoot);

    await appendEffectivenessSignal(tempRoot, {
      signalType: "recommend-run",
      subjectId: "recommend",
      result: "accepted",
      recordedAt: new Date().toISOString()
    });
    await appendEffectivenessSignal(tempRoot, {
      signalType: "doctor-run",
      subjectId: "doctor",
      result: "success",
      recordedAt: new Date().toISOString()
    });

    expect((await readEffectivenessSignals(tempRoot)).length).toBe(2);
    expect((await summarizeEffectivenessSignals(tempRoot)).bySignalType["recommend-run"]).toBe(1);

    const summaryOutput = execFileSync(
      process.execPath,
      [path.join(repoRoot, "scripts", "runtime", "report-effectiveness.mjs"), tempRoot, "--json"],
      { cwd: repoRoot, encoding: "utf8" }
    );
    const coverageOutput = execFileSync(
      process.execPath,
      [path.join(repoRoot, "scripts", "knowledge", "report-coverage.mjs"), repoRoot, "--json"],
      { cwd: repoRoot, encoding: "utf8" }
    );
    const driftOutput = execFileSync(
      process.execPath,
      [path.join(repoRoot, "scripts", "knowledge", "report-drift.mjs"), repoRoot, "--json"],
      { cwd: repoRoot, encoding: "utf8" }
    );

    expect(JSON.parse(summaryOutput).total).toBe(2);
    expect(JSON.parse(coverageOutput).languages).toBeGreaterThan(0);
    expect(JSON.parse(driftOutput).ok).toBe(true);
  });
});
