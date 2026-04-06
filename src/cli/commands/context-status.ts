import path from 'node:path';
import { Command } from 'commander';

import { DEFAULT_WORKSPACE_ROOT, RUNTIME_DIR, RUNTIME_CONTEXT_BUDGET_FILE, RUNTIME_MEMORY_POLICY_FILE, RUNTIME_MEMORY_FILE } from '../../shared/constants.js';
import { exists, readJsonFile, readTextFile } from '../../shared/fs.js';
import { toJson } from '../../infrastructure/diagnostics/reporter.js';

export function registerContextStatusCommands(program: Command): void {
  const ctx = program
    .command('context')
    .description('Inspect and manage behavior promotion context.');

  ctx
    .command('status')
    .description('Show current memory size, budget utilization, active context summary, and warnings.')
    .option('--root <root>', 'workspace root', DEFAULT_WORKSPACE_ROOT)
    .option('--json', 'json output', false)
    .action(async (options) => {
      const root = path.resolve(options.root);

      const budgetPath = path.join(root, RUNTIME_DIR, RUNTIME_CONTEXT_BUDGET_FILE);
      const memoryPath = path.join(root, RUNTIME_MEMORY_FILE);
      const policyPath = path.join(root, RUNTIME_DIR, RUNTIME_MEMORY_POLICY_FILE);

      const status: Record<string, unknown> = {};

      if (await exists(memoryPath)) {
        const content = await readTextFile(memoryPath);
        const wordCount = content.split(/\s+/).filter(Boolean).length;
        const estimatedTokens = Math.ceil(content.length / 4);
        status.memory = { wordCount, estimatedTokens, path: memoryPath };
      } else {
        status.memory = { error: 'MEMORY.md not found' };
      }

      if (await exists(budgetPath)) {
        status.budget = await readJsonFile(budgetPath);
      }

      if (await exists(policyPath)) {
        status.policy = await readJsonFile(policyPath);
      }

      const warnings: string[] = [];
      if (status.memory && typeof status.memory === 'object' && 'estimatedTokens' in status.memory) {
        const mem = status.memory as { estimatedTokens: number };
        const policy = status.policy as { hardCapTokens?: number } | undefined;
        if (policy?.hardCapTokens && mem.estimatedTokens > policy.hardCapTokens) {
          warnings.push(`Memory exceeds hard cap (${mem.estimatedTokens} > ${policy.hardCapTokens})`);
        }
      }
      status.warnings = warnings;

      if (options.json) {
        process.stdout.write(toJson(status));
      } else {
        process.stdout.write(`Context Status:\n${JSON.stringify(status, null, 2)}\n`);
      }
    });

  ctx
    .command('budget')
    .description('Show current context budget state.')
    .option('--root <root>', 'workspace root', DEFAULT_WORKSPACE_ROOT)
    .option('--json', 'json output', false)
    .action(async (options) => {
      const root = path.resolve(options.root);
      const budgetPath = path.join(root, RUNTIME_DIR, RUNTIME_CONTEXT_BUDGET_FILE);

      if (await exists(budgetPath)) {
        const budget = await readJsonFile(budgetPath);
        if (options.json) {
          process.stdout.write(toJson(budget));
        } else {
          process.stdout.write(`Budget:\n${JSON.stringify(budget, null, 2)}\n`);
        }
      } else {
        process.stderr.write('No context-budget.json found.\n');
      }
    });
}
