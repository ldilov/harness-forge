import path from "node:path";
import { Command } from "commander";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import {
  explainImpact,
  explainContext,
  explainDiff,
  prNarrative,
  prChecklist,
} from "../../application/cartographer/explain.js";
import { ExplanationStore } from "../../infrastructure/cartographer/explanation-store.js";
import {
  renderExplanationMarkdown,
  parseExplanation,
  type Explanation,
} from "../../domain/cartographer/explain/explanation.js";

interface BaseOptions {
  readonly root: string;
  readonly json?: boolean;
}

async function emit(
  explanationOrNull: Explanation | null,
  workspaceRoot: string,
  json: boolean,
  notFound: string,
): Promise<void> {
  if (explanationOrNull === null) {
    process.stdout.write(
      json ? toJson({ status: "not-found", subject: notFound }) + "\n" : `Not found: ${notFound}\n`,
    );
    process.exitCode = 1;
    return;
  }
  await new ExplanationStore(workspaceRoot).write(explanationOrNull);
  process.stdout.write(
    json ? toJson(explanationOrNull) + "\n" : renderExplanationMarkdown(explanationOrNull),
  );
}

export function registerExplainCommands(program: Command): void {
  const explain = program.command("explain").description("Cartographer+ human explanations");

  explain
    .command("impact <impactId>")
    .description("Explain why files are affected in a stored impact report")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "machine-readable output")
    .action(async (impactId: string, options: BaseOptions) => {
      const root = path.resolve(options.root);
      await emit(await explainImpact(root, impactId), root, options.json === true, impactId);
    });

  explain
    .command("context <bundleId>")
    .description("Explain why a context bundle selected what it did")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "machine-readable output")
    .action(async (bundleId: string, options: BaseOptions) => {
      const root = path.resolve(options.root);
      await emit(await explainContext(root, bundleId), root, options.json === true, bundleId);
    });

  explain
    .command("diff")
    .description("Explain what the current working-tree changes touch")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--changed", "analyze git working-tree changes (default)")
    .option("--json", "machine-readable output")
    .action(async (options: BaseOptions) => {
      const root = path.resolve(options.root);
      try {
        await emit(await explainDiff(root), root, options.json === true, "diff");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        process.stdout.write(options.json === true ? toJson({ status: "error", message }) + "\n" : `${message}\n`);
        process.exitCode = 4;
      }
    });
}

export function registerPrCommands(program: Command): void {
  const pr = program.command("pr").description("Cartographer+ PR narrative and checklist");

  pr
    .command("narrative")
    .description("Generate a PR narrative from working-tree impact")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--changed", "analyze git working-tree changes (default)")
    .option("--draft", "label the narrative as a draft")
    .option("--json", "machine-readable output")
    .action(async (options: BaseOptions & { draft?: boolean }) => {
      const root = path.resolve(options.root);
      try {
        const narrative = await prNarrative(root);
        const finalized =
          options.draft === true
            ? parseExplanation({ ...narrative, subject: `${narrative.subject} (draft)` })
            : narrative;
        await emit(finalized, root, options.json === true, "pr-narrative");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        process.stdout.write(options.json === true ? toJson({ status: "error", message }) + "\n" : `${message}\n`);
        process.exitCode = 4;
      }
    });

  pr
    .command("checklist")
    .description("Generate a PR verification checklist from working-tree impact")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--changed", "analyze git working-tree changes (default)")
    .option("--json", "machine-readable output")
    .action(async (options: BaseOptions) => {
      const root = path.resolve(options.root);
      try {
        await emit(await prChecklist(root), root, options.json === true, "pr-checklist");
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        process.stdout.write(options.json === true ? toJson({ status: "error", message }) + "\n" : `${message}\n`);
        process.exitCode = 4;
      }
    });
}
