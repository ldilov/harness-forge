import type { RuntimeAuditArtifact } from "./write-runtime-audit-artifact.js";

export function summarizeRuntimeReview(findings: RuntimeAuditArtifact["findings"]): RuntimeAuditArtifact {
  const sorted = [...findings].sort((a, b) => a.severity.localeCompare(b.severity));
  const verdict: RuntimeAuditArtifact["verdict"] = sorted.some((entry) => entry.severity === "critical" || entry.severity === "high")
    ? "changes-requested"
    : sorted.length > 0
      ? "warn"
      : "pass";

  return {
    profile: "standard",
    verdict,
    summary: sorted.length > 0 ? `${sorted.length} finding(s) require attention.` : "No critical findings detected.",
    findings: sorted.slice(0, 7),
    nextAction: sorted.length > 0 ? "Address high-severity findings and re-run runtime gates." : "Proceed to release validation."
  };
}
