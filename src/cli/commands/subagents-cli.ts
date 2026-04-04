import path from 'node:path';
import { Command } from 'commander';

import { DEFAULT_WORKSPACE_ROOT, RUNTIME_DIR, RUNTIME_SUBAGENT_BRIEF_POLICY_DIR, RUNTIME_SUBAGENT_BRIEF_POLICY_FILE } from '../../shared/constants.js';
import { exists, readJsonFile } from '../../shared/fs.js';
import { toJson } from '../../infrastructure/diagnostics/reporter.js';

export function registerSubagentsCommands(program: Command): void {
  const sub = program
    .command('subagents')
    .description('Manage subagent briefs and scoping policies.');

  sub
    .command('policy')
    .description('Show current subagent brief policy.')
    .option('--root <root>', 'workspace root', DEFAULT_WORKSPACE_ROOT)
    .option('--json', 'json output', false)
    .action(async (options) => {
      const root = path.resolve(options.root);
      const policyPath = path.join(
        root,
        RUNTIME_DIR,
        RUNTIME_SUBAGENT_BRIEF_POLICY_DIR,
        RUNTIME_SUBAGENT_BRIEF_POLICY_FILE,
      );

      if (await exists(policyPath)) {
        const policy = await readJsonFile(policyPath);
        if (options.json) {
          process.stdout.write(toJson(policy));
        } else {
          process.stdout.write(`Subagent Brief Policy:\n${JSON.stringify(policy, null, 2)}\n`);
        }
      } else {
        process.stderr.write('No default-brief-policy.json found. Run hforge init first.\n');
      }
    });

  sub
    .command('brief <task>')
    .description('Generate and display a subagent brief for a task.')
    .option('--root <root>', 'workspace root', DEFAULT_WORKSPACE_ROOT)
    .option('--json', 'json output', false)
    .action(async (task: string, options) => {
      const root = path.resolve(options.root);
      // Placeholder: in full implementation, this would call SubagentBriefGenerator
      const brief = {
        briefId: `brief-${Date.now()}`,
        generatedAt: new Date().toISOString(),
        objective: task,
        scope: 'task-local',
        relevantDecisions: [],
        constraints: [],
        latestDelta: [],
        references: [],
        responseProfile: 'brief',
        budget: { maxInputTokens: 8000, maxOutputTokens: 2000 },
        estimatedTokens: 0,
        sourceStateType: 'compacted',
      };

      if (options.json) {
        process.stdout.write(toJson(brief));
      } else {
        process.stdout.write(`Subagent Brief for "${task}":\n${JSON.stringify(brief, null, 2)}\n`);
      }
    });

  sub
    .command('inspect-brief <task>')
    .description('Show details of an existing subagent brief.')
    .option('--root <root>', 'workspace root', DEFAULT_WORKSPACE_ROOT)
    .option('--json', 'json output', false)
    .action(async (task: string, options) => {
      // Placeholder: in full implementation, reads from .hforge/runtime/subagents/briefs/
      process.stdout.write(`No existing brief found for task "${task}". Use "subagents brief" to generate one.\n`);
    });
}
