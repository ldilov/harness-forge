import type { ActionPlan, ActionStep, AuthorityLevel } from "../../../domain/sentinel/action/action-plan.js";
import type { ApprovalEntry } from "../../../domain/sentinel/policy/approval.js";
import type { Profile } from "../../../domain/sentinel/policy/profile.js";
import { authorityAtLeast, authorityRank } from "../../../domain/sentinel/policy/authority-level.js";
import { isApprovalActive } from "../../../domain/sentinel/policy/approval.js";
import { requiresApproval } from "../../../domain/sentinel/policy/profile.js";
import { PathMatcher } from "../../../infrastructure/sentinel/policy/path-matcher.js";
import { CommandMatcher } from "../../../infrastructure/sentinel/policy/command-matcher.js";

export interface PolicyDecision {
  readonly decision: "allow" | "block";
  readonly reasons: readonly string[];
  readonly grantedAuthority: AuthorityLevel | null;
  readonly approvalUsed: ApprovalEntry | null;
}

export interface PolicyGateInputs {
  readonly action: ActionPlan;
  readonly profile: Profile;
  readonly approvals: readonly ApprovalEntry[];
  readonly deniedPaths: readonly string[];
  readonly deniedCommands: readonly string[];
  readonly panicStop: boolean;
  readonly executionEnabled: boolean;
  readonly now?: number;
}

function chooseApproval(action: ActionPlan, approvals: readonly ApprovalEntry[], now: number): ApprovalEntry | null {
  const candidates = approvals
    .filter((entry) => entry.actionPlanId === action.id)
    .filter((entry) => isApprovalActive(entry, now))
    .filter((entry) => authorityAtLeast(entry.authorityGranted, action.authorityRequired));
  if (candidates.length === 0) {
    return null;
  }
  return candidates.reduce((best, current) =>
    authorityRank(current.authorityGranted) >= authorityRank(best.authorityGranted) ? current : best,
  );
}

function commandsFromSteps(steps: readonly ActionStep[]): readonly string[] {
  const result: string[] = [];
  for (const step of steps) {
    if (step.type === "run_command") {
      result.push(step.command);
    }
  }
  return result;
}

function touchedTargets(action: ActionPlan): readonly string[] {
  if (action.risk.touchedTargets.length > 0) {
    return action.risk.touchedTargets;
  }
  const candidates: string[] = [];
  for (const step of action.steps) {
    if (step.type === "write_file") {
      candidates.push(step.path);
    }
  }
  return candidates;
}

export function decideAction(inputs: PolicyGateInputs): PolicyDecision {
  const now = inputs.now ?? Date.now();
  const reasons: string[] = [];
  if (!inputs.executionEnabled) {
    reasons.push("execution layer (US5 Safe Executor) not yet implemented; this action cannot run");
  }
  if (inputs.panicStop) {
    reasons.push("panic_stop is ON — all autonomy halted");
  }
  const approval = chooseApproval(inputs.action, inputs.approvals, now);
  const grantedAuthority = approval?.authorityGranted ?? inputs.profile.defaultLevel;
  const authorityGap = !authorityAtLeast(grantedAuthority, inputs.action.authorityRequired);
  const profileNeedsApproval =
    requiresApproval(inputs.profile, inputs.action.authorityRequired) && approval === null;
  if (authorityGap && profileNeedsApproval) {
    reasons.push(
      `requested authority ${inputs.action.authorityRequired} > granted authority ${grantedAuthority} under profile '${inputs.profile.name}'; approval missing or insufficient`,
    );
  } else if (authorityGap) {
    reasons.push(
      `requested authority ${inputs.action.authorityRequired} > granted authority ${grantedAuthority}; approval missing or insufficient`,
    );
  } else if (profileNeedsApproval) {
    reasons.push(
      `profile '${inputs.profile.name}' requires approval for authority ${inputs.action.authorityRequired}`,
    );
  }
  if (inputs.action.risk.requiresHumanApproval && approval === null) {
    reasons.push("risk assessment requires human approval");
  }
  const pathMatcher = new PathMatcher(inputs.deniedPaths);
  const targets = touchedTargets(inputs.action);
  for (const target of targets) {
    if (pathMatcher.matches(target)) {
      reasons.push(`touched target '${target}' matches a denied path`);
    }
  }
  const commandMatcher = new CommandMatcher(inputs.deniedCommands);
  for (const command of commandsFromSteps(inputs.action.steps)) {
    const match = commandMatcher.firstMatch(command);
    if (match !== null) {
      reasons.push(`step command '${command}' matches denied pattern '${match}'`);
    }
  }
  if (inputs.action.verification.required.length === 0) {
    reasons.push("action plan has empty verification.required");
  }
  if (
    inputs.action.risk.level !== "low" &&
    inputs.action.steps.some(
      (step) =>
        step.type === "write_file" || step.type === "apply_patch" || step.type === "create_worktree",
    ) &&
    inputs.action.rollback === undefined
  ) {
    reasons.push("medium+ risk plan with local mutations is missing a rollback spec");
  }
  for (const denyPattern of inputs.profile.deny) {
    if (inputs.action.intentTags.includes(denyPattern)) {
      reasons.push(`profile '${inputs.profile.name}' denies intent '${denyPattern}'`);
    }
  }
  if (reasons.length === 0) {
    return {
      decision: "allow",
      reasons: ["all policy checks passed"],
      grantedAuthority,
      approvalUsed: approval,
    };
  }
  return {
    decision: "block",
    reasons,
    grantedAuthority,
    approvalUsed: approval,
  };
}
