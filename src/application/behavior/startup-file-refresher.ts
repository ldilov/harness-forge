import path from 'node:path';

import { LoadOrderSchema } from '@domain/behavior/load-order.js';
import { MemoryPolicySchema } from '@domain/behavior/memory-policy.js';
import { SubagentBriefPolicySchema } from '@domain/behavior/subagent-brief-policy.js';
import { ContextBudgetSchema } from '@domain/compaction/context-budget.js';
import {
  RUNTIME_DIR,
  RUNTIME_LOAD_ORDER_FILE,
  RUNTIME_MEMORY_POLICY_FILE,
  RUNTIME_SUBAGENT_BRIEF_POLICY_DIR,
  RUNTIME_SUBAGENT_BRIEF_POLICY_FILE,
  RUNTIME_MEMORY_FILE,
  RUNTIME_SESSION_SUMMARY_FILE,
  RUNTIME_ACTIVE_CONTEXT_FILE,
  RUNTIME_CONTEXT_BUDGET_FILE,
} from '@shared/constants.js';
import { exists, writeJsonFile } from '@shared/fs.js';

import { StartupFileGenerator } from './startup-file-generator.js';

export interface RefreshReport {
  readonly regenerated: readonly string[];
  readonly preserved: readonly string[];
  readonly restored: readonly string[];
}

export class StartupFileRefresher {
  private readonly workspaceRoot: string;

  constructor(workspaceRoot: string) {
    this.workspaceRoot = workspaceRoot;
  }

  async refresh(): Promise<RefreshReport> {
    const regenerated: string[] = [];
    const preserved: string[] = [];
    const restored: string[] = [];

    // MEMORY.md: preserve if exists, restore if missing
    const memoryPath = path.join(this.workspaceRoot, RUNTIME_MEMORY_FILE);
    if (await exists(memoryPath)) {
      preserved.push(RUNTIME_MEMORY_FILE);
    } else {
      const gen = new StartupFileGenerator(this.workspaceRoot);
      await gen.generate();
      restored.push(RUNTIME_MEMORY_FILE);
    }

    // JSON policy files: always regenerate deterministically
    const jsonDefaults: ReadonlyArray<{ rel: string; value: unknown }> = [
      {
        rel: path.join(RUNTIME_DIR, RUNTIME_CONTEXT_BUDGET_FILE),
        value: ContextBudgetSchema.parse({ model: {}, budgets: {}, thresholds: {}, current: {} }),
      },
      { rel: path.join(RUNTIME_DIR, RUNTIME_LOAD_ORDER_FILE), value: LoadOrderSchema.parse({}) },
      { rel: path.join(RUNTIME_DIR, RUNTIME_MEMORY_POLICY_FILE), value: MemoryPolicySchema.parse({}) },
      {
        rel: path.join(RUNTIME_DIR, RUNTIME_SUBAGENT_BRIEF_POLICY_DIR, RUNTIME_SUBAGENT_BRIEF_POLICY_FILE),
        value: SubagentBriefPolicySchema.parse({}),
      },
    ];

    for (const { rel, value } of jsonDefaults) {
      const abs = path.join(this.workspaceRoot, rel);
      await writeJsonFile(abs, value);
      regenerated.push(rel);
    }

    // Session summary and active context: restore if missing, preserve if exists
    const structuralFiles = [
      path.join(RUNTIME_DIR, RUNTIME_SESSION_SUMMARY_FILE),
      path.join(RUNTIME_DIR, RUNTIME_ACTIVE_CONTEXT_FILE),
    ];

    for (const rel of structuralFiles) {
      const abs = path.join(this.workspaceRoot, rel);
      if (await exists(abs)) {
        preserved.push(rel);
      } else {
        // Use full generator to restore missing file
        const gen = new StartupFileGenerator(this.workspaceRoot);
        await gen.generate();
        restored.push(rel);
        break; // generator creates all files, no need to continue
      }
    }

    return { regenerated, preserved, restored };
  }
}
