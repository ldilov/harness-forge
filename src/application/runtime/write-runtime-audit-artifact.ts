import path from "node:path";

import { ensureDir, writeJsonFile } from "../../shared/index.js";

export interface RuntimeAuditArtifact {
  profile: "brief" | "standard" | "deep";
  verdict: "pass" | "warn" | "fail" | "changes-requested";
  summary: string;
  findings: Array<{ id: string; title: string; severity: string; evidence: string[] }>;
  nextAction: string;
}

export async function writeRuntimeAuditArtifact(workspaceRoot: string, artifactId: string, artifact: RuntimeAuditArtifact): Promise<string> {
  const dir = path.join(workspaceRoot, ".hforge", "runtime", "reviews");
  await ensureDir(dir);
  const filePath = path.join(dir, `${artifactId}.json`);
  await writeJsonFile(filePath, artifact);
  return filePath;
}
