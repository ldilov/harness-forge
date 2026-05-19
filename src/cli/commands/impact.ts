import { Command } from "commander";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import { simulateImpact } from "../../application/cartographer/simulate-impact.js";
import { HarnessDecisionProvider } from "../../application/cartographer/decision-provider.js";
import { ImpactStore } from "../../infrastructure/cartographer/impact-store.js";

interface ImpactOptions {
  readonly root: string;
  readonly files?: string;
  readonly changed?: boolean;
  readonly diff?: string;
  readonly goal?: string;
  readonly json?: boolean;
}

function splitList(value: string | undefined): string[] {
  return (value ?? "")
    .split(",")
    .map((entry) => entry.trim())
    .filter((entry) => entry.length > 0);
}

export function registerImpactCommands(program: Command): void {
  const impact = program
    .command("impact")
    .description("Cartographer+ change impact simulator")
    .argument("[target]", "file or directory to analyze")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--files <list>", "comma-separated files to analyze")
    .option("--changed", "analyze git working-tree changes")
    .option("--diff <path>", "analyze a unified diff file")
    .option("--goal <goal>", "analyze files a goal would likely touch")
    .option("--json", "machine-readable output")
    .action(async (target: string | undefined, options: ImpactOptions) => {
      const files = splitList(options.files);
      if (target !== undefined && target.length > 0) {
        files.push(target.replace(/\\/g, "/"));
      }
      try {
        const { report } = await simulateImpact({
          workspaceRoot: options.root,
          files: files.length > 0 ? files : undefined,
          changedOnly: options.changed === true,
          diffPath: options.diff,
          goal: options.goal,
          decisionProvider: new HarnessDecisionProvider(options.root),
        });
        await new ImpactStore(options.root).write(report);
        if (options.json === true) {
          process.stdout.write(toJson(report) + "\n");
          return;
        }
        process.stdout.write(
          `Impact ${report.id}: risk ${report.risk}, ${report.impactedFiles.length} impacted file(s), ` +
            `${report.recommendedCommands.length} recommended command(s).\n${report.explanation}\n`,
        );
      } catch (error: unknown) {
        const message = error instanceof Error ? error.message : String(error);
        process.stdout.write(
          options.json === true ? toJson({ status: "error", message }) + "\n" : `${message}\n`,
        );
        process.exitCode = 4;
      }
    });

  impact
    .command("show <impactId>")
    .description("Show a stored impact report")
    .option("--root <path>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "machine-readable output")
    .action(async (impactId: string, options: { root: string; json?: boolean }) => {
      const report = await new ImpactStore(options.root).read(impactId);
      if (report === null) {
        process.stdout.write(
          options.json === true ? toJson({ status: "not-found", impactId }) + "\n" : `Not found: ${impactId}\n`,
        );
        process.exitCode = 1;
        return;
      }
      process.stdout.write(
        options.json === true ? toJson(report) + "\n" : `${report.id}: risk ${report.risk}\n`,
      );
    });
}
