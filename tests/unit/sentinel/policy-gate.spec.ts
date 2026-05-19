import { describe, expect, it } from "vitest";

import { decideAction } from "../../../src/application/sentinel/policy-gate/gate.js";
import { ActionPlanSchema, type ActionPlan } from "../../../src/domain/sentinel/action/action-plan.js";
import { builtInProfile } from "../../../src/domain/sentinel/policy/profile.js";
import {
  appendApprovalEntry,
  verifyApprovalChain,
} from "../../../src/infrastructure/sentinel/policy/approval-chain.js";
import { generateSentinelId } from "../../../src/shared/ulid.js";
import { nowISO } from "../../../src/shared/timestamps.js";

function makePlan(overrides: Partial<ActionPlan> = {}): ActionPlan {
  const now = nowISO();
  return ActionPlanSchema.parse({
    id: overrides.id ?? "act_gate",
    title: "Refresh runtime",
    reason: "drift",
    sourceSignalIds: ["sig_x"],
    proposedBy: "monitor",
    authorityRequired: "A2",
    status: "proposed",
    dryRun: false,
    risk: {
      level: "low",
      reasons: [],
      touchedTargets: [".hforge/**"],
      reversible: true,
      requiresHumanApproval: true,
    },
    steps: [{ type: "run_command", command: "hforge refresh --root . --dry-run" }],
    verification: { required: [{ type: "command", command: "hforge doctor" }] },
    createdAt: now,
    updatedAt: now,
    ...overrides,
  });
}

const cautious = builtInProfile("cautious");

describe("decideAction", () => {
  it("blocks when execution is disabled (US5 stub)", () => {
    const result = decideAction({
      action: makePlan(),
      profile: cautious,
      approvals: [],
      deniedPaths: [],
      deniedCommands: [],
      panicStop: false,
      executionEnabled: false,
    });
    expect(result.decision).toBe("block");
    expect(result.reasons.some((r) => r.includes("US5"))).toBe(true);
  });

  it("blocks when panicStop is on", () => {
    const result = decideAction({
      action: makePlan(),
      profile: cautious,
      approvals: [],
      deniedPaths: [],
      deniedCommands: [],
      panicStop: true,
      executionEnabled: true,
    });
    expect(result.decision).toBe("block");
    expect(result.reasons.some((r) => r.includes("panic_stop"))).toBe(true);
  });

  it("blocks when authority is missing and required by profile", () => {
    const result = decideAction({
      action: makePlan(),
      profile: cautious,
      approvals: [],
      deniedPaths: [],
      deniedCommands: [],
      panicStop: false,
      executionEnabled: true,
    });
    expect(result.decision).toBe("block");
    expect(result.reasons.some((r) => r.includes("approval missing or insufficient"))).toBe(true);
  });

  it("allows when an active matching approval exists and execution is enabled", () => {
    const action = makePlan();
    const approval = appendApprovalEntry([], {
      id: generateSentinelId("approval"),
      actionPlanId: action.id,
      approvedBy: "tester",
      approvedAt: nowISO(),
      authorityGranted: "A2",
      expiresAt: null,
      scope: [".hforge/**"],
      revokedAt: null,
    });
    verifyApprovalChain([approval]);
    const result = decideAction({
      action,
      profile: cautious,
      approvals: [approval],
      deniedPaths: [],
      deniedCommands: [],
      panicStop: false,
      executionEnabled: true,
    });
    expect(result.decision).toBe("allow");
    expect(result.grantedAuthority).toBe("A2");
    expect(result.approvalUsed?.id).toBe(approval.id);
  });

  it("blocks when the action's command matches a denied-command pattern", () => {
    const action = makePlan({
      steps: [{ type: "run_command", command: "git push --force origin main" }],
      authorityRequired: "A4",
    });
    const result = decideAction({
      action,
      profile: builtInProfile("maintainer"),
      approvals: [],
      deniedPaths: [],
      deniedCommands: ["git push --force"],
      panicStop: false,
      executionEnabled: true,
    });
    expect(result.decision).toBe("block");
    expect(result.reasons.some((r) => r.includes("denied pattern"))).toBe(true);
  });

  it("blocks when a touched target matches a denied path", () => {
    const action = makePlan({
      risk: {
        level: "low",
        reasons: [],
        touchedTargets: [".env"],
        reversible: true,
        requiresHumanApproval: true,
      },
    });
    const result = decideAction({
      action,
      profile: cautious,
      approvals: [],
      deniedPaths: [".env"],
      deniedCommands: [],
      panicStop: false,
      executionEnabled: true,
    });
    expect(result.decision).toBe("block");
    expect(result.reasons.some((r) => r.includes("denied path"))).toBe(true);
  });

  it("collapses authority-gap and profile-requires-approval into a single message when both fire", () => {
    const result = decideAction({
      action: makePlan(),
      profile: cautious,
      approvals: [],
      deniedPaths: [],
      deniedCommands: [],
      panicStop: false,
      executionEnabled: true,
    });
    const matching = result.reasons.filter(
      (r) => r.includes("granted authority") || r.includes("requires approval for authority"),
    );
    expect(matching).toHaveLength(1);
    expect(matching[0]).toContain("under profile");
  });

  it("blocks when an action carries an intent tag that the active profile denies", () => {
    const action = makePlan({
      intentTags: ["merge"],
      authorityRequired: "A4",
    });
    const approval = appendApprovalEntry([], {
      id: generateSentinelId("approval"),
      actionPlanId: action.id,
      approvedBy: "tester",
      approvedAt: nowISO(),
      authorityGranted: "A4",
      expiresAt: null,
      scope: [".hforge/**"],
      revokedAt: null,
    });
    const result = decideAction({
      action,
      profile: builtInProfile("maintainer"),
      approvals: [approval],
      deniedPaths: [],
      deniedCommands: [],
      panicStop: false,
      executionEnabled: true,
    });
    expect(result.decision).toBe("block");
    expect(result.reasons.some((r) => r.includes("denies intent 'merge'"))).toBe(true);
  });

  it("does NOT block on profile.deny entries that are not in the action's intentTags", () => {
    const action = makePlan({
      intentTags: ["refresh-harness-runtime"],
      authorityRequired: "A2",
      risk: {
        level: "low",
        reasons: [],
        touchedTargets: [".hforge/**"],
        reversible: true,
        requiresHumanApproval: false,
      },
    });
    const approval = appendApprovalEntry([], {
      id: generateSentinelId("approval"),
      actionPlanId: action.id,
      approvedBy: "tester",
      approvedAt: nowISO(),
      authorityGranted: "A2",
      expiresAt: null,
      scope: [".hforge/**"],
      revokedAt: null,
    });
    const result = decideAction({
      action,
      profile: cautious,
      approvals: [approval],
      deniedPaths: [],
      deniedCommands: [],
      panicStop: false,
      executionEnabled: true,
    });
    expect(result.decision).toBe("allow");
  });

  it("blocks when expired approval is the only one available", () => {
    const action = makePlan();
    const expired = appendApprovalEntry([], {
      id: generateSentinelId("approval"),
      actionPlanId: action.id,
      approvedBy: "tester",
      approvedAt: "2020-01-01T00:00:00.000Z",
      authorityGranted: "A2",
      expiresAt: "2020-01-01T01:00:00.000Z",
      scope: [".hforge/**"],
      revokedAt: null,
    });
    const result = decideAction({
      action,
      profile: cautious,
      approvals: [expired],
      deniedPaths: [],
      deniedCommands: [],
      panicStop: false,
      executionEnabled: true,
    });
    expect(result.decision).toBe("block");
  });
});
