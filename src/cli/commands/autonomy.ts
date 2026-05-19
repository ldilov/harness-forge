import path from "node:path";
import { Command } from "commander";
import { stringify as stringifyYaml, parse as parseYaml } from "yaml";
import { DEFAULT_WORKSPACE_ROOT } from "../../shared/index.js";
import { toJson } from "../../infrastructure/diagnostics/reporter.js";
import { loadBudgetSnapshot } from "../../application/sentinel/budget/budget-ledger.js";
import { ActionStore } from "../../infrastructure/sentinel/stores/action-store.js";
import { ApprovalStore } from "../../infrastructure/sentinel/stores/approval-store.js";
import { ActiveProfileStore } from "../../infrastructure/sentinel/stores/profile-store.js";
import { CadenceLedger } from "../../application/sentinel/budget/cadence-ledger.js";
import {
  builtInProfile,
  ProfileNameSchema,
  type ProfileName,
} from "../../domain/sentinel/policy/profile.js";
import {
  AuthorityLevelSchema,
  type AuthorityLevel,
} from "../../domain/sentinel/action/action-plan.js";
import { decideAction } from "../../application/sentinel/policy-gate/gate.js";
import {
  loadDeniedCommands,
  loadDeniedPaths,
} from "../../application/sentinel/policy-gate/policy-loader.js";
import { ensureDir, exists, readTextFile, writeTextFile } from "../../shared/fs.js";
import { sentinelCadencePath } from "../../domain/sentinel/paths.js";
import { nowISO } from "../../shared/timestamps.js";

interface AutonomyOptions {
  readonly root: string;
  readonly json?: boolean;
}

const EXECUTION_ENABLED = true;
const EXECUTION_DISABLED_REASON = "execution disabled by build flag";

