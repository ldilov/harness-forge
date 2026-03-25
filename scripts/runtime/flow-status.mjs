#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const json = args.includes("--json");
const root = path.resolve(args.find((value) => !value.startsWith("--")) ?? ".");
const distCli = path.join(root, "dist", "cli", "index.js");

async function exists(targetPath) {
  try {
    await fs.access(targetPath);
    return true;
  } catch {
    return false;
  }
}

async function inferFlowState() {
  const specsRoot = path.join(root, "specs");
  let featureDirs = [];
  try {
    featureDirs = (await fs.readdir(specsRoot, { withFileTypes: true }))
      .filter((entry) => entry.isDirectory())
      .map((entry) => path.join(specsRoot, entry.name));
  } catch {
    return {
      featureId: "uninitialized",
      currentStage: "clarify",
      status: "active",
      lastArtifact: ".specify/state/agent-context.md",
      nextAction: "Create a feature spec before attempting flow recovery.",
      updatedAt: new Date().toISOString()
    };
  }

  if (featureDirs.length === 0) {
    return {
      featureId: "uninitialized",
      currentStage: "clarify",
      status: "active",
      lastArtifact: ".specify/state/agent-context.md",
      nextAction: "Create a feature spec before attempting flow recovery.",
      updatedAt: new Date().toISOString(),
      artifactLineage: []
    };
  }

  const stats = await Promise.all(
    featureDirs.map(async (featureDir) => ({ featureDir, stat: await fs.stat(featureDir) }))
  );
  stats.sort((left, right) => right.stat.mtimeMs - left.stat.mtimeMs);
  const featureDir = stats[0].featureDir;
  const featureId = path.basename(featureDir);
  const artifactLineage = [];
  for (const relativePath of ["spec.md", "plan.md", "research.md", "data-model.md", "tasks.md"]) {
    const absolutePath = path.join(featureDir, relativePath);
    if (await exists(absolutePath)) {
      artifactLineage.push(`specs/${featureId}/${relativePath}`);
    }
  }
  const tasksPath = path.join(featureDir, "tasks.md");
  const planPath = path.join(featureDir, "plan.md");
  const specPath = path.join(featureDir, "spec.md");
  let stage = "plan";
  let status = "active";
  if (await exists(tasksPath)) {
    const content = await fs.readFile(tasksPath, "utf8");
    const incomplete = (content.match(/^- \[ \]/gm) ?? []).length;
    const complete = (content.match(/^- \[[xX]\]/gm) ?? []).length;
    if (incomplete === 0 && complete > 0) {
      stage = "validate";
      status = "complete";
    } else if (complete > 0) {
      stage = "implement";
    } else {
      stage = "tasks";
    }
  } else if (await exists(planPath)) {
    stage = "plan";
  } else if (await exists(specPath)) {
    stage = "specify";
  }

  return {
    featureId,
    currentStage: stage,
    status,
    lastArtifact: artifactLineage[artifactLineage.length - 1] ?? `specs/${featureId}/spec.md`,
    nextAction: status === "complete" ? "Review validation output and release readiness." : "Continue the current flow stage.",
    updatedAt: new Date().toISOString(),
    artifactLineage
  };
}

if (await exists(distCli)) {
  const { execFileSync } = await import("node:child_process");
  const output = execFileSync(process.execPath, [distCli, "flow", "status", "--root", root, "--json"], {
    cwd: root,
    encoding: "utf8"
  });
  if (json) {
    process.stdout.write(output);
  } else {
    console.log(JSON.parse(output));
  }
} else {
  const result = await inferFlowState();
  if (json) {
    console.log(JSON.stringify(result, null, 2));
  } else {
    console.log(JSON.stringify(result, null, 2));
  }
}
