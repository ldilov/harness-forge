import {
  AgentRunStateStore,
  WatchdogInterventionStore,
} from "../../../infrastructure/sentinel/stores/watchdog-store.js";
import {
  maxInterventionStep,
  nextInterventionStep,
  type AgentRunState,
  type InterventionStep,
  type WatchdogInterventionRecord,
  type WatchdogSignal,
} from "../../../domain/sentinel/watchdog/intervention.js";
import { generateSentinelId } from "../../../shared/ulid.js";
import { nowISO } from "../../../shared/timestamps.js";

export interface RegisterRunOptions {
  readonly runId: string;
  readonly registeredAt?: string;
}

export interface RecordInterventionOptions {
  readonly runId: string;
  readonly signal: WatchdogSignal;
  readonly step: InterventionStep;
  readonly reason: string;
  readonly actor: string;
  readonly detail?: Readonly<Record<string, unknown>>;
}

export interface PauseOptions {
  readonly runId: string;
  readonly reason: string;
  readonly actor: string;
  readonly signal?: WatchdogSignal;
}

export interface ResumeOptions {
  readonly runId: string;
  readonly actor: string;
  readonly reason?: string;
}

export interface InterventionResult {
  readonly intervention: WatchdogInterventionRecord;
  readonly state: AgentRunState;
}

function defaultState(runId: string): AgentRunState {
  return {
    runId,
    status: "active",
    interventionStep: "observe",
    interventionCount: 0,
    pausedAt: null,
    pausedReason: null,
    pausedBy: null,
    lastInterventionAt: null,
    lastSignal: null,
    updatedAt: nowISO(),
  };
}

export class Watchdog {
  private readonly interventions: WatchdogInterventionStore;
  private readonly runs: AgentRunStateStore;

  constructor(workspaceRoot: string) {
    this.interventions = new WatchdogInterventionStore(workspaceRoot);
    this.runs = new AgentRunStateStore(workspaceRoot);
  }

  async registerRun(options: RegisterRunOptions): Promise<AgentRunState> {
    const existing = await this.runs.get(options.runId);
    if (existing !== null) {
      return existing;
    }
    return this.runs.upsert({
      ...defaultState(options.runId),
      updatedAt: options.registeredAt ?? nowISO(),
    });
  }

  async recordIntervention(options: RecordInterventionOptions): Promise<InterventionResult> {
    const current = (await this.runs.get(options.runId)) ?? defaultState(options.runId);
    const resolvedStep = maxInterventionStep(current.interventionStep, options.step);
    const isPause = options.step === "pause" || options.step === "terminate";
    const next: AgentRunState = {
      runId: options.runId,
      status:
        options.step === "terminate" ? "terminated" : isPause ? "paused" : current.status,
      interventionStep: resolvedStep,
      interventionCount: current.interventionCount + 1,
      pausedAt: isPause ? nowISO() : current.pausedAt,
      pausedReason: isPause ? options.reason : current.pausedReason,
      pausedBy: isPause ? options.actor : current.pausedBy,
      lastInterventionAt: nowISO(),
      lastSignal: options.signal,
      updatedAt: nowISO(),
    };
    const state = await this.runs.upsert(next);
    const intervention = await this.interventions.record({
      id: generateSentinelId("effect"),
      runId: options.runId,
      signal: options.signal,
      step: options.step,
      reason: options.reason,
      actor: options.actor,
      createdAt: nowISO(),
      ...(options.detail === undefined ? {} : { detail: options.detail }),
    });
    return { intervention, state };
  }

  async pause(options: PauseOptions): Promise<InterventionResult> {
    return this.recordIntervention({
      runId: options.runId,
      signal: options.signal ?? "agent.tool_failure_repeated",
      step: "pause",
      reason: options.reason,
      actor: options.actor,
    });
  }

  async resume(options: ResumeOptions): Promise<AgentRunState | null> {
    const current = await this.runs.get(options.runId);
    if (current === null) {
      return null;
    }
    if (current.status !== "paused") {
      return current;
    }
    const updated: AgentRunState = {
      ...current,
      status: "active",
      pausedAt: null,
      pausedReason: null,
      pausedBy: null,
      updatedAt: nowISO(),
    };
    await this.runs.upsert(updated);
    await this.interventions.record({
      id: generateSentinelId("effect"),
      runId: options.runId,
      signal: current.lastSignal ?? "agent.tool_failure_repeated",
      step: "observe",
      reason: options.reason ?? `resumed by ${options.actor}`,
      actor: options.actor,
      createdAt: nowISO(),
    });
    return updated;
  }

  async listRuns(): Promise<readonly AgentRunState[]> {
    return this.runs.list();
  }

  async listInterventions(limit = 50): Promise<readonly WatchdogInterventionRecord[]> {
    return this.interventions.tail(Math.max(1, limit));
  }

  async getRun(runId: string): Promise<AgentRunState | null> {
    return this.runs.get(runId);
  }

  async explain(runId: string, limit = 20): Promise<{
    readonly state: AgentRunState | null;
    readonly history: readonly WatchdogInterventionRecord[];
    readonly nextStepIfEscalated: InterventionStep | null;
  }> {
    const state = await this.runs.get(runId);
    const all = await this.interventions.readAll();
    const forRun = all.filter((entry) => entry.runId === runId).slice(-Math.max(1, limit));
    const next = state === null ? null : nextInterventionStep(state.interventionStep);
    return { state, history: forRun, nextStepIfEscalated: next };
  }
}
