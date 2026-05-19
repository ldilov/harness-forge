import { describe, expect, it } from "vitest";
import { ZodError } from "zod";

import { ActionPlanSchema } from "../../../src/domain/sentinel/action/action-plan.js";

const baseValid = {
  id: "act_test",
  title: "Refresh runtime",
  reason: "drift",
  sourceSignalIds: ["sig_x"],
  proposedBy: "monitor" as const,
  authorityRequired: "A2" as const,
  status: "proposed" as const,
  dryRun: false,
  risk: {
    level: "low" as const,
    reasons: [],
    touchedTargets: [],
    reversible: true,
    requiresHumanApproval: true,
  },
  steps: [{ type: "run_command" as const, command: "hforge refresh" }],
  verification: {
    required: [{ type: "command" as const, command: "hforge doctor" }],
  },
  createdAt: "2026-05-05T00:00:00.000Z",
  updatedAt: "2026-05-05T00:00:00.000Z",
};

describe("ActionPlanSchema", () => {
  it("accepts a minimal valid plan", () => {
    expect(() => ActionPlanSchema.parse(baseValid)).not.toThrow();
  });

  it("rejects when sourceSignalIds is empty", () => {
    expect(() => ActionPlanSchema.parse({ ...baseValid, sourceSignalIds: [] })).toThrow(ZodError);
  });

  it("rejects when verification.required is empty", () => {
    expect(() =>
      ActionPlanSchema.parse({ ...baseValid, verification: { required: [] } }),
    ).toThrow(ZodError);
  });

  it("requires rollback for medium+ risk plans with local mutations", () => {
    const plan = {
      ...baseValid,
      risk: { ...baseValid.risk, level: "medium" as const },
      steps: [{ type: "write_file" as const, path: "x.txt", contentRef: "c" }],
    };
    expect(() => ActionPlanSchema.parse(plan)).toThrow(/rollback spec required/);
  });

  it("does not require rollback for low risk plans", () => {
    const plan = {
      ...baseValid,
      steps: [{ type: "write_file" as const, path: "x.txt", contentRef: "c" }],
    };
    expect(() => ActionPlanSchema.parse(plan)).not.toThrow();
  });

  it("rejects manual rollback without notes", () => {
    const plan = {
      ...baseValid,
      risk: { ...baseValid.risk, level: "high" as const, reversible: false },
      steps: [{ type: "apply_patch" as const, patchRef: "p" }],
      rollback: { strategy: "manual" as const },
    };
    expect(() => ActionPlanSchema.parse(plan)).toThrow(/manual rollback requires/);
  });

  it("accepts manual rollback with notes", () => {
    const plan = {
      ...baseValid,
      risk: { ...baseValid.risk, level: "high" as const, reversible: false },
      steps: [{ type: "apply_patch" as const, patchRef: "p" }],
      rollback: { strategy: "manual" as const, notes: "operator must revert via git" },
    };
    expect(() => ActionPlanSchema.parse(plan)).not.toThrow();
  });
});
