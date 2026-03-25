import path from "node:path";
import { Command } from "commander";

import { loadFlowState } from "../../application/flow/load-flow-state.js";
import { saveFlowState } from "../../application/flow/save-flow-state.js";
import { appendEffectivenessSignal } from "../../infrastructure/observability/local-metrics-store.js";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";

export function registerFlowCommands(program: Command): void {
  const flow = program.command("flow");

  flow
    .command("status")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options) => {
      const workspaceRoot = path.resolve(options.root);
      const state = await loadFlowState(workspaceRoot);
      await saveFlowState(workspaceRoot, state);
      await appendEffectivenessSignal(workspaceRoot, {
        signalType: "flow-status",
        subjectId: state.featureId,
        result: state.status === "complete" ? "success" : state.status === "blocked" ? "failed" : "accepted",
        recordedAt: new Date().toISOString(),
        details: { stage: state.currentStage }
      });

      console.log(options.json ? toJson(state) : JSON.stringify(state, null, 2));
    });
}
