import { readFile, writeFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';
import { ContextBudgetSchema, type ContextBudget } from '../../domain/compaction/context-budget.js';

const DEFAULT_CHARS_PER_TOKEN = 4;

export function estimateTokens(text: string, charsPerToken: number = DEFAULT_CHARS_PER_TOKEN): number {
  return Math.ceil(text.length / charsPerToken);
}

export type CompactionState = ContextBudget['current']['state'];

export function recommendCompactionLevel(percentage: number, thresholds: ContextBudget['thresholds']): CompactionState {
  if (percentage >= thresholds.rolloverAt) return 'rollover';
  if (percentage >= thresholds.rollupAt) return 'rollup';
  if (percentage >= thresholds.summarizeAt) return 'summarize';
  if (percentage >= thresholds.trimAt) return 'trim';
  if (percentage >= thresholds.evaluateAt) return 'evaluate';
  return 'none';
}

export async function loadBudget(budgetPath: string): Promise<ContextBudget> {
  try {
    const raw = await readFile(budgetPath, 'utf-8');
    return ContextBudgetSchema.parse(JSON.parse(raw));
  } catch {
    return ContextBudgetSchema.parse({});
  }
}

export async function saveBudget(budgetPath: string, budget: ContextBudget): Promise<void> {
  await mkdir(dirname(budgetPath), { recursive: true });
  await writeFile(budgetPath, JSON.stringify(budget, null, 2), 'utf-8');
}

export async function updateBudgetState(
  budgetPath: string,
  estimatedInputTokens: number,
  estimatedOutputNeed: number = 0,
): Promise<ContextBudget> {
  const budget = await loadBudget(budgetPath);
  const maxTokens = budget.budgets.maxHotPathInputTokens;
  const percentage = maxTokens > 0 ? estimatedInputTokens / maxTokens : 0;
  const state = recommendCompactionLevel(percentage, budget.thresholds);

  const updated: ContextBudget = {
    ...budget,
    current: { estimatedInputTokens, estimatedOutputNeed, state },
  };
  await saveBudget(budgetPath, updated);
  return updated;
}
