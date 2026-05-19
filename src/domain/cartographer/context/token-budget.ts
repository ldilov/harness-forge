import type { ContextBudget, RankedRef } from "./context-bundle.js";

const BUDGET_FILE_LIMITS: Readonly<Record<ContextBudget, number>> = {
  small: 10,
  medium: 25,
  large: 60,
};

const BUDGET_TOKEN_CEILINGS: Readonly<Record<ContextBudget, number>> = {
  small: 4000,
  medium: 12000,
  large: 32000,
};

export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}

export interface BudgetedSelection {
  readonly selected: readonly RankedRef[];
  readonly omitted: readonly RankedRef[];
  readonly truncated: boolean;
  readonly estimatedTokens: number;
}

export function applyBudget(
  ranked: readonly RankedRef[],
  budget: ContextBudget,
  perRefTokenEstimate: (ref: RankedRef) => number,
): BudgetedSelection {
  const fileLimit = BUDGET_FILE_LIMITS[budget];
  const tokenCeiling = BUDGET_TOKEN_CEILINGS[budget];
  const selected: RankedRef[] = [];
  const omitted: RankedRef[] = [];
  let runningTokens = 0;
  for (const ref of ranked) {
    const cost = perRefTokenEstimate(ref);
    const fitsBudget = selected.length < fileLimit && runningTokens + cost <= tokenCeiling;
    if (fitsBudget || selected.length === 0) {
      selected.push(ref);
      runningTokens += cost;
    } else {
      omitted.push(ref);
    }
  }
  return {
    selected,
    omitted,
    truncated: omitted.length > 0,
    estimatedTokens: runningTokens,
  };
}
