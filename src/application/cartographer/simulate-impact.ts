import { execFile } from "node:child_process";
import { promisify } from "node:util";
import fs from "node:fs/promises";
import { generateId } from "../../shared/id-generator.js";
import { nowISO } from "../../shared/timestamps.js";
import { GraphStore } from "../../infrastructure/cartographer/graph-store.js";
import { computeImpact } from "../../domain/cartographer/impact/impact-sim.js";
import { rankFiles } from "../../domain/cartographer/context/ranking.js";
import {
  parseImpactAnalysis,
  type ImpactAnalysis,
  type ImpactInput,
} from "../../domain/cartographer/impact/impact-report.js";
import type { DecisionProvider } from "./decision-provider.js";

const execFileAsync = promisify(execFile);

export interface SimulateImpactInput {
  readonly workspaceRoot: string;
  readonly files?: readonly string[];
  readonly changedOnly?: boolean;
  readonly diffPath?: string;
  readonly goal?: string;
  readonly decisionProvider: DecisionProvider;
}

export interface SimulateImpactResult {
  readonly report: ImpactAnalysis;
}

async function gitChangedFiles(workspaceRoot: string): Promise<readonly string[]> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["-C", workspaceRoot, "status", "--porcelain=v1", "-z", "--untracked-files=all"],
      { maxBuffer: 8 * 1024 * 1024 },
    );
    const tokens = stdout.split("\0").filter((token) => token.length > 0);
    const out: string[] = [];
    for (let i = 0; i < tokens.length; i += 1) {
      const token = tokens[i]!;
      const status = token.slice(0, 2);
      const pathPart = token.slice(3);
      if (status === "!!") {
        continue;
      }
      if (status.startsWith("R") || status.startsWith("C")) {
        const destination = tokens[i + 1];
        if (destination !== undefined) {
          out.push(destination.replace(/\\/g, "/"));
          i += 1;
        }
        continue;
      }
      if (pathPart.length > 0) {
        out.push(pathPart.replace(/\\/g, "/"));
      }
    }
    return [...new Set(out)];
  } catch {
    return [];
  }
}

async function diffChangedFiles(diffPath: string): Promise<readonly string[]> {
  try {
    const body = await fs.readFile(diffPath, "utf8");
    const out = new Set<string>();
    for (const line of body.split(/\r?\n/)) {
      const match = /^\+\+\+ b\/(.+)$/.exec(line);
      const captured = match?.[1];
      if (captured !== undefined && captured !== "/dev/null") {
        out.add(captured.replace(/^a\//, "").trim());
      }
    }
    return [...out];
  } catch {
    return [];
  }
}

export async function simulateImpact(input: SimulateImpactInput): Promise<SimulateImpactResult> {
  const store = new GraphStore(input.workspaceRoot);
  const graph = await store.read();
  if (graph === null) {
    throw new Error("no project graph; run 'hforge graph build' first");
  }

  let changedFiles: readonly string[] = [];
  let speculative = false;
  const recordInput: ImpactInput = {};
  if (input.files !== undefined && input.files.length > 0) {
    changedFiles = input.files.map((file) => file.replace(/\\/g, "/"));
    recordInput.files = [...changedFiles];
  } else if (input.changedOnly === true) {
    changedFiles = await gitChangedFiles(input.workspaceRoot);
    recordInput.changedOnly = true;
  } else if (input.diffPath !== undefined) {
    changedFiles = await diffChangedFiles(input.diffPath);
    recordInput.diffPath = input.diffPath;
  } else if (input.goal !== undefined && input.goal.length > 0) {
    changedFiles = rankFiles({ goal: input.goal, seedFiles: [], graph })
      .slice(0, 10)
      .map((ref) => ref.path ?? "")
      .filter((path) => path.length > 0);
    recordInput.goal = input.goal;
    speculative = true;
  }

  const decisions = await input.decisionProvider.relevantDecisions(
    input.goal ?? changedFiles.join(" "),
    changedFiles,
  );
  const computation = computeImpact({
    graph,
    changedFiles,
    speculative,
    hasLinkedDecision: decisions.length > 0,
  });

  const report = parseImpactAnalysis({
    schemaVersion: 1,
    id: generateId("trace"),
    createdAt: nowISO(),
    graphVersion: graph.version,
    input: recordInput,
    changedFiles: computation.changedFiles,
    risk: computation.risk,
    impactedFiles: computation.impactedFiles,
    impactedModules: computation.impactedModules,
    impactedDocs: [],
    impactedDecisions: decisions,
    recommendedCommands: computation.recommendedCommands,
    suggestedSplit: computation.suggestedSplit,
    explanation: computation.explanation,
    confidenceNote: computation.confidenceNote,
  });
  return { report };
}
