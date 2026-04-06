import { z } from 'zod';

export const BridgeContractSchema = z.object({
  schemaVersion: z.string().default('1.0.0'),
  resumeOrder: z.array(z.string().min(1)).default([
    'AGENTS.md',
    'MEMORY.md',
    '.hforge/runtime/active-context.json',
    '.hforge/runtime/session-summary.json',
  ]),
  conflictRule: z.string().min(1).default(
    'If MEMORY.md conflicts with .hforge/runtime/*, trust .hforge/runtime/* as canonical.',
  ),
  historyRule: z.string().min(1).default(
    'Do not expand full history unless the task explicitly needs it, the required information is not recoverable from canonical runtime artifacts, or a policy override allows it.',
  ),
  subagentRule: z.string().min(1).default(
    'Spawn subagents from task-scoped briefs, not full parent memory.',
  ),
  outputRule: z.string().min(1).default(
    'Prefer brief for subagents, standard for top-level, deep only when explicitly requested.',
  ),
  canonicalRuntimePointers: z.array(z.string().min(1)).default([
    '.hforge/runtime/active-context.json',
    '.hforge/runtime/session-summary.json',
    '.hforge/runtime/context-budget.json',
    '.hforge/runtime/load-order.json',
    '.hforge/runtime/memory-policy.json',
  ]),
});

export type BridgeContract = z.infer<typeof BridgeContractSchema>;
