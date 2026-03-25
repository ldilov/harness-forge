import { createAuditReport } from "./audit-install.js";

export async function createDoctorReport(workspaceRoot: string, packageRoot: string): Promise<{
  status: "clean" | "warning" | "missing";
  audit: Awaited<ReturnType<typeof createAuditReport>>;
}> {
  const audit = await createAuditReport(workspaceRoot, packageRoot);
  const hasIssues =
    audit.missingManagedPaths.length > 0 ||
    audit.missingBundles.length > 0 ||
    audit.packageSurfaceMissingPaths.length > 0;

  return {
    status: audit.installedTargets.length === 0 ? "missing" : hasIssues ? "warning" : "clean",
    audit
  };
}
