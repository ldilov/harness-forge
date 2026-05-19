import path from "node:path";
import { parse as parseYaml } from "yaml";
import { exists } from "../../../shared/fs.js";
import { readTextFile } from "../../../shared/fs.js";
import {
  sentinelBudgetPath,
  sentinelCadencePath,
} from "../../../domain/sentinel/paths.js";
import { z } from "zod";

export const BudgetConfigSchema = z
  .object({
    llmTokens: z
      .object({
        dailyBudget: z.number().int().nonnegative().default(0),
        perActionBudget: z.number().int().nonnegative().default(0),
        perMonitorBudget: z.number().int().nonnegative().default(0),
      })
      .default({}),
    externalRequests: z
      .object({
        npmPerHour: z.number().int().nonnegative().default(30),
        githubPerHour: z.number().int().nonnegative().default(60),
      })
      .default({}),
  })
  .strict();
export type BudgetConfig = z.infer<typeof BudgetConfigSchema>;

export const CadenceConfigSchema = z
  .object({
    globalMinIntervalSeconds: z.number().int().positive().default(30),
    perMonitorJitterPercent: z.number().min(0).max(100).default(15),
    maxMonitorRunsPerHour: z.number().int().positive().default(240),
    maxActionsPerHour: z.number().int().nonnegative().default(10),
    maxApprovalsPerHour: z.number().int().nonnegative().default(30),
    panicStop: z.boolean().default(false),
  })
  .strict();
export type CadenceConfig = z.infer<typeof CadenceConfigSchema>;

export const DEFAULT_BUDGET: BudgetConfig = BudgetConfigSchema.parse({});
export const DEFAULT_CADENCE: CadenceConfig = CadenceConfigSchema.parse({});

export async function loadBudget(workspaceRoot: string): Promise<BudgetConfig> {
  const filePath = sentinelBudgetPath(workspaceRoot);
  if (!(await exists(filePath))) {
    return DEFAULT_BUDGET;
  }
  const raw = await readTextFile(filePath);
  return BudgetConfigSchema.parse(parseYaml(raw) ?? {});
}

export async function loadCadence(workspaceRoot: string): Promise<CadenceConfig> {
  const filePath = sentinelCadencePath(workspaceRoot);
  if (!(await exists(filePath))) {
    return DEFAULT_CADENCE;
  }
  const raw = await readTextFile(filePath);
  return CadenceConfigSchema.parse(parseYaml(raw) ?? {});
}

export interface BudgetDecision {
  readonly decision: "allow" | "block";
  readonly reason: string;
  readonly used: number;
  readonly limit: number;
}

export class BudgetGuard {
  constructor(private readonly budget: BudgetConfig, private readonly cadence: CadenceConfig) {}

  decideTokens(requested: number, usedToday: number): BudgetDecision {
    const limit = this.budget.llmTokens.dailyBudget;
    if (limit === 0 && requested > 0) {
      return { decision: "block", reason: "llm_tokens_disabled", used: usedToday, limit };
    }
    if (usedToday + requested > limit) {
      return { decision: "block", reason: "llm_tokens_daily_exhausted", used: usedToday, limit };
    }
    return { decision: "allow", reason: "ok", used: usedToday, limit };
  }

  decideAction(usedThisHour: number): BudgetDecision {
    const limit = this.cadence.maxActionsPerHour;
    if (usedThisHour >= limit) {
      return { decision: "block", reason: "actions_per_hour_exhausted", used: usedThisHour, limit };
    }
    return { decision: "allow", reason: "ok", used: usedThisHour, limit };
  }

  decideMonitorRun(usedThisHour: number): BudgetDecision {
    const limit = this.cadence.maxMonitorRunsPerHour;
    if (usedThisHour >= limit) {
      return {
        decision: "block",
        reason: "monitor_runs_per_hour_exhausted",
        used: usedThisHour,
        limit,
      };
    }
    return { decision: "allow", reason: "ok", used: usedThisHour, limit };
  }

  decideExternalRequest(
    kind: "npm" | "github",
    usedThisHour: number,
  ): BudgetDecision {
    const limit =
      kind === "npm"
        ? this.budget.externalRequests.npmPerHour
        : this.budget.externalRequests.githubPerHour;
    if (usedThisHour >= limit) {
      return {
        decision: "block",
        reason: `${kind}_requests_per_hour_exhausted`,
        used: usedThisHour,
        limit,
      };
    }
    return { decision: "allow", reason: "ok", used: usedThisHour, limit };
  }

  isPanicStopped(): boolean {
    return this.cadence.panicStop;
  }
}

export interface BudgetSnapshot {
  readonly budget: BudgetConfig;
  readonly cadence: CadenceConfig;
  readonly source: { readonly budget: string; readonly cadence: string };
}

export async function loadBudgetSnapshot(workspaceRoot: string): Promise<BudgetSnapshot> {
  const budget = await loadBudget(workspaceRoot);
  const cadence = await loadCadence(workspaceRoot);
  return {
    budget,
    cadence,
    source: {
      budget: path.relative(workspaceRoot, sentinelBudgetPath(workspaceRoot)),
      cadence: path.relative(workspaceRoot, sentinelCadencePath(workspaceRoot)),
    },
  };
}
