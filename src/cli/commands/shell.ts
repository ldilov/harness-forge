import { Command } from "commander";
import readline from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

import { setupShellIntegration, getShellIntegrationStatus } from "../../application/install/shell-integration.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

async function confirmSetup(): Promise<boolean> {
  const rl = readline.createInterface({ input, output });
  try {
    const answer = (await rl.question("Apply shell integration changes now? [y/N] ")).trim().toLowerCase();
    return answer === "y" || answer === "yes";
  } finally {
    rl.close();
  }
}

function printSetupSummary(result: Awaited<ReturnType<typeof setupShellIntegration>>): void {
  console.log(`Shell: ${result.shellLabel}`);
  console.log(`Shim directory: ${result.shimDir}`);
  console.log(`Profile target: ${result.profilePath ?? "manual setup required"}`);
  console.log(`Bare hforge available: ${result.bareHforgeResolvable ? "yes" : "no"}`);
  if (result.changedFiles.length > 0) {
    console.log(`Changed files: ${result.changedFiles.join(", ")}`);
  }
  if (result.profileBlockPreview) {
    console.log("Profile block preview:");
    console.log(result.profileBlockPreview);
  }
  if (result.requiresManualPathStep) {
    console.log("Manual PATH commands:");
    for (const command of result.manualCommands) {
      console.log(`- ${command}`);
    }
  } else if (result.nextSteps.length > 0) {
    console.log(`Next: ${result.nextSteps.join(" | ")}`);
  }
}

function printStatusSummary(result: Awaited<ReturnType<typeof getShellIntegrationStatus>>): void {
  console.log(`Shell: ${result.shellLabel}`);
  console.log(`Shim directory: ${result.shimDir}`);
  console.log(`Shim files present: ${result.shimExists ? "yes" : "no"}`);
  console.log(`Profile target: ${result.profilePath ?? "manual setup required"}`);
  console.log(`Managed profile block: ${result.profileManagedBlockPresent ? "present" : "missing"}`);
  console.log(`Bare hforge available: ${result.bareHforgeResolvable ? "yes" : "no"}`);
  if (result.resolvedCommandPath) {
    console.log(`Resolved command: ${result.resolvedCommandPath}`);
  }
  if (result.manualCommands.length > 0 && result.shell === "unsupported") {
    console.log("Manual PATH commands:");
    for (const command of result.manualCommands) {
      console.log(`- ${command}`);
    }
  }
}

export function registerShellCommands(program: Command): void {
  const shell = program.command("shell").description("Manage optional PATH integration for bare hforge.");

  shell
    .command("setup")
    .option("--yes", "apply shell integration without prompting", false)
    .option("--json", "json output", false)
    .action(async (options) => {
      let applyChanges = Boolean(options.yes);
      if (!applyChanges && process.stdin.isTTY && !options.json) {
        applyChanges = await confirmSetup();
      }

      const result = await setupShellIntegration(applyChanges);
      if (options.json) {
        console.log(toJson(result));
        if (!applyChanges) {
          process.exitCode = 1;
        }
        return;
      }

      printSetupSummary(result);
      if (!applyChanges) {
        console.log('Preview only. Re-run with "--yes" to apply shell integration.');
        process.exitCode = 1;
      }
    });

  shell
    .command("status")
    .option("--json", "json output", false)
    .action(async (options) => {
      const result = await getShellIntegrationStatus();
      if (options.json) {
        console.log(toJson(result));
        return;
      }

      printStatusSummary(result);
    });
}
