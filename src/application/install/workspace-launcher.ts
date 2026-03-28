import fs from "node:fs/promises";
import path from "node:path";

import { GENERATED_DIR, ensureDir, writeTextFile } from "../../shared/index.js";

export interface WorkspaceLauncherPaths {
  shellPath: string;
  cmdPath: string;
  ps1Path: string;
}

function shellLauncherContents(): string {
  return [
    "#!/usr/bin/env sh",
    "npx @harness-forge/cli \"$@\""
  ].join("\n") + "\n";
}

function cmdLauncherContents(): string {
  return [
    "@echo off",
    "npx @harness-forge/cli %*"
  ].join("\n") + "\n";
}

function powershellLauncherContents(): string {
  return [
    "param(",
    "  [Parameter(ValueFromRemainingArguments = $true)]",
    "  [string[]]$Args",
    ")",
    "",
    "npx @harness-forge/cli @Args"
  ].join("\n") + "\n";
}

export async function writeWorkspaceLaunchers(workspaceRoot: string): Promise<WorkspaceLauncherPaths> {
  const binDir = path.join(workspaceRoot, GENERATED_DIR, "bin");
  const shellPath = path.join(binDir, "hforge");
  const cmdPath = path.join(binDir, "hforge.cmd");
  const ps1Path = path.join(binDir, "hforge.ps1");

  await ensureDir(binDir);
  await Promise.all([
    writeTextFile(shellPath, shellLauncherContents()),
    writeTextFile(cmdPath, cmdLauncherContents()),
    writeTextFile(ps1Path, powershellLauncherContents())
  ]);

  try {
    await fs.chmod(shellPath, 0o755);
  } catch {
    // Ignore chmod failures on filesystems that do not preserve POSIX modes.
  }

  return { shellPath, cmdPath, ps1Path };
}
