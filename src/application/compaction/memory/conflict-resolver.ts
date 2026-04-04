import path from 'node:path';

import { readJsonFile, exists } from '../../../shared/fs.js';
import type { ActiveContext } from '../../../domain/compaction/active-context.js';
import type { MemorySessionSummary } from '../../../domain/compaction/memory/memory-session-summary.js';

interface ConflictResult {
  readonly conflicts: readonly string[];
  readonly resolved: MemorySessionSummary;
}

export async function resolveConflicts(
  memoryData: MemorySessionSummary,
  runtimeContextPath: string,
): Promise<ConflictResult> {
  const contextFile = path.join(runtimeContextPath, 'active-context.json');
  const conflicts: string[] = [];

  if (!(await exists(contextFile))) {
    return { conflicts: [], resolved: memoryData };
  }

  const activeContext = await readJsonFile<ActiveContext>(contextFile);
  let resolved: MemorySessionSummary = { ...memoryData };

  if (activeContext.objective && activeContext.objective !== memoryData.objective) {
    conflicts.push(
      `Objective mismatch: memory="${memoryData.objective}" vs runtime="${activeContext.objective}"`,
    );
    resolved = { ...resolved, objective: activeContext.objective };
  }

  if (activeContext.acceptedPlan && activeContext.acceptedPlan.length > 0) {
    const memoryActions = memoryData.nextActions.join('|');
    const runtimePlan = activeContext.acceptedPlan.join('|');
    if (memoryActions !== runtimePlan) {
      conflicts.push(
        `Plan mismatch: memory nextActions differ from runtime acceptedPlan`,
      );
      resolved = { ...resolved, nextActions: [...activeContext.acceptedPlan] };
    }
  }

  if (activeContext.unresolved && activeContext.unresolved.length > 0) {
    const memoryBlockers = new Set(memoryData.blockers);
    const newBlockers: string[] = [];
    for (const item of activeContext.unresolved) {
      if (!memoryBlockers.has(item)) {
        newBlockers.push(item);
        conflicts.push(`Unresolved item from runtime not in memory: "${item}"`);
      }
    }
    if (newBlockers.length > 0) {
      resolved = { ...resolved, blockers: [...memoryData.blockers, ...newBlockers] };
    }
  }

  return { conflicts, resolved };
}
