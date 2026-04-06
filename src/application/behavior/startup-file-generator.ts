import path from 'node:path';

import { ContextBudgetSchema } from '@domain/compaction/context-budget.js';
import type { SessionSummary } from '@domain/compaction/session-summary.js';
import type { ActiveContext } from '@domain/compaction/active-context.js';
import { LoadOrderSchema } from '@domain/behavior/load-order.js';
import { MemoryPolicySchema } from '@domain/behavior/memory-policy.js';
import { SubagentBriefPolicySchema } from '@domain/behavior/subagent-brief-policy.js';
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
import { writeJsonFile, writeTextFile } from '@shared/fs.js';
import type { BehaviorEventEmitter } from './behavior-event-emitter.js';

const MEMORY_MD_TEMPLATE = `# Memory

## Current Objective

_No objective set._

## Current State

_Fresh workspace — no prior session state._

## Accepted Decisions

_None yet._

## Constraints

_None yet._

## Open Questions / Blockers

_None yet._

## Next Best Actions

- Review workspace and set an objective.

## Canonical References

- \`.hforge/runtime/active-context.json\`
- \`.hforge/runtime/session-summary.json\`
- \`.hforge/runtime/context-budget.json\`
`;

export interface GeneratedFile {
  readonly relativePath: string;
  readonly absolutePath: string;
}

export class StartupFileGenerator {
  private readonly workspaceRoot: string;
  private readonly emitter?: BehaviorEventEmitter;

  constructor(workspaceRoot: string, emitter?: BehaviorEventEmitter) {
    this.workspaceRoot = workspaceRoot;
    this.emitter = emitter;
  }

  async generate(): Promise<readonly GeneratedFile[]> {
    const startTime = Date.now();
    this.emitter?.emitContextLoadStarted({
      workspaceRoot: this.workspaceRoot,
    });

    const generated: GeneratedFile[] = [];

    const files = [
      { rel: RUNTIME_MEMORY_FILE, fn: () => this.generateMemoryMd() },
      { rel: path.join(RUNTIME_DIR, RUNTIME_SESSION_SUMMARY_FILE), fn: () => this.generateSessionSummary() },
      { rel: path.join(RUNTIME_DIR, RUNTIME_ACTIVE_CONTEXT_FILE), fn: () => this.generateActiveContext() },
      { rel: path.join(RUNTIME_DIR, RUNTIME_CONTEXT_BUDGET_FILE), fn: () => this.generateContextBudget() },
      { rel: path.join(RUNTIME_DIR, RUNTIME_LOAD_ORDER_FILE), fn: () => this.generateLoadOrder() },
      { rel: path.join(RUNTIME_DIR, RUNTIME_MEMORY_POLICY_FILE), fn: () => this.generateMemoryPolicy() },
      {
        rel: path.join(RUNTIME_DIR, RUNTIME_SUBAGENT_BRIEF_POLICY_DIR, RUNTIME_SUBAGENT_BRIEF_POLICY_FILE),
        fn: () => this.generateSubagentBriefPolicy(),
      },
    ];

    for (const { rel, fn } of files) {
      const abs = path.join(this.workspaceRoot, rel);
      await fn();
      generated.push({ relativePath: rel, absolutePath: abs });
    }

    this.emitter?.emitStartupFilesGenerated({
      filesGenerated: generated.length,
      paths: generated.map((f) => f.relativePath),
      durationMs: Date.now() - startTime,
    });

    this.emitter?.emitContextLoad({
      sourcesLoaded: generated.length,
      durationMs: Date.now() - startTime,
      loadOrder: generated.map((f) => f.relativePath),
    });

    return generated;
  }

  private async generateMemoryMd(): Promise<void> {
    const abs = path.join(this.workspaceRoot, RUNTIME_MEMORY_FILE);
    await writeTextFile(abs, MEMORY_MD_TEMPLATE);
  }

  private async generateSessionSummary(): Promise<void> {
    const abs = path.join(this.workspaceRoot, RUNTIME_DIR, RUNTIME_SESSION_SUMMARY_FILE);
    const defaults: SessionSummary = {
      schemaVersion: '1.0.0',
      summaryId: 'initial',
      createdAt: new Date().toISOString(),
      coversEvents: ['none', 'none'],
      objective: 'No objective set.',
      acceptedPlan: [],
      decisions: [],
      importantFindings: [],
      artifacts: [],
      unresolved: [],
    };
    await writeJsonFile(abs, defaults);
  }

  private async generateActiveContext(): Promise<void> {
    const abs = path.join(this.workspaceRoot, RUNTIME_DIR, RUNTIME_ACTIVE_CONTEXT_FILE);
    const defaults: ActiveContext = {
      schemaVersion: '1.0.0',
      objective: 'No objective set.',
      acceptedPlan: [],
      latestDeltaRef: 'none',
      sessionSummaryRef: path.join(RUNTIME_DIR, RUNTIME_SESSION_SUMMARY_FILE),
      targetPosture: {},
      unresolved: [],
    };
    await writeJsonFile(abs, defaults);
  }

  private async generateContextBudget(): Promise<void> {
    const abs = path.join(this.workspaceRoot, RUNTIME_DIR, RUNTIME_CONTEXT_BUDGET_FILE);
    const defaults = ContextBudgetSchema.parse({
      model: {},
      budgets: {},
      thresholds: {},
      current: {},
    });
    await writeJsonFile(abs, defaults);
  }

  private async generateLoadOrder(): Promise<void> {
    const abs = path.join(this.workspaceRoot, RUNTIME_DIR, RUNTIME_LOAD_ORDER_FILE);
    const defaults = LoadOrderSchema.parse({});
    await writeJsonFile(abs, defaults);
  }

  private async generateMemoryPolicy(): Promise<void> {
    const abs = path.join(this.workspaceRoot, RUNTIME_DIR, RUNTIME_MEMORY_POLICY_FILE);
    const defaults = MemoryPolicySchema.parse({});
    await writeJsonFile(abs, defaults);
  }

  private async generateSubagentBriefPolicy(): Promise<void> {
    const abs = path.join(
      this.workspaceRoot,
      RUNTIME_DIR,
      RUNTIME_SUBAGENT_BRIEF_POLICY_DIR,
      RUNTIME_SUBAGENT_BRIEF_POLICY_FILE,
    );
    const defaults = SubagentBriefPolicySchema.parse({});
    await writeJsonFile(abs, defaults);
  }
}
