import { ObservationStore } from "../../infrastructure/sentinel/stores/observation-store.js";
import { SignalStore, SuppressionStore } from "../../infrastructure/sentinel/stores/signal-store.js";
import { ActionStore } from "../../infrastructure/sentinel/stores/action-store.js";
import { LedgerStore } from "../../infrastructure/sentinel/stores/ledger-store.js";
import { CadenceLedger } from "../sentinel/budget/cadence-ledger.js";
import { loadBudgetSnapshot } from "../sentinel/budget/budget-ledger.js";
import { ApprovalStore } from "../../infrastructure/sentinel/stores/approval-store.js";
import { ActiveProfileStore } from "../../infrastructure/sentinel/stores/profile-store.js";
import { readPidRecord } from "../sentinel/runtime/pid-file.js";
import { SuppressionFilter } from "../sentinel/classifier/suppressor.js";
import {
  loadDeniedCommands,
  loadDeniedPaths,
} from "../sentinel/policy-gate/policy-loader.js";
import { builtInProfile, type Profile } from "../../domain/sentinel/policy/profile.js";
import {
  sentinelRunVerificationPath,
  SENTINEL_ACTIONS_DIR,
  SENTINEL_RUNS_DIR,
} from "../../domain/sentinel/paths.js";
import type { Observation } from "../../domain/sentinel/observation/observation.js";
import type { Signal } from "../../domain/sentinel/signal/signal.js";
import type { ActionPlan } from "../../domain/sentinel/action/action-plan.js";
import type { SideEffect } from "../../domain/sentinel/ledger/side-effect.js";
import type { ApprovalEntry } from "../../domain/sentinel/policy/approval.js";
import { exists } from "../../shared/fs.js";
import path from "node:path";
import fs from "node:fs/promises";
import { z } from "zod";

const MAX_LEDGER_LIMIT = 1000;
const MAX_OBSERVATIONS_LIMIT = 1000;
const MAX_VERIFICATION_LIMIT = 100;

const VerificationCheckRowSchema = z
  .object({
    type: z.string().min(1),
    status: z.enum(["passed", "failed", "skipped"]),
    command: z.string().optional(),
    summary: z.string().optional(),
    evidenceRef: z.string().optional(),
    durationMs: z.number().optional(),
  })
  .strip();

const VerificationFileSchema = z
  .object({
    actionPlanId: z.string().min(1),
    status: z.enum(["passed", "failed", "partial"]),
    checks: z.array(VerificationCheckRowSchema).default([]),
    completedAt: z.string().min(1),
  })
  .strip();

export interface SentinelStatusSnapshot {
  readonly daemon: {
    readonly running: boolean;
    readonly pid: number | null;
    readonly hostname: string | null;
    readonly startedAt: string | null;
    readonly workspaceRoot: string | null;
  };
  readonly profile: {
    readonly name: string;
    readonly defaultLevel: string;
  };
  readonly cadence: {
    readonly panicStop: boolean;
    readonly maxMonitorRunsPerHour: number;
    readonly maxActionsPerHour: number;
  };
  readonly budget: {
    readonly llmTokensDaily: number;
    readonly npmRequestsPerHour: number;
    readonly githubRequestsPerHour: number;
  };
  readonly usage: {
    readonly monitorRunsLastHour: number;
    readonly actionsProposedLastHour: number;
    readonly panicTogglesLastHour: number;
  };
  readonly counts: {
    readonly observations: number;
    readonly signals: number;
    readonly actions: number;
    readonly ledgerEntries: number;
  };
}

export interface SentinelSignalSnapshot {
  readonly signals: readonly Signal[];
  readonly suppressedIds: readonly string[];
}

export interface SentinelActionSnapshot {
  readonly actions: readonly ActionPlan[];
}

export interface SentinelApprovalsSnapshot {
  readonly approvals: readonly ApprovalEntry[];
}

export interface SentinelVerificationCheckRow {
  readonly type: string;
  readonly status: "passed" | "failed" | "skipped";
  readonly command?: string;
  readonly summary?: string;
  readonly evidenceRef?: string;
  readonly durationMs?: number;
}

export interface SentinelVerificationRow {
  readonly actionId: string;
  readonly actionTitle: string | null;
  readonly status: "passed" | "failed" | "partial";
  readonly checks: readonly SentinelVerificationCheckRow[];
  readonly completedAt: string;
}

