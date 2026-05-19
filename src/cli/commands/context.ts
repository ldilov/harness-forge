import { Command } from "commander";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import { compileContext } from "../../application/cartographer/compile-context.js";
import { HarnessDecisionProvider } from "../../application/cartographer/decision-provider.js";
import { BundleStore } from "../../infrastructure/cartographer/bundle-store.js";
import type { ContextBudget } from "../../domain/cartographer/context/context-bundle.js";

interface CompileOptions {
  readonly root: string;
  readonly goal?: string;
  readonly files?: string;
  readonly budget?: string;
  readonly json?: boolean;
}

function normalizeBudget(value: string | undefined): ContextBudget {
  if (value === "small" || value === "large" || value === "medium") {
    return value;
  }
  if (value !== undefined && value.length > 0) {
    process.stderr.write(`warning: unknown budget '${value}', defaulting to medium\n`);
  }
  return "medium";
}

async function runCompile(goal: string, options: CompileOptions): Promise<void> {
  const seedFiles = (options.files ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
  try {
    const { bundle } = await compileContext({
      workspaceRoot: options.root,
      goal,
      seedFiles,
      budget: normalizeBudget(options.budget),
      decisionProvider: new HarnessDecisionProvider(options.root),
    });
    await new BundleStore(options.root).write(bundle);
    if (options.json === true) {
      process.stdout.write(toJson(bundle) + "\n");
      return;
    }
    process.stdout.write(
      `Bundle ${bundle.id}: ${bundle.relevantFiles.length} files, ${bundle.relevantDecisions.length} decisions, ` +
        `${bundle.recommendedCommands.length} commands${bundle.contextTruncated ? " (truncated)" : ""}.\n`,
    );
  } catch (error: unknown) {
    process.stdout.write(
      options.json === true
        ? toJson({ status: "error", message: error instanceof Error ? error.message : String(error) }) + "\n"
        : `${error instanceof Error ? error.message : String(error)}\n`,
    );
    process.exitCode = 4;
  }
}

export function registerContextCommands(program: Command): void {
  const context = program.command("context").description("Cartographer+ task context compiler");

  context
    .command("compile")
    .description("Compile a task context bundle from a goal")
    .requiredOption("--goal <goal>", "the task goal")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--files <list>", "comma-separated seed files")
    .option("--budget <size>", "small|medium|large", "medium")
    .option("--json", "machine-readable output")
    .action(async (options: CompileOptions) => {
      await runCompile(options.goal ?? "", options);
    });

  context
    .command("show <bundleId>")
    .description("Show a stored context bundle")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "machine-readable output")
    .action(async (bundleId: string, options: { root: string; json?: boolean }) => {
      const bundle = await new BundleStore(options.root).read(bundleId);
      if (bundle === null) {
        process.stdout.write(
          options.json === true ? toJson({ status: "not-found", bundleId }) + "\n" : `Not found: ${bundleId}\n`,
        );
        process.exitCode = 1;
        return;
      }
      process.stdout.write(
        options.json === true ? toJson(bundle) + "\n" : `${bundle.id}: ${bundle.goal}\n`,
      );
    });

  context
    .command("list")
    .description("List stored context bundles")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "machine-readable output")
    .action(async (options: { root: string; json?: boolean }) => {
      const ids = await new BundleStore(options.root).list();
      process.stdout.write(
        options.json === true ? toJson({ bundles: ids }) + "\n" : `${ids.length} bundle(s): ${ids.join(", ")}\n`,
      );
    });

  context
    .command("delete <bundleId>")
    .description("Delete a stored context bundle")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "machine-readable output")
    .action(async (bundleId: string, options: { root: string; json?: boolean }) => {
      const removed = await new BundleStore(options.root).delete(bundleId);
      process.stdout.write(
        options.json === true
          ? toJson({ deleted: removed, bundleId }) + "\n"
          : removed
            ? `Deleted ${bundleId}.\n`
            : `Not found: ${bundleId}\n`,
      );
      if (!removed) {
        process.exitCode = 1;
      }
    });
}
