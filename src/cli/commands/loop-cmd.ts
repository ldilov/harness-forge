import { Command } from 'commander';
import path from 'node:path';

import { readTraces, readScores } from '../../application/loop/trace-store.js';
import { loadPatterns } from '../../application/loop/insight-store.js';
import { listTunings } from '../../application/loop/policy-tuner.js';
import { DEFAULT_WORKSPACE_ROOT } from '../../shared/index.js';
import { toJson } from '../../infrastructure/diagnostics/reporter.js';

export function registerLoopCommands(program: Command): void {
  program
    .command('loop')
    .description('Show Living Loop health summary')
    .option('--root <root>', 'workspace root', DEFAULT_WORKSPACE_ROOT)
    .option('--json', 'Output as JSON', false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);

      const [traces, scores, patterns, tunings] = await Promise.all([
        readTraces(workspaceRoot),
        readScores(workspaceRoot),
        loadPatterns(workspaceRoot),
        listTunings(workspaceRoot),
      ]);

      const avgScore = scores.length > 0
        ? scores.reduce((sum, s) => sum + s.score, 0) / scores.length
        : 0;

      const activeTunings = tunings.filter((t) => !t.rolledBack);
      const revertedTunings = tunings.filter((t) => t.rolledBack);

      const summary = {
        traces: {
          total: traces.length,
          completed: traces.filter((t) => t.outcome.taskCompleted).length,
        },
        scores: {
          total: scores.length,
          average: Math.round(avgScore * 100) / 100,
        },
        patterns: {
          total: patterns.length,
          actionable: patterns.filter((p) => p.confidence >= 0.7).length,
        },
        tunings: {
          total: tunings.length,
          active: activeTunings.length,
          reverted: revertedTunings.length,
        },
      };

      if (options.json) {
        console.log(toJson(summary));
        return;
      }

      console.log('Living Loop Health Summary');
      console.log('='.repeat(40));
      console.log('');
      console.log('  OBSERVE');
      console.log(`    Traces:        ${summary.traces.total} (${summary.traces.completed} completed)`);
      console.log('');
      console.log('  LEARN');
      console.log(`    Scores:        ${summary.scores.total} (avg: ${summary.scores.average})`);
      console.log(`    Patterns:      ${summary.patterns.total} (${summary.patterns.actionable} actionable)`);
      console.log('');
      console.log('  ADAPT');
      console.log(`    Tunings:       ${summary.tunings.total} (${summary.tunings.active} active, ${summary.tunings.reverted} reverted)`);
      console.log('');
    });
}