export interface SentinelVerificationSnapshot {
  readonly rows: readonly SentinelVerificationRow[];
}

export interface SentinelPolicySnapshot {
  readonly activeProfile: Profile;
  readonly cadence: {
    readonly globalMinIntervalSeconds: number;
    readonly perMonitorJitterPercent: number;
    readonly maxMonitorRunsPerHour: number;
    readonly maxActionsPerHour: number;
    readonly panicStop: boolean;
  };
  readonly budget: {
    readonly llmTokensDaily: number;
    readonly perActionBudget: number;
    readonly npmRequestsPerHour: number;
    readonly githubRequestsPerHour: number;
  };
  readonly deniedPaths: readonly string[];
  readonly deniedCommands: readonly string[];
}

export class SentinelSnapshotProvider {
  constructor(private readonly workspaceRoot: string) {}

  async status(): Promise<SentinelStatusSnapshot> {
    const [budget, daemon, profile, ledger, observations, signals, actions, sideEffects] = await Promise.all([
      loadBudgetSnapshot(this.workspaceRoot),
      readPidRecord(this.workspaceRoot),
      new ActiveProfileStore(this.workspaceRoot).read(),
      new CadenceLedger(this.workspaceRoot),
      new ObservationStore(this.workspaceRoot).readAll(),
      new SignalStore(this.workspaceRoot).readAll(),
      new ActionStore(this.workspaceRoot).listAll(),
      LedgerStore.global(this.workspaceRoot).readAll(),
    ]);
    const oneHourMs = 60 * 60 * 1000;
    const [monitorRunsLastHour, actionsProposedLastHour, panicTogglesLastHour] = await Promise.all([
      ledger.countSince("monitor.run", oneHourMs),
      ledger.countSince("action.proposed", oneHourMs),
      ledger.countSince("panic.toggle", oneHourMs),
    ]);
    return {
      daemon: {
        running: daemon !== null,
        pid: daemon?.pid ?? null,
        hostname: daemon?.hostname ?? null,
        startedAt: daemon?.startedAt ?? null,
        workspaceRoot: daemon?.workspaceRoot ?? null,
      },
      profile: { name: profile.name, defaultLevel: profile.defaultLevel },
      cadence: {
        panicStop: budget.cadence.panicStop,
        maxMonitorRunsPerHour: budget.cadence.maxMonitorRunsPerHour,
        maxActionsPerHour: budget.cadence.maxActionsPerHour,
      },
      budget: {
        llmTokensDaily: budget.budget.llmTokens.dailyBudget,
        npmRequestsPerHour: budget.budget.externalRequests.npmPerHour,
        githubRequestsPerHour: budget.budget.externalRequests.githubPerHour,
      },
      usage: {
        monitorRunsLastHour,
        actionsProposedLastHour,
        panicTogglesLastHour,
      },
      counts: {
        observations: observations.length,
        signals: signals.length,
        actions: actions.length,
        ledgerEntries: sideEffects.length,
      },
    };
  }

  async observations(limit = 100): Promise<readonly Observation[]> {
    const bounded = Math.min(MAX_OBSERVATIONS_LIMIT, Math.max(1, limit));
    const all = await new ObservationStore(this.workspaceRoot).readAll();
    return all.slice(-bounded).reverse();
  }

  async signals(): Promise<SentinelSignalSnapshot> {
    const store = new SignalStore(this.workspaceRoot);
    const suppressions = new SuppressionStore(this.workspaceRoot);
    const filter = new SuppressionFilter(suppressions);
    const all = await store.readAll();
    const projected = await filter.apply(all);
    const sorted = [...projected].sort((a, b) => b.priority - a.priority);
    const suppressedIds = projected
      .filter((signal) => signal.status === "suppressed")
      .map((signal) => signal.id);
    return { signals: sorted, suppressedIds };
  }

  async actions(): Promise<SentinelActionSnapshot> {
    const actionStore = new ActionStore(this.workspaceRoot);
    const all = await actionStore.listAll();
    const sorted = [...all].sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
    return { actions: sorted };
  }

