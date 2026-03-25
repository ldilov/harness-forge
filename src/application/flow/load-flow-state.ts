import fs from "node:fs/promises";
import path from "node:path";

import {
  exists,
  FLOW_STATE_FILE,
  readJsonFile,
  SPECIFY_STATE_DIR
} from "../../shared/index.js";

export type FlowStage = "clarify" | "specify" | "plan" | "analyze" | "tasks" | "implement" | "validate";
export type FlowStatus = "active" | "blocked" | "paused" | "complete";

export interface FlowStateRecord {
  featureId: string;
  currentStage: FlowStage;
  status: FlowStatus;
  lastArtifact: string;
  nextAction: string;
  updatedAt: string;
  blockers?: string[];
  artifactLineage?: string[];
  notes?: string;
  targetContext?: string;
}

async function listFeatureDirs(root: string): Promise<string[]> {
  const specsRoot = path.join(root, "specs");
  if (!(await exists(specsRoot))) {
    return [];
  }

  const entries = await fs.readdir(specsRoot, { withFileTypes: true });
  return entries.filter((entry) => entry.isDirectory()).map((entry) => path.join(specsRoot, entry.name));
}

async function latestFeatureDir(root: string): Promise<string | null> {
  const featureDirs = await listFeatureDirs(root);
  if (featureDirs.length === 0) {
    return null;
  }

  const stats = await Promise.all(
    featureDirs.map(async (featureDir) => ({
      featureDir,
      stat: await fs.stat(featureDir)
    }))
  );

  stats.sort((left, right) => right.stat.mtimeMs - left.stat.mtimeMs);
  return stats[0]?.featureDir ?? null;
}

function inferStage(taskContent: string | null, hasPlan: boolean, hasSpec: boolean): FlowStage {
  if (!taskContent) {
    return hasPlan ? "plan" : hasSpec ? "specify" : "clarify";
  }

  const incompleteCount = (taskContent.match(/^- \[ \]/gm) ?? []).length;
  const completeCount = (taskContent.match(/^- \[[xX]\]/gm) ?? []).length;

  if (incompleteCount === 0 && completeCount > 0) {
    return "validate";
  }
  if (completeCount > 0) {
    return "implement";
  }

  return "tasks";
}

function inferNextAction(featureId: string, stage: FlowStage, status: FlowStatus): string {
  if (status === "complete") {
    return `Review validation output for ${featureId} and prepare release or handoff.`;
  }

  switch (stage) {
    case "clarify":
      return "Run /speckit-clarify or create the initial feature spec.";
    case "specify":
      return `Run /speckit-plan for ${featureId}.`;
    case "plan":
      return `Run /speckit-tasks for ${featureId}.`;
    case "tasks":
      return `Start implementation from specs/${featureId}/tasks.md.`;
    case "implement":
      return `Continue implementation and keep specs/${featureId}/tasks.md updated.`;
    case "validate":
      return `Run release and quickstart validation for ${featureId}.`;
    case "analyze":
      return `Review analysis output and continue the planned flow for ${featureId}.`;
  }
}

async function buildArtifactLineage(root: string, featureDir: string): Promise<string[]> {
  const candidatePaths = [
    "spec.md",
    "checklists/requirements.md",
    "plan.md",
    "research.md",
    "data-model.md",
    "quickstart.md",
    "contracts/repo-intelligence-contract.md",
    "contracts/flow-state-contract.md",
    "contracts/hook-manifest-contract.md",
    "contracts/compatibility-matrix-contract.md",
    "tasks.md"
  ];

  const lineage: string[] = [];
  for (const relativePath of candidatePaths) {
    const absolutePath = path.join(featureDir, relativePath);
    if (await exists(absolutePath)) {
      lineage.push(path.relative(root, absolutePath).replaceAll("\\", "/"));
    }
  }

  return lineage;
}

export async function inferFlowState(root: string): Promise<FlowStateRecord> {
  const featureDir = await latestFeatureDir(root);
  if (!featureDir) {
    return {
      featureId: "uninitialized",
      currentStage: "clarify",
      status: "active",
      lastArtifact: ".specify/state/agent-context.md",
      nextAction: "Create a feature spec before attempting flow recovery.",
      updatedAt: new Date().toISOString(),
      blockers: ["No feature directory exists under specs/."]
    };
  }

  const featureId = path.basename(featureDir);
  const specPath = path.join(featureDir, "spec.md");
  const planPath = path.join(featureDir, "plan.md");
  const tasksPath = path.join(featureDir, "tasks.md");
  const hasSpec = await exists(specPath);
  const hasPlan = await exists(planPath);
  const taskContent = (await exists(tasksPath)) ? await fs.readFile(tasksPath, "utf8") : null;
  const currentStage = inferStage(taskContent, hasPlan, hasSpec);
  const status: FlowStatus = currentStage === "validate" ? "complete" : "active";
  const artifactLineage = await buildArtifactLineage(root, featureDir);
  const lastArtifact = artifactLineage[artifactLineage.length - 1] ?? `specs/${featureId}/spec.md`;

  return {
    featureId,
    currentStage,
    status,
    lastArtifact,
    nextAction: inferNextAction(featureId, currentStage, status),
    updatedAt: new Date().toISOString(),
    artifactLineage
  };
}

export async function loadFlowState(root: string): Promise<FlowStateRecord> {
  const flowStatePath = path.join(root, SPECIFY_STATE_DIR, FLOW_STATE_FILE);
  if (await exists(flowStatePath)) {
    return readJsonFile<FlowStateRecord>(flowStatePath);
  }

  return inferFlowState(root);
}
