import type { Signal } from "../../../domain/sentinel/signal/signal.js";
import type { ActionStore } from "../../../infrastructure/sentinel/stores/action-store.js";
import type { ActionPlan } from "../../../domain/sentinel/action/action-plan.js";
import {
  buildRefreshHarnessRuntimeAction,
  REFRESH_HARNESS_RUNTIME_INTENT,
} from "./templates/refresh-harness-runtime.js";

type TemplateBuilder = (signal: Signal) => ActionPlan;

const REGISTRY: Readonly<Record<string, TemplateBuilder>> = {
  [REFRESH_HARNESS_RUNTIME_INTENT]: buildRefreshHarnessRuntimeAction,
};

export class ActionPlanner {
  constructor(private readonly actions: ActionStore) {}

  async proposeFromSignal(signal: Signal): Promise<ActionPlan | null> {
    if (signal.status !== "open") {
      return null;
    }
    const intent = signal.recommendedIntent;
    if (intent === undefined) {
      return null;
    }
    const builder = REGISTRY[intent];
    if (builder === undefined) {
      return null;
    }
    const existing = await this.actions.findBySignal(signal.id);
    if (existing !== null) {
      return null;
    }
    const plan = builder(signal);
    await this.actions.upsert(plan);
    return plan;
  }

  knownIntents(): readonly string[] {
    return Object.keys(REGISTRY);
  }
}