export function registerAutonomyCommands(program: Command): void {
  const autonomy = program.command("autonomy").description("Sentinel autonomy posture");

  autonomy
    .command("status")
    .description("Show current autonomy profile, budget usage, and panic state")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options: AutonomyOptions) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const snapshot = await loadBudgetSnapshot(workspaceRoot);
      const ledger = new CadenceLedger(workspaceRoot);
      const profile = await new ActiveProfileStore(workspaceRoot).read();
      const usedRunsThisHour = await ledger.countSince("monitor.run", 60 * 60 * 1000);
      const usedActionsThisHour = await ledger.countSince("action.proposed", 60 * 60 * 1000);
      const status = {
        profile: profile.name,
        defaultLevel: profile.defaultLevel,
        selectedAt: profile.selectedAt,
        selectedBy: profile.selectedBy,
        panicStop: snapshot.cadence.panicStop,
        budget: snapshot.budget,
        cadence: snapshot.cadence,
        usage: {
          monitorRunsLastHour: usedRunsThisHour,
          actionsProposedLastHour: usedActionsThisHour,
        },
        executionEnabled: EXECUTION_ENABLED,
        executionDisabledReason: EXECUTION_ENABLED ? null : EXECUTION_DISABLED_REASON,
      };
      if (options.json) {
        console.log(toJson(status));
        return;
      }
      console.log(`Profile: ${profile.name} (default authority ${profile.defaultLevel})`);
      console.log(`Panic stop: ${snapshot.cadence.panicStop ? "ON" : "off"}`);
      console.log(
        `Budget: ${snapshot.budget.llmTokens.dailyBudget} LLM tokens/day, ${snapshot.cadence.maxActionsPerHour} actions/hour, ${snapshot.cadence.maxMonitorRunsPerHour} monitor runs/hour`,
      );
      console.log(
        `Usage (last hour): ${usedRunsThisHour} monitor runs, ${usedActionsThisHour} actions proposed`,
      );
      console.log(
        `Execution: ${EXECUTION_ENABLED ? "enabled" : `disabled (${EXECUTION_DISABLED_REASON})`}`,
      );
    });

  autonomy
    .command("policy")
    .description("Print the merged autonomy + cadence + budget policy")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (options: AutonomyOptions) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const snapshot = await loadBudgetSnapshot(workspaceRoot);
      const profile = await new ActiveProfileStore(workspaceRoot).read();
      const builtIn = builtInProfile(profile.name);
      const deniedPaths = await loadDeniedPaths(workspaceRoot);
      const deniedCommands = await loadDeniedCommands(workspaceRoot);
      const merged = {
        profile: builtIn,
        active: profile,
        budget: snapshot.budget,
        cadence: snapshot.cadence,
        deniedPaths,
        deniedCommands,
        sources: snapshot.source,
      };
      if (options.json) {
        console.log(toJson(merged));
        return;
      }
      console.log(`Profile: ${builtIn.name}`);
      console.log(`  defaultLevel: ${builtIn.defaultLevel}`);
      console.log(`  requireApproval: ${builtIn.requireApproval.join(", ")}`);
      console.log(`  deny: ${builtIn.deny.join(", ")}`);
      console.log(`Denied paths: ${deniedPaths.length} pattern(s)`);
      console.log(`Denied commands: ${deniedCommands.length} pattern(s)`);
      console.log("Cadence:");
      console.log(`  globalMinIntervalSeconds: ${snapshot.cadence.globalMinIntervalSeconds}`);
      console.log(`  maxMonitorRunsPerHour: ${snapshot.cadence.maxMonitorRunsPerHour}`);
      console.log(`  maxActionsPerHour: ${snapshot.cadence.maxActionsPerHour}`);
      console.log(`  panicStop: ${snapshot.cadence.panicStop}`);
      console.log("Budget:");
      console.log(`  llmTokens.dailyBudget: ${snapshot.budget.llmTokens.dailyBudget}`);
    });

  autonomy
    .command("set-profile <name>")
    .description("Switch the active autonomy profile")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .action(async (name: string, options: AutonomyOptions) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const parsed = ProfileNameSchema.safeParse(name);
      if (!parsed.success) {
        console.error(`Unknown profile '${name}'. Use one of: observe, cautious, assisted, active, maintainer.`);
        process.exitCode = 1;
        return;
      }
      const builtIn = builtInProfile(parsed.data as ProfileName);
      const store = new ActiveProfileStore(workspaceRoot);
      await store.write({
        name: builtIn.name,
        defaultLevel: builtIn.defaultLevel,
        selectedAt: nowISO(),
        selectedBy: process.env.USER ?? process.env.USERNAME ?? "operator",
      });
      console.log(
        `Active profile is now '${builtIn.name}' (default authority ${builtIn.defaultLevel}).`,
      );
    });

  autonomy
    .command("set-level <level>")
    .description("Override the active profile's default authority level for this workspace")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .action(async (level: string, options: AutonomyOptions) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const parsed = AuthorityLevelSchema.safeParse(level);
      if (!parsed.success) {
        console.error(`Invalid authority level '${level}'. Use A0..A5.`);
        process.exitCode = 1;
        return;
      }
      const store = new ActiveProfileStore(workspaceRoot);
      const current = await store.read();
      const profile = builtInProfile(current.name);
      const requested = parsed.data as AuthorityLevel;
      await store.write({
        ...current,
        defaultLevel: requested,
        selectedAt: nowISO(),
        selectedBy: process.env.USER ?? process.env.USERNAME ?? "operator",
      });
      console.log(`Default authority for profile '${current.name}' is now ${requested}.`);
      if (profile.requireApproval.includes(requested)) {
        console.log(
          `Note: profile '${current.name}' still requires explicit approval for ${requested}; set-level only changes the no-approval baseline.`,
        );
      }
    });

  autonomy
    .command("panic-stop [state]")
    .description("Toggle or read the panicStop flag in cadence.yaml (state: on|off)")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .action(async (state: string | undefined, options: AutonomyOptions) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      if (state === undefined) {
        const snapshot = await loadBudgetSnapshot(workspaceRoot);
        console.log(`panic-stop is ${snapshot.cadence.panicStop ? "ON" : "off"}`);
        return;
      }
      const normalized = state.toLowerCase();
      if (normalized !== "on" && normalized !== "off") {
        console.error("Pass 'on' or 'off'.");
        process.exitCode = 1;
        return;
      }
      const filePath = sentinelCadencePath(workspaceRoot);
      let parsed: Record<string, unknown> = {};
      if (await exists(filePath)) {
        parsed = (parseYaml(await readTextFile(filePath)) ?? {}) as Record<string, unknown>;
      }
      parsed.panicStop = normalized === "on";
      await ensureDir(path.dirname(filePath));
      await writeTextFile(filePath, stringifyYaml(parsed));
      console.log(`panic-stop set to ${normalized.toUpperCase()}`);
    });

  autonomy
    .command("explain <action-id>")
    .description("Explain why an action would be allowed or blocked under current policy")
    .option("--root <root>", "workspace root", DEFAULT_WORKSPACE_ROOT)
    .option("--json", "json output", false)
    .action(async (actionId: string, options: AutonomyOptions) => {
      const workspaceRoot = path.resolve(options.root ?? DEFAULT_WORKSPACE_ROOT);
      const store = new ActionStore(workspaceRoot);
      const plan = await store.findById(actionId);
      if (plan === null) {
        console.error(`Action '${actionId}' not found.`);
        process.exitCode = 1;
        return;
      }
      const snapshot = await loadBudgetSnapshot(workspaceRoot);
      const active = await new ActiveProfileStore(workspaceRoot).read();
      const profile = builtInProfile(active.name);
      const approvals = await new ApprovalStore(workspaceRoot).forAction(plan.id);
      const deniedPaths = await loadDeniedPaths(workspaceRoot);
      const deniedCommands = await loadDeniedCommands(workspaceRoot);
      const decision = decideAction({
        action: plan,
        profile: { ...profile, defaultLevel: active.defaultLevel },
        approvals,
        deniedPaths,
        deniedCommands,
        panicStop: snapshot.cadence.panicStop,
        executionEnabled: EXECUTION_ENABLED,
      });
      if (options.json) {
        console.log(toJson({ actionId, decision, plan }));
        return;
      }
      console.log(`Decision for ${actionId}: ${decision.decision.toUpperCase()}`);
      console.log(`  granted authority: ${decision.grantedAuthority ?? "n/a"}`);
      if (decision.approvalUsed !== null) {
        console.log(`  approval: ${decision.approvalUsed.id} (granted ${decision.approvalUsed.authorityGranted})`);
      }
      for (const reason of decision.reasons) {
        console.log(`  - ${reason}`);
      }
    });
}
