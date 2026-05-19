import fs from "node:fs/promises";

const SECRET_VALUE =
  /(?:sk-[A-Za-z0-9_-]{16,}|gh[posru]_[A-Za-z0-9]{20,}|AKIA[0-9A-Z]{16}|xox[baprs]-[A-Za-z0-9-]{10,}|glpat-[A-Za-z0-9_-]{20,}|npm_[A-Za-z0-9]{36}|eyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}|[Bb]earer\s+[A-Za-z0-9._-]{20,})/g;

const SAFE_ARTIFACT_ID = /^[A-Za-z0-9._-]+$/;

export function redactSecrets(text: string): string {
  return text.replace(SECRET_VALUE, "[REDACTED]");
}

export function isSafeArtifactId(artifactId: string): boolean {
  return SAFE_ARTIFACT_ID.test(artifactId) && !artifactId.includes("..");
}

export function assertSafeArtifactId(artifactId: string): void {
  if (!isSafeArtifactId(artifactId)) {
    throw new Error(`invalid artifact id: ${artifactId}`);
  }
}

export async function writeAtomicFile(filePath: string, content: string): Promise<void> {
  const tmp = `${filePath}.${process.pid}.tmp`;
  let renamed = false;
  try {
    await fs.writeFile(tmp, content, "utf8");
    await fs.rename(tmp, filePath);
    renamed = true;
  } finally {
    if (!renamed) {
      await fs.unlink(tmp).catch(() => undefined);
    }
  }
}
