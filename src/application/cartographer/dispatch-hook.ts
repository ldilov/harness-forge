import { generateId } from "../../shared/id-generator.js";
import { nowISO } from "../../shared/timestamps.js";
import { GraphStore } from "../../infrastructure/cartographer/graph-store.js";
import { BundleStore } from "../../infrastructure/cartographer/bundle-store.js";
import { ImpactStore } from "../../infrastructure/cartographer/impact-store.js";
import { HookRunStore } from "../../infrastructure/cartographer/hook-run-store.js";
import { buildGraph } from "./build-graph.js";
import { compileContext } from "./compile-context.js";
import { simulateImpact } from "./simulate-impact.js";
import { HarnessDecisionProvider } from "./decision-provider.js";
import { loadAgentTriggersConfig } from "./agent-triggers-config.js";
import {
  agentHookPayloadSchema,
  autonomyAllows,
  type AgentHookPayload,
} from "../../domain/cartographer/broker/hook-event.js";
import { hookFingerprint } from "../../domain/cartographer/broker/fingerprint.js";
import { recommendationsFor, nextActionFor } from "../../domain/cartographer/broker/trigger-matrix.js";
import {
  parseAgentHookRun,
  type AgentHookRun,
  type AgentCommandRecommendation,
  type AgentCommandResult,
} from "../../domain/cartographer/broker/hook-run.js";

const BUILDER_VERSION = "cartographer-1.0.0";
const DEFAULT_COOLDOWN_MS = 30_000;

export interface DispatchHookInput {
  readonly workspaceRoot: string;
  readonly payload: AgentHookPayload;
  readonly execute?: boolean;
  readonly cooldownMs?: number;
}

export interface DispatchHookResult {
  readonly run: AgentHookRun;
}

async function executeRecommendation(
  workspaceRoot: string,
  rec: AgentCommandRecommendation,
  payload: AgentHookPayload,
): Promise<{ result: AgentCommandResult; contextBundleId?: string; impactAnalysisId?: string }> {
  const decisionProvider = new HarnessDecisionProvider(workspaceRoot);
  if (rec.executor === "graph-build") {
    const { graph } = await buildGraph(workspaceRoot, BUILDER_VERSION, nowISO());
    await new GraphStore(workspaceRoot).write(graph);
    return {
      result: { command: rec.command, status: "ok", detail: `graph ${graph.version} (${graph.nodes.length} nodes)` },
    };
  }
  if (rec.executor === "context-compile") {
    const { bundle } = await compileContext({
      workspaceRoot,
      goal: payload.goal ?? "",
      seedFiles: payload.files,
      decisionProvider,
    });
    await new BundleStore(workspaceRoot).write(bundle);
    return {
      result: { command: rec.command, status: "ok", detail: `bundle ${bundle.id}`, artifactId: bundle.id },
      contextBundleId: bundle.id,
    };
  }
  if (rec.executor === "impact") {
    const { report } = await simulateImpact({
      workspaceRoot,
      files: payload.files.length > 0 ? payload.files : undefined,
      changedOnly: rec.command.includes("--changed"),
      goal: payload.goal,
      decisionProvider,
    });
    await new ImpactStore(workspaceRoot).write(report);
    return {
      result: { command: rec.command, status: "ok", detail: `impact ${report.id} risk ${report.risk}`, artifactId: report.id },
      impactAnalysisId: report.id,
    };
  }
  return {
    result: { command: rec.command, status: "skipped", detail: "no in-process executor for this command" },
  };
}

export async function dispatchHook(input: DispatchHookInput): Promise<DispatchHookResult> {
  const payload = agentHookPayloadSchema.parse(input.payload);
  const config = await loadAgentTriggersConfig(input.workspaceRoot);
  const store = new HookRunStore(input.workspaceRoot);

  const graph = await new GraphStore(input.workspaceRoot).read();
  const graphVersion = graph?.version ?? "no-graph";

  const recommendations = recommendationsFor(payload.event, {
    goal: payload.goal ?? "",
    files: payload.files,
    command: payload.command ?? "",
  });

  const fingerprint = hookFingerprint({
    event: payload.event,
    goal: payload.goal ?? "",
    files: payload.files,
    graphVersion,
    recentCommandSet: recommendations.map((rec) => rec.command),
  });

  const cooldownMs = input.cooldownMs ?? DEFAULT_COOLDOWN_MS;
  const cached = await store.lookupFingerprint(fingerprint, cooldownMs);
  if (cached !== null) {
    const cachedRun = parseAgentHookRun({
      schemaVersion: 1,
      id: cached.runId,
      createdAt: nowISO(),
      event: payload.event,
      goal: payload.goal,
      files: payload.files,
      command: payload.command,
      logPath: payload.logPath,
      mode: "dry-run",
      autonomyLevel: config.autonomyLevel,
      fingerprint,
      cached: true,
      status: "ok",
      recommendedCommands: recommendations,
      executedCommands: [],
      decisionRefs: [],
      nextAction: nextActionFor(payload.event, recommendations.length),
      notes: [`identical request within ${Math.round(cooldownMs / 1000)}s cooldown; returning cached run ${cached.runId}`],
    });
    return { run: cachedRun };
  }

  const wantsExecute = input.execute === true && config.enabled;
  const willExecute = wantsExecute && autonomyAllows(config.autonomyLevel, "diagnostic");
  const executed: AgentCommandResult[] = [];
  let contextBundleId: string | undefined;
  let impactAnalysisId: string | undefined;
  const notes: string[] = [];

  if (wantsExecute && !willExecute) {
    notes.push(`autonomyLevel '${config.autonomyLevel}' does not permit execution; recommendations only`);
  }

  if (willExecute) {
    for (const rec of recommendations) {
      if (!rec.autoExecutable || !autonomyAllows(config.autonomyLevel, rec.requiredAutonomy)) {
        executed.push({ command: rec.command, status: "skipped", detail: "not auto-executable at current autonomy" });
        continue;
      }
      try {
        const outcome = await executeRecommendation(input.workspaceRoot, rec, payload);
        executed.push(outcome.result);
        contextBundleId = outcome.contextBundleId ?? contextBundleId;
        impactAnalysisId = outcome.impactAnalysisId ?? impactAnalysisId;
      } catch (error: unknown) {
        executed.push({
          command: rec.command,
          status: "error",
          detail: error instanceof Error ? error.message : String(error),
        });
      }
    }
  }

  const hadError = executed.some((result) => result.status === "error");
  const run = parseAgentHookRun({
    schemaVersion: 1,
    id: generateId("run"),
    createdAt: nowISO(),
    event: payload.event,
    goal: payload.goal,
    files: payload.files,
    command: payload.command,
    logPath: payload.logPath,
    mode: willExecute ? "execute" : "dry-run",
    autonomyLevel: config.autonomyLevel,
    fingerprint,
    cached: false,
    status: hadError ? "warning" : "ok",
    recommendedCommands: recommendations,
    executedCommands: executed,
    contextBundleId,
    impactAnalysisId,
    decisionRefs: [],
    nextAction: nextActionFor(payload.event, recommendations.length),
    notes,
  });

  await store.append(run);
  await store.recordFingerprint(fingerprint, run.id, run.createdAt, cooldownMs);
  return { run };
}
