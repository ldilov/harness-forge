import { ObservationStore, MonitorRunsStore } from "../../../infrastructure/sentinel/stores/observation-store.js";
import type { Observation, MonitorRunRecord } from "../../../domain/sentinel/observation/observation.js";
import { applyClassifyRule } from "../../../domain/sentinel/monitor/monitor.js";
import type { LoadedMonitor } from "./registry.js";
import type { SourceAdapter, SourceAdapterRegistry } from "./source-adapter.js";
import { RepoDriftSourceAdapter } from "./builtins/repo-drift.js";
import { DependencyRiskSourceAdapter } from "./builtins/dependency-risk.js";
import { AdrDriftSourceAdapter } from "./builtins/adr-drift.js";
import { SourceAdapterRegistry as Registry } from "./source-adapter.js";
import { CadenceLedger } from "../budget/cadence-ledger.js";
import { BudgetGuard, loadBudgetSnapshot } from "../budget/budget-ledger.js";
import { nowISO } from "../../../shared/timestamps.js";
import { SignalCorrelator } from "../classifier/correlator.js";
import { SignalStore } from "../../../infrastructure/sentinel/stores/signal-store.js";
import type { Signal } from "../../../domain/sentinel/signal/signal.js";
import { ActionPlanner } from "../action-planner/planner.js";
import { ActionStore } from "../../../infrastructure/sentinel/stores/action-store.js";
import type { ActionPlan } from "../../../domain/sentinel/action/action-plan.js";

export interface MonitorRunOutcome {
  readonly monitorId: string;
  readonly observations: readonly Observation[];
  readonly signalsCreated: readonly Signal[];
  readonly signalsUpdated: readonly Signal[];
  readonly actionsProposed: readonly ActionPlan[];
  readonly dedupedCount: number;
  readonly errors: readonly string[];
  readonly skipped: boolean;
  readonly skipReason?: string;
  readonly durationMs: number;
}

export function defaultAdapterRegistry(): SourceAdapterRegistry {
  const registry = new Registry();
  registry.register(new RepoDriftSourceAdapter());
  registry.register(new DependencyRiskSourceAdapter());
  registry.register(new AdrDriftSourceAdapter());
  return registry;
}

async function runOne(
  workspaceRoot: string,
  monitor: LoadedMonitor,
  adapter: SourceAdapter,
  store: ObservationStore,
  runsStore: MonitorRunsStore,
  ledger: CadenceLedger,
  correlator: SignalCorrelator,
  planner: ActionPlanner,
): Promise<MonitorRunOutcome> {
  const startedAt = nowISO();
  const startedTime = Date.now();
  let dedupedCount = 0;
  const observations: Observation[] = [];
  const errors: string[] = [];
  let allIngested = true;
  try {
    const collected = await adapter.collect({ workspaceRoot, monitor });
    for (const draft of collected.drafts) {
      const finalSeverity = applyClassifyRule(monitor.config.classify, draft.classifyKey, draft.severity);
      const classified = finalSeverity === draft.severity ? draft : { ...draft, severity: finalSeverity };
      try {
        const result = await store.ingest(classified);
        observations.push(result.observation);
        if (result.deduped) {
          dedupedCount += 1;
        }
      } catch (ingestError: unknown) {
        allIngested = false;
        errors.push(ingestError instanceof Error ? ingestError.message : String(ingestError));
      }
    }
    if (allIngested && collected.commit !== undefined) {
      try {
        await collected.commit();
      } catch (commitError: unknown) {
        errors.push(commitError instanceof Error ? commitError.message : String(commitError));
      }
    }
  } catch (error: unknown) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  const endedAt = nowISO();
  const durationMs = Date.now() - startedTime;
  const record: MonitorRunRecord = {
    monitorId: monitor.config.id,
    startedAt,
    endedAt,
    durationMs,
    observationsEmitted: observations.length - dedupedCount,
    observationsDeduped: dedupedCount,
    errors,
  };
  await runsStore.record(record);
  await ledger.record({
    kind: "monitor.run",
    subject: monitor.config.id,
    detail: {
      durationMs,
      observationsEmitted: record.observationsEmitted,
      observationsDeduped: record.observationsDeduped,
      errors: errors.length,
    },
  });
  let signalsCreated: readonly Signal[] = [];
  let signalsUpdated: readonly Signal[] = [];
  let actionsProposed: readonly ActionPlan[] = [];
  if (observations.length > 0) {
    try {
      const correlation = await correlator.correlate(observations);
      signalsCreated = correlation.created;
      signalsUpdated = correlation.updated;
      const proposals: ActionPlan[] = [];
      for (const signal of [...correlation.created, ...correlation.updated]) {
        const proposed = await planner.proposeFromSignal(signal);
        if (proposed !== null) {
          proposals.push(proposed);
          await ledger.record({
            kind: "action.proposed",
            subject: proposed.id,
            detail: { signalId: signal.id, intent: proposed.title },
          });
        }
      }
      actionsProposed = proposals;
    } catch (correlationError: unknown) {
      errors.push(correlationError instanceof Error ? correlationError.message : String(correlationError));
    }
  }
  return {
    monitorId: monitor.config.id,
    observations,
    signalsCreated,
    signalsUpdated,
    actionsProposed,
    dedupedCount,
    errors,
    skipped: false,
    durationMs,
  };
}

