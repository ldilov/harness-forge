import { z } from "zod";
import { AtomicJsonStore } from "./atomic-json-store.js";
import {
  ActionPlan,
  ActionPlanSchema,
  ActionStatus,
} from "../../../domain/sentinel/action/action-plan.js";
import { sentinelActionsQueuePath } from "../../../domain/sentinel/paths.js";

interface Queue {
  readonly plans: ActionPlan[];
  readonly bySignal: Record<string, string>;
}

function emptyQueue(): Queue {
  return { plans: [], bySignal: {} };
}

const QueueShape = z
  .object({
    plans: z.array(ActionPlanSchema),
    bySignal: z.record(z.string(), z.string()),
  })
  .strict();

function validateQueue(raw: unknown): Queue {
  return QueueShape.parse(raw);
}

export class ActionStore {
  private readonly store: AtomicJsonStore<Queue>;

  constructor(workspaceRoot: string) {
    this.store = new AtomicJsonStore<Queue>(
      sentinelActionsQueuePath(workspaceRoot),
      () => emptyQueue(),
      { validate: validateQueue },
    );
  }

  async listAll(): Promise<readonly ActionPlan[]> {
    const queue = await this.store.read();
    return queue.plans;
  }

  async findById(id: string): Promise<ActionPlan | null> {
    const queue = await this.store.read();
    return queue.plans.find((plan) => plan.id === id) ?? null;
  }

  async findBySignal(signalId: string): Promise<ActionPlan | null> {
    const queue = await this.store.read();
    const planId = queue.bySignal[signalId];
    if (planId === undefined) {
      return null;
    }
    return queue.plans.find((plan) => plan.id === planId) ?? null;
  }

  async upsert(plan: ActionPlan): Promise<{ readonly created: boolean; readonly plan: ActionPlan }> {
    const validated = ActionPlanSchema.parse(plan);
    let created = false;
    await this.store.update((current) => {
      const idx = current.plans.findIndex((existing) => existing.id === validated.id);
      const nextPlans = [...current.plans];
      if (idx === -1) {
        nextPlans.push(validated);
        created = true;
      } else {
        nextPlans[idx] = validated;
      }
      const nextBySignal = { ...current.bySignal };
      for (const signalId of validated.sourceSignalIds) {
        nextBySignal[signalId] = validated.id;
      }
      return { plans: nextPlans, bySignal: nextBySignal };
    });
    return { created, plan: validated };
  }

  async setStatus(id: string, status: ActionStatus, updatedAt: string): Promise<ActionPlan | null> {
    let target: ActionPlan | null = null;
    await this.store.update((current) => {
      const idx = current.plans.findIndex((existing) => existing.id === id);
      if (idx === -1) {
        return current;
      }
      const updated: ActionPlan = ActionPlanSchema.parse({
        ...current.plans[idx]!,
        status,
        updatedAt,
      });
      const nextPlans = [...current.plans];
      nextPlans[idx] = updated;
      target = updated;
      return { ...current, plans: nextPlans };
    });
    return target;
  }
}
