import path from "node:path";

import { ValidationError } from "../../shared/index.js";

export function normalizeTargetPath(rootPath: string, relativePath: string): string {
  const normalized = path.resolve(rootPath, relativePath);
  const base = path.resolve(rootPath);

  if (!normalized.startsWith(base)) {
    throw new ValidationError(`Target path escapes workspace root: ${relativePath}`);
  }

  return normalized;
}
