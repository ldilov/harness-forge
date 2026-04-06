import { Command } from 'commander';
import path from 'node:path';

import { listTunings, revertTuning, unlockParameter } from '../../application/loop/policy-tuner.js';
import { TunableParameter } from '../../domain/loop/tuning-record.js';
import { DEFAULT_WORKSPACE_ROOT } from '../../shared/index.js';
import { toJson } from '../../infrastructure/diagnostics/reporter.js';

export function registerAdaptCommands(program: Command): void {
  program
    .command('adapt')
    .description('Show and manage policy auto-tunings')
    .option('--root <root>', 'workspace root', DEFAULT_WORKSPACE_ROOT)
    .option('--revert <id>', 'Revert a specific tuning')
    .option('--unlock <param>', 'Allow tuner to modify a user-set parameter')
    .option('--json', 'Output as JSON', false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);

      if (options.revert) {
        const reverted = await revertTuning(workspaceRoot, options.revert);
        if (!reverted) {
          console.log(`Tuning ${options.revert} not found or already reverted.`);
          process.exitCode = 1;
          return;
        }
        if (options.json) {
          console.log(toJson(reverted));
        } else {
          console.log(`Reverted tuning ${reverted.id} (${reverted.parameter}): restored previous value.`);
        }
        return;
      }

      if (options.unlock) {
        const parseResult = TunableParameter.safeParse(options.unlock);
        if (!parseResult.success) {
          console.log(`Unknown parameter: ${options.unlock}`);
          console.log(`Valid parameters: ${TunableParameter.options.join(', ')}`);
          process.exitCode = 1;
          return;
        }
        await unlockParameter(workspaceRoot, parseResult.data);
        console.log(`Unlocked parameter: ${parseResult.data}`);
        return;
      }

      // Default: list tunings
      const tunings = await listTunings(workspaceRoot);

      if (options.json) {
        console.log(toJson(tunings));
        return;
      }

      if (tunings.length === 0) {
        console.log('No tunings applied yet. Run the Living Loop pipeline to generate insights and auto-tune.');
        return;
      }

      console.log(`Policy Auto-Tunings (${tunings.length}):\n`);
      for (const t of tunings) {
        const status = t.rolledBack ? ' [REVERTED]' : '';
        console.log(`  ${t.id}${status}`);
        console.log(`    Parameter:  ${t.parameter}`);
        console.log(`    Previous:   ${JSON.stringify(t.previousValue)}`);
        console.log(`    New:        ${JSON.stringify(t.newValue)}`);
        console.log(`    Pattern:    ${t.triggeringPatternId}`);
        console.log(`    Applied at: ${t.appliedAt}`);
        if (t.rolledBackAt) {
          console.log(`    Rolled back: ${t.rolledBackAt}`);
        }
        console.log('');
      }
    });
}