export interface OrchestratorOptions {
  readonly workspaceRoot: string;
  readonly monitors: readonly LoadedMonitor[];
  readonly adapters?: SourceAdapterRegistry;
}

export class MonitorRunner {
  private readonly adapters: SourceAdapterRegistry;
  private readonly observations: ObservationStore;
  private readonly runs: MonitorRunsStore;
  private readonly ledger: CadenceLedger;
  private readonly correlator: SignalCorrelator;
  private readonly planner: ActionPlanner;

  constructor(private readonly opts: OrchestratorOptions) {
    this.adapters = opts.adapters ?? defaultAdapterRegistry();
    this.observations = new ObservationStore(opts.workspaceRoot);
    this.runs = new MonitorRunsStore(opts.workspaceRoot);
    this.ledger = new CadenceLedger(opts.workspaceRoot);
    this.correlator = new SignalCorrelator(new SignalStore(opts.workspaceRoot));
    this.planner = new ActionPlanner(new ActionStore(opts.workspaceRoot));
  }

  async runOnce(filter?: { readonly kind?: string }): Promise<readonly MonitorRunOutcome[]> {
    const snapshot = await loadBudgetSnapshot(this.opts.workspaceRoot);
    const guard = new BudgetGuard(snapshot.budget, snapshot.cadence);
    if (guard.isPanicStopped()) {
      await this.ledger.record({ kind: "panic.toggle", subject: "engine.run-once", detail: { halted: true } });
      return [
        {
          monitorId: "*",
          observations: [],
          signalsCreated: [],
          signalsUpdated: [],
          actionsProposed: [],
          dedupedCount: 0,
          errors: [],
          skipped: true,
          skipReason: "panic_stop",
          durationMs: 0,
        },
      ];
    }
    const candidates = filter?.kind === undefined
      ? this.opts.monitors
      : this.opts.monitors.filter((m) => m.config.id === filter.kind || m.config.source === filter.kind);
    const results: MonitorRunOutcome[] = [];
    for (const monitor of candidates) {
      const adapter = this.adapters.get(monitor.config.source);
      if (adapter === undefined) {
        results.push({
          monitorId: monitor.config.id,
          observations: [],
          signalsCreated: [],
          signalsUpdated: [],
          actionsProposed: [],
          dedupedCount: 0,
          errors: [`no adapter registered for source '${monitor.config.source}'`],
          skipped: true,
          skipReason: "no_adapter",
          durationMs: 0,
        });
        continue;
      }
      const usedRunsThisHour = await this.ledger.countSince("monitor.run", 60 * 60 * 1000);
      const cadenceDecision = guard.decideMonitorRun(usedRunsThisHour);
      if (cadenceDecision.decision === "block") {
        await this.ledger.record({
          kind: "budget.decision",
          subject: monitor.config.id,
          detail: { reason: cadenceDecision.reason, used: cadenceDecision.used, limit: cadenceDecision.limit },
        });
        results.push({
          monitorId: monitor.config.id,
          observations: [],
          signalsCreated: [],
          signalsUpdated: [],
          actionsProposed: [],
          dedupedCount: 0,
          errors: [],
          skipped: true,
          skipReason: cadenceDecision.reason,
          durationMs: 0,
        });
        continue;
      }
      const outcome = await runOne(
        this.opts.workspaceRoot,
        monitor,
        adapter,
        this.observations,
        this.runs,
        this.ledger,
        this.correlator,
        this.planner,
      );
      results.push(outcome);
    }
    return results;
  }
}
