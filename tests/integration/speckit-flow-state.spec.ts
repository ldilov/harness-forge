import { execFileSync } from "node:child_process";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { loadFlowState } from "../../src/application/flow/load-flow-state.js";
import { saveFlowState } from "../../src/application/flow/save-flow-state.js";

const repoRoot = process.cwd();
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("speckit flow state integration", () => {
  it("infers the current feature stage and artifact lineage from specs", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-flow-"));
    tempRoots.push(tempRoot);
    const featureDir = path.join(tempRoot, "specs", "003-demo");
    await fs.mkdir(path.join(featureDir, "contracts"), { recursive: true });
    await fs.writeFile(path.join(featureDir, "spec.md"), "# Spec\n", "utf8");
    await fs.writeFile(path.join(featureDir, "plan.md"), "# Plan\n", "utf8");
    await fs.writeFile(path.join(featureDir, "tasks.md"), "- [X] done\n- [ ] next\n", "utf8");

    const state = await loadFlowState(tempRoot);
    expect(state.featureId).toBe("003-demo");
    expect(state.currentStage).toBe("implement");
    expect(state.status).toBe("active");
    expect(state.artifactLineage).toContain("specs/003-demo/spec.md");
    expect(state.artifactLineage).toContain("specs/003-demo/plan.md");
    expect(state.artifactLineage).toContain("specs/003-demo/tasks.md");
  });

  it("persists and reloads explicit flow state", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-flow-"));
    tempRoots.push(tempRoot);

    await saveFlowState(tempRoot, {
      featureId: "003-demo",
      currentStage: "validate",
      status: "blocked",
      lastArtifact: "specs/003-demo/tasks.md",
      nextAction: "Run release validation.",
      updatedAt: new Date().toISOString(),
      blockers: ["Release smoke is still pending."],
      artifactLineage: ["specs/003-demo/spec.md", "specs/003-demo/plan.md", "specs/003-demo/tasks.md"]
    });

    const state = await loadFlowState(tempRoot);
    expect(state.status).toBe("blocked");
    expect(state.blockers).toContain("Release smoke is still pending.");
  });

  it("reports flow status through the runtime script without a built dist surface", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-flow-"));
    tempRoots.push(tempRoot);
    const featureDir = path.join(tempRoot, "specs", "003-demo");
    await fs.mkdir(featureDir, { recursive: true });
    await fs.writeFile(path.join(featureDir, "spec.md"), "# Spec\n", "utf8");
    await fs.writeFile(path.join(featureDir, "tasks.md"), "- [X] done\n", "utf8");

    const output = execFileSync(process.execPath, [path.join(repoRoot, "scripts", "runtime", "flow-status.mjs"), tempRoot, "--json"], {
      cwd: repoRoot,
      encoding: "utf8"
    });
    const parsed = JSON.parse(output) as { featureId: string; currentStage: string; artifactLineage?: string[] };

    expect(parsed.featureId).toBe("003-demo");
    expect(parsed.currentStage).toBe("validate");
    expect(parsed.artifactLineage).toContain("specs/003-demo/tasks.md");
  });
});
