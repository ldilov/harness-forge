import type { CliInvocationContext } from "./invocation-context.js";
import { resolveInvocationContext } from "./invocation-context.js";
import { runInteractiveOnboarding } from "./onboarding-flow.js";
import { runProjectHub } from "./project-hub.js";

export type DefaultInteractiveRoute = "onboarding" | "project-hub" | "none";

export async function chooseDefaultInteractiveRoute(context: CliInvocationContext): Promise<DefaultInteractiveRoute> {
  if (context.argv.length > 0) {
    return "none";
  }
  if (!context.terminalProfile.supportsInteractiveInput && process.env.HFORGE_FORCE_TTY !== "1") {
    return "none";
  }
  if (context.detectedRuntimeState === "present" || context.detectedRuntimeState === "partial") {
    return "project-hub";
  }
  return "onboarding";
}

export async function runDefaultInteractiveEntry(argv: string[], cwd: string): Promise<boolean> {
  const context = await resolveInvocationContext(argv, cwd);
  const route = await chooseDefaultInteractiveRoute(context);
  if (route === "none") {
    return false;
  }

  if (route === "project-hub") {
    const result = await runProjectHub(context.detectedWorkspaceRoot);
    console.log(result.operatorMessage);
    return true;
  }

  await runInteractiveOnboarding(context.detectedWorkspaceRoot);
  return true;
}