  async approvals(actionId?: string): Promise<SentinelApprovalsSnapshot> {
    const approvalStore = new ApprovalStore(this.workspaceRoot);
    if (actionId !== undefined) {
      const forAction = await approvalStore.forAction(actionId);
      return { approvals: forAction };
    }
    const actionStore = new ActionStore(this.workspaceRoot);
    const all = await actionStore.listAll();
    const lists = await Promise.all(all.map((action) => approvalStore.forAction(action.id)));
    return { approvals: lists.flat() };
  }

  async ledger(actionId?: string, limit = 100): Promise<readonly SideEffect[]> {
    const bounded = Math.min(MAX_LEDGER_LIMIT, Math.max(1, limit));
    const all = await LedgerStore.global(this.workspaceRoot).readAll();
    const filtered =
      actionId === undefined ? all : all.filter((entry) => entry.actionPlanId === actionId);
    return filtered.slice(-bounded).reverse();
  }

  async verifications(limit = 20): Promise<SentinelVerificationSnapshot> {
    const bounded = Math.min(MAX_VERIFICATION_LIMIT, Math.max(1, limit));
    const runsRoot = path.join(this.workspaceRoot, SENTINEL_ACTIONS_DIR, SENTINEL_RUNS_DIR);
    if (!(await exists(runsRoot))) {
      return { rows: [] };
    }
    const entries = await fs.readdir(runsRoot, { withFileTypes: true });
    const actionStore = new ActionStore(this.workspaceRoot);
    const allActions = await actionStore.listAll();
    const titleByAction = new Map(allActions.map((action) => [action.id, action.title]));
    const rows: SentinelVerificationRow[] = [];
    for (const entry of entries) {
      if (!entry.isDirectory()) {
        continue;
      }
      const verificationPath = sentinelRunVerificationPath(this.workspaceRoot, entry.name);
      if (!(await exists(verificationPath))) {
        continue;
      }
      try {
        const raw = await fs.readFile(verificationPath, "utf8");
        const parsed: unknown = JSON.parse(raw);
        const validated = VerificationFileSchema.safeParse(parsed);
        if (!validated.success) {
          continue;
        }
        rows.push({
          actionId: validated.data.actionPlanId,
          actionTitle: titleByAction.get(validated.data.actionPlanId) ?? null,
          status: validated.data.status,
          checks: validated.data.checks,
          completedAt: validated.data.completedAt,
        });
      } catch {
        continue;
      }
    }
    rows.sort((a, b) => b.completedAt.localeCompare(a.completedAt));
    return { rows: rows.slice(0, bounded) };
  }

  async watchdog(limit = 50): Promise<{
    readonly runs: readonly import("../../domain/sentinel/watchdog/intervention.js").AgentRunState[];
    readonly interventions: readonly import("../../domain/sentinel/watchdog/intervention.js").WatchdogInterventionRecord[];
  }> {
    const dog = new (await import("../sentinel/watchdog/watchdog.js")).Watchdog(this.workspaceRoot);
    const [runs, interventions] = await Promise.all([
      dog.listRuns(),
      dog.listInterventions(Math.min(200, Math.max(1, limit))),
    ]);
    return { runs, interventions };
  }

  async policy(): Promise<SentinelPolicySnapshot> {
    const [snapshot, active, deniedPaths, deniedCommands] = await Promise.all([
      loadBudgetSnapshot(this.workspaceRoot),
      new ActiveProfileStore(this.workspaceRoot).read(),
      loadDeniedPaths(this.workspaceRoot),
      loadDeniedCommands(this.workspaceRoot),
    ]);
    const profile = builtInProfile(active.name);
    return {
      activeProfile: { ...profile, defaultLevel: active.defaultLevel },
      cadence: {
        globalMinIntervalSeconds: snapshot.cadence.globalMinIntervalSeconds,
        perMonitorJitterPercent: snapshot.cadence.perMonitorJitterPercent,
        maxMonitorRunsPerHour: snapshot.cadence.maxMonitorRunsPerHour,
        maxActionsPerHour: snapshot.cadence.maxActionsPerHour,
        panicStop: snapshot.cadence.panicStop,
      },
      budget: {
        llmTokensDaily: snapshot.budget.llmTokens.dailyBudget,
        perActionBudget: snapshot.budget.llmTokens.perActionBudget,
        npmRequestsPerHour: snapshot.budget.externalRequests.npmPerHour,
        githubRequestsPerHour: snapshot.budget.externalRequests.githubPerHour,
      },
      deniedPaths,
      deniedCommands,
    };
  }
}
