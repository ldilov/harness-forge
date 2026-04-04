import { SIZE_BUDGET } from '../../../domain/compaction/memory/memory-content-rules.js';
import { estimateMemoryTokens } from './memory-size-estimator.js';

export function shouldRotateMemory(memoryContent: string): boolean {
  return estimateMemoryTokens(memoryContent) > SIZE_BUDGET.hardCapTokens;
}
