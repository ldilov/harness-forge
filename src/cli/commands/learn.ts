import path from "node:path";
import { Command } from "commander";

import { extractPatterns } from "../../application/loop/pattern-extractor.js";
import { savePatterns, getRecommendations, getActionableInsights } from "../../application/loop/insight-store.js";
import { readTraces, readScores } from "../../application/loop/trace-store.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

function confidenceBar(confidence: number): string {
  const filled = Math.round(confidence * 10);
  const empty = 10 - filled;
  return "[" + "#".repeat(filled) + "-".repeat(empty) + "]";
}

export function registerLearnCommands(program: Command): void {
  program
    .command("learn")
    .description("Extract patterns from session history")
    .option("--root <root>", "workspace root", process.cwd())
    .option("--json", "Output as JSON", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);

      try {
        const patterns = await extractPatterns(workspaceRoot);
        await savePatterns(workspaceRoot, patterns);

        if (options.json) {
          console.log(toJson({ count: patterns.length, patterns }));
          return;
        }

        if (patterns.length === 0) {
          console.log("No patterns extracted. Run some sessions first, then try again.");
          return;
        }

        console.log(`Extracted ${patterns.length} pattern(s):\n`);
        for (const p of patterns) {
          console.log(`  ${confidenceBar(p.confidence)} ${p.confidence.toFixed(2)}  [${p.type}] ${p.finding}`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Pattern extraction failed: ${message}`);
        process.exitCode = 1;
      }
    });

  program
    .command("insights")
    .description("Browse discovered patterns and recommendations")
    .option("--root <root>", "workspace root", process.cwd())
    .option("--actionable", "Show only actionable (confidence >= 0.7)", false)
    .option("--json", "Output as JSON", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);

      try {
        const patterns = options.actionable
          ? await getActionableInsights(workspaceRoot)
          : await getRecommendations(workspaceRoot);

        if (options.json) {
          console.log(toJson(patterns));
          return;
        }

        if (patterns.length === 0) {
          console.log("No insights found. Run \"hforge learn\" to extract patterns first.");
          return;
        }

        console.log(`${patterns.length} insight(s):\n`);
        for (const p of patterns) {
          console.log(`  ${confidenceBar(p.confidence)} ${p.confidence.toFixed(2)}  [${p.type}] ${p.finding}`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to load insights: ${message}`);
        process.exitCode = 1;
      }
    });

  program
    .command("score")
    .description("Show recent session effectiveness scores")
    .option("--root <root>", "workspace root", process.cwd())
    .option("--limit <n>", "Number of scores to show", "10")
    .option("--json", "Output as JSON", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const limit = parseInt(options.limit as string, 10);

      if (Number.isNaN(limit) || limit < 1) {
        console.error("--limit must be a positive integer.");
        process.exitCode = 1;
        return;
      }

      try {
        const scores = await readScores(workspaceRoot, { limit });

        if (options.json) {
          console.log(toJson(scores));
          return;
        }

        if (scores.length === 0) {
          console.log("No scores recorded yet.");
          return;
        }

        console.log("Session scores (most recent first):\n");
        console.log("  Session                Score  Date");
        console.log("  " + "-".repeat(55));
        for (const s of scores) {
          const shortId = s.sessionId.slice(0, 20).padEnd(20);
          const date = s.scoredAt.slice(0, 10);
          console.log(`  ${shortId}  ${s.score.toFixed(2).padStart(5)}  ${date}`);
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to read scores: ${message}`);
        process.exitCode = 1;
      }
    });

  program
    .command("trace")
    .description("View recent session traces")
    .option("--root <root>", "workspace root", process.cwd())
    .option("--limit <n>", "Number of traces to show", "5")
    .option("--json", "Output as JSON", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const limit = parseInt(options.limit as string, 10);

      if (Number.isNaN(limit) || limit < 1) {
        console.error("--limit must be a positive integer.");
        process.exitCode = 1;
        return;
      }

      try {
        const traces = await readTraces(workspaceRoot, { limit });

        if (options.json) {
          console.log(toJson(traces));
          return;
        }

        if (traces.length === 0) {
          console.log("No traces recorded yet.");
          return;
        }

        console.log("Session traces (most recent first):\n");
        for (const t of traces) {
          const durationSec = t.durationSeconds.toFixed(1);
          console.log(`  Session:     ${t.sessionId}`);
          console.log(`  Started:     ${t.startedAt}`);
          console.log(`  Duration:    ${durationSec}s`);
          console.log(`  Tokens:      ${t.metrics.tokensUsed}`);
          console.log(`  Compactions: ${t.metrics.compactionsTriggered}`);
          console.log("");
        }
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : "Unknown error";
        console.error(`Failed to read traces: ${message}`);
        process.exitCode = 1;
      }
    });
}
