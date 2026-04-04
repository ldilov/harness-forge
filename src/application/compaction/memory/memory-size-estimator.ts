import { SIZE_BUDGET } from '../../../domain/compaction/memory/memory-content-rules.js';

export function estimateMemoryTokens(content: string): number {
  return Math.ceil(content.length / SIZE_BUDGET.charsPerToken);
}

export function isWithinBudget(content: string): boolean {
  return estimateMemoryTokens(content) <= SIZE_BUDGET.hardCapTokens;
}

export function wordCount(content: string): number {
  return content.split(/\s+/).filter(Boolean).length;
}
