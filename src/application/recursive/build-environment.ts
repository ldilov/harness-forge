import path from "node:path";

import type { RecursiveArtifactHandle } from "../../domain/recursive/session.js";
import {
  RUNTIME_DECISION_INDEX_FILE,
  RUNTIME_DECISIONS_DIR,
  RUNTIME_DIR,
  RUNTIME_FINDINGS_DIR,
  RUNTIME_RECOMMENDATIONS_FILE,
  RUNTIME_REPO_DIR,
  RUNTIME_REPO_MAP_FILE,
  RUNTIME_RISK_SIGNALS_FILE,
  exists
} from "../../shared/index.js";
import { resolveTaskArtifactPaths } from "../runtime/task-runtime-store.js";

export interface BuildRecursiveEnvironmentInput {
  workspaceRoot: string;
  taskId?: string;
  rootObjective: string;
}

export interface RecursiveEnvironment {
  handles: RecursiveArtifactHandle[];
  tools: string[];
}

function toPortablePath(workspaceRoot: string, filePath: string): string {
  return path.relative(workspaceRoot, filePath).replaceAll("\\", "/");
}

function createHandle(
  handleId: string,
  handleType: RecursiveArtifactHandle["handleType"],
  targetRef: string,
  label: string,
  summary: string,
  sourceArtifactType?: string
): RecursiveArtifactHandle {
  return {
    handleId,
    handleType,
    targetRef,
    label,
    summary,
    stalenessState: "unknown",
    ...(sourceArtifactType ? { sourceArtifactType } : {})
  };
}

export async function buildRecursiveEnvironment(input: BuildRecursiveEnvironmentInput): Promise<RecursiveEnvironment> {
  const handles: RecursiveArtifactHandle[] = [];

  const sharedArtifacts = [
    {
      id: "repo-map",
      path: path.join(input.workspaceRoot, RUNTIME_DIR, RUNTIME_REPO_DIR, RUNTIME_REPO_MAP_FILE),
      label: "Repo map",
      summary: "Workspace repo cartography for architectural and ownership context.",
      sourceArtifactType: "repo-map"
    },
    {
      id: "recommendations",
      path: path.join(input.workspaceRoot, RUNTIME_DIR, RUNTIME_REPO_DIR, RUNTIME_RECOMMENDATIONS_FILE),
      label: "Recommendations",
      summary: "Repo-aware recommendations derived from shared runtime intelligence.",
      sourceArtifactType: "recommendations"
    },
    {
      id: "risk-signals",
      path: path.join(input.workspaceRoot, RUNTIME_DIR, RUNTIME_FINDINGS_DIR, RUNTIME_RISK_SIGNALS_FILE),
      label: "Risk signals",
      summary: "Current risk-oriented findings discovered in the workspace runtime.",
      sourceArtifactType: "risk-signals"
    },
    {
      id: "decision-index",
      path: path.join(input.workspaceRoot, RUNTIME_DIR, RUNTIME_DECISIONS_DIR, RUNTIME_DECISION_INDEX_FILE),
      label: "Decision index",
      summary: "Canonical decision-runtime index for ASRs and ADRs.",
      sourceArtifactType: "decision-index"
    }
  ];

  for (const artifact of sharedArtifacts) {
    if (await exists(artifact.path)) {
      handles.push(
        createHandle(
          artifact.id,
          artifact.id === "decision-index" ? "decision-artifact" : "runtime-artifact",
          toPortablePath(input.workspaceRoot, artifact.path),
          artifact.label,
          artifact.summary,
          artifact.sourceArtifactType
        )
      );
    }
  }

  if (input.taskId) {
    const taskPaths = resolveTaskArtifactPaths(input.workspaceRoot, input.taskId);
    const taskArtifacts = [
      {
        id: `${input.taskId}:file-interest`,
        path: taskPaths.fileInterestPath,
        label: `${input.taskId} file interest`,
        summary: "Ranked task-aware file selection for the linked task.",
        sourceArtifactType: "file-interest"
      },
      {
        id: `${input.taskId}:impact-analysis`,
        path: taskPaths.impactAnalysisPath,
        label: `${input.taskId} impact analysis`,
        summary: "Blast-radius and architecture-significance analysis for the linked task.",
        sourceArtifactType: "impact-analysis"
      },
      {
        id: `${input.taskId}:task-pack`,
        path: taskPaths.taskPackPath,
        label: `${input.taskId} task pack`,
        summary: "Canonical task pack for the linked task runtime.",
        sourceArtifactType: "task-pack"
      }
    ];

    for (const artifact of taskArtifacts) {
      if (await exists(artifact.path)) {
        handles.push(
          createHandle(
            artifact.id,
            "task-artifact",
            toPortablePath(input.workspaceRoot, artifact.path),
            artifact.label,
            artifact.summary,
            artifact.sourceArtifactType
          )
        );
      }
    }
  }

  return {
    handles,
    tools: [
      "repo.read-handle",
      "runtime.read-handle",
      "session.write-scratch",
      "session.append-trace",
      "session.update-memory",
      "session.create-checkpoint",
      "session.spawn-subcall",
      "session.propose-promotion",
      "session.propose-meta-op",
      "session.finalize-output"
    ]
  };
}
