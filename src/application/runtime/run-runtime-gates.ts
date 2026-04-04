import type { CIGateResult } from "../../domain/runtime/governance-gates.js";

export interface RuntimeGateInput {
  hotPathWithinBudget: boolean;
  canonicalityComplete: boolean;
  duplicateThresholdPass: boolean;
  bridgeBudgetPass: boolean;
  leakagePass: boolean;
  outputCoveragePass: boolean;
  targetHonestyPass: boolean;
}

export function runRuntimeGates(input: RuntimeGateInput): CIGateResult[] {
  return [
    { gateId: "hot-path-budget", status: input.hotPathWithinBudget ? "pass" : "fail", severity: "high", evidenceRefs: [] },
    { gateId: "canonicality", status: input.canonicalityComplete ? "pass" : "fail", severity: "critical", evidenceRefs: [] },
    { gateId: "duplicate-threshold", status: input.duplicateThresholdPass ? "pass" : "warn", severity: "medium", evidenceRefs: [] },
    { gateId: "bridge-size", status: input.bridgeBudgetPass ? "pass" : "warn", severity: "medium", evidenceRefs: [] },
    { gateId: "cold-leakage", status: input.leakagePass ? "pass" : "fail", severity: "high", evidenceRefs: [] },
    { gateId: "output-profile-coverage", status: input.outputCoveragePass ? "pass" : "fail", severity: "high", evidenceRefs: [] },
    { gateId: "target-support-honesty", status: input.targetHonestyPass ? "pass" : "fail", severity: "critical", evidenceRefs: [] }
  ];
}
