import path from "node:path";
import { spawnSync } from "node:child_process";

import { PACKAGE_ROOT, ValidationError } from "../../shared/index.js";

export function runNodeScript(
  scriptRelativePath: string,
  workspaceRoot: string,
  scriptArgs: string[]
): void {
  const scriptPath = path.join(PACKAGE_ROOT, scriptRelativePath);
  const result = spawnSync(process.execPath, [scriptPath, ...scriptArgs], {
    cwd: workspaceRoot,
    encoding: "utf8",
    stdio: "pipe"
  });

  if (result.stdout) {
    process.stdout.write(result.stdout);
  }

  if (result.stderr) {
    process.stderr.write(result.stderr);
  }

  if ((result.status ?? 1) !== 0) {
    throw new ValidationError(`Command failed: node ${scriptRelativePath} ${scriptArgs.join(" ")}`.trim());
  }
}
