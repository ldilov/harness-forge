import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { exists, writeTextFile } from "../../shared/index.js";

export type ShellKind = "powershell" | "bash" | "zsh" | "unsupported";

export interface ShellIntegrationContext {
  platform: NodeJS.Platform;
  homeDir: string;
  shell: ShellKind;
  shellLabel: string;
  profilePath: string | null;
  shimDir: string;
  shimPaths: string[];
  manualCommands: string[];
}

export interface ShellIntegrationStatus {
  platform: NodeJS.Platform;
  shell: ShellKind;
  shellLabel: string;
  profilePath: string | null;
  shimDir: string;
  shimPaths: string[];
  shimExists: boolean;
  existingShimPaths: string[];
  profileExists: boolean;
  profileManagedBlockPresent: boolean;
  bareHforgeResolvable: boolean;
  resolvedCommandPath: string | null;
  manualCommands: string[];
}

export interface ShellIntegrationSetupResult extends ShellIntegrationStatus {
  applyRequested: boolean;
  changedFiles: string[];
  profileUpdated: boolean;
  shimsWritten: boolean;
  requiresManualPathStep: boolean;
  previewSummary: string[];
  profileBlockPreview: string | null;
  nextSteps: string[];
}

const START_MARKER = "# >>> Harness Forge shell integration >>>";
const END_MARKER = "# <<< Harness Forge shell integration <<<";

function detectHomeDir(env: NodeJS.ProcessEnv): string {
  return env.USERPROFILE ?? env.HOME ?? os.homedir();
}

function detectShell(platform: NodeJS.Platform, env: NodeJS.ProcessEnv): { shell: ShellKind; shellLabel: string } {
  if (platform === "win32") {
    return { shell: "powershell", shellLabel: "powershell" };
  }

  const rawShell = path.basename(env.SHELL ?? "").toLowerCase();
  if (rawShell === "bash") {
    return { shell: "bash", shellLabel: rawShell };
  }
  if (rawShell === "zsh") {
    return { shell: "zsh", shellLabel: rawShell };
  }

  return { shell: "unsupported", shellLabel: rawShell || "unknown" };
}

function detectProfilePath(platform: NodeJS.Platform, shell: ShellKind, homeDir: string): string | null {
  if (platform === "win32") {
    return path.join(homeDir, "Documents", "PowerShell", "Microsoft.PowerShell_profile.ps1");
  }
  if (shell === "bash") {
    return path.join(homeDir, ".bashrc");
  }
  if (shell === "zsh") {
    return path.join(homeDir, ".zshrc");
  }
  return null;
}

function buildShimDir(platform: NodeJS.Platform, homeDir: string): string {
  return platform === "win32" ? path.join(homeDir, ".hforge", "bin") : path.join(homeDir, ".hforge", "bin");
}

function buildShimPaths(platform: NodeJS.Platform, shimDir: string): string[] {
  if (platform === "win32") {
    return [path.join(shimDir, "hforge.cmd"), path.join(shimDir, "hforge.ps1")];
  }
  return [path.join(shimDir, "hforge")];
}

function buildManualCommands(context: ShellIntegrationContext): string[] {
  if (context.platform === "win32") {
    return [
      `$env:PATH = "${context.shimDir};$env:PATH"`,
      `[Environment]::SetEnvironmentVariable("Path", "${context.shimDir};" + [Environment]::GetEnvironmentVariable("Path", "User"), "User")`
    ];
  }

  return [`export PATH="${context.shimDir}:$PATH"`];
}

export function detectShellIntegrationContext(
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env
): ShellIntegrationContext {
  const homeDir = detectHomeDir(env);
  const detected = detectShell(platform, env);
  const shimDir = buildShimDir(platform, homeDir);
  const shimPaths = buildShimPaths(platform, shimDir);

  const context: ShellIntegrationContext = {
    platform,
    homeDir,
    shell: detected.shell,
    shellLabel: detected.shellLabel,
    profilePath: detectProfilePath(platform, detected.shell, homeDir),
    shimDir,
    shimPaths,
    manualCommands: []
  };

  context.manualCommands = buildManualCommands(context);
  return context;
}

function renderManagedProfileBlock(context: ShellIntegrationContext): string {
  if (context.platform === "win32") {
    return [
      START_MARKER,
      '$hforgeBin = Join-Path $HOME ".hforge\\bin"',
      'if (-not (($env:PATH -split ";") -contains $hforgeBin)) {',
      '  $env:PATH = "$hforgeBin;$env:PATH"',
      "}",
      END_MARKER
    ].join("\n");
  }

  return [
    START_MARKER,
    'HFORGE_BIN="$HOME/.hforge/bin"',
    'case ":$PATH:" in',
    '  *":$HFORGE_BIN:"*) ;;',
    '  *) export PATH="$HFORGE_BIN:$PATH" ;;',
    "esac",
    END_MARKER
  ].join("\n");
}

function renderShimFile(filePath: string): string {
  if (filePath.endsWith(".cmd")) {
    return "@echo off\nnpx @harness-forge/cli %*\n";
  }
  if (filePath.endsWith(".ps1")) {
    return [
      "param(",
      "  [Parameter(ValueFromRemainingArguments = $true)]",
      "  [string[]]$Args",
      ")",
      "",
      "npx @harness-forge/cli @Args"
    ].join("\n") + "\n";
  }
  return "#!/usr/bin/env sh\nnpx @harness-forge/cli \"$@\"\n";
}

async function updateManagedProfile(profilePath: string, managedBlock: string): Promise<boolean> {
  const profileExists = await exists(profilePath);
  const existing = profileExists ? await fs.readFile(profilePath, "utf8") : "";
  const startIndex = existing.indexOf(START_MARKER);
  const endIndex = existing.indexOf(END_MARKER);
  const replacement = `${managedBlock}\n`;

  let nextContent = existing;
  if (startIndex >= 0 && endIndex >= startIndex) {
    const before = existing.slice(0, startIndex).replace(/\s*$/u, "");
    const after = existing.slice(endIndex + END_MARKER.length).replace(/^\s*/u, "");
    nextContent = [before, replacement.trimEnd(), after].filter((entry) => entry.length > 0).join("\n\n") + "\n";
  } else if (existing.trim().length === 0) {
    nextContent = replacement;
  } else {
    nextContent = `${existing.replace(/\s*$/u, "")}\n\n${replacement}`;
  }

  if (nextContent === existing) {
    return false;
  }

  await writeTextFile(profilePath, nextContent);
  return true;
}

function resolveBareHforge(platform: NodeJS.Platform): { bareHforgeResolvable: boolean; resolvedCommandPath: string | null } {
  const result =
    platform === "win32"
      ? spawnSync("cmd.exe", ["/d", "/s", "/c", "where hforge"], { encoding: "utf8", stdio: "pipe" })
      : spawnSync("sh", ["-lc", "command -v hforge"], { encoding: "utf8", stdio: "pipe" });

  if ((result.status ?? 1) !== 0) {
    return { bareHforgeResolvable: false, resolvedCommandPath: null };
  }

  const firstLine = result.stdout
    .split(/\r?\n/u)
    .map((entry) => entry.trim())
    .find((entry) => entry.length > 0);

  return {
    bareHforgeResolvable: Boolean(firstLine),
    resolvedCommandPath: firstLine ?? null
  };
}

export async function getShellIntegrationStatus(
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env
): Promise<ShellIntegrationStatus> {
  const context = detectShellIntegrationContext(platform, env);
  const profileExists = context.profilePath ? await exists(context.profilePath) : false;
  const profileContent = profileExists && context.profilePath ? await fs.readFile(context.profilePath, "utf8") : "";
  const existingShimPaths = [];
  for (const shimPath of context.shimPaths) {
    if (await exists(shimPath)) {
      existingShimPaths.push(shimPath);
    }
  }

  const resolved = resolveBareHforge(platform);

  return {
    platform,
    shell: context.shell,
    shellLabel: context.shellLabel,
    profilePath: context.profilePath,
    shimDir: context.shimDir,
    shimPaths: context.shimPaths,
    shimExists: existingShimPaths.length === context.shimPaths.length,
    existingShimPaths,
    profileExists,
    profileManagedBlockPresent: profileContent.includes(START_MARKER) && profileContent.includes(END_MARKER),
    bareHforgeResolvable: resolved.bareHforgeResolvable,
    resolvedCommandPath: resolved.resolvedCommandPath,
    manualCommands: context.manualCommands
  };
}

export async function setupShellIntegration(
  applyChanges: boolean,
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env
): Promise<ShellIntegrationSetupResult> {
  const context = detectShellIntegrationContext(platform, env);
  const statusBefore = await getShellIntegrationStatus(platform, env);
  const changedFiles: string[] = [];
  let profileUpdated = false;
  let shimsWritten = false;

  if (applyChanges) {
    await fs.mkdir(context.shimDir, { recursive: true });
    for (const shimPath of context.shimPaths) {
      await writeTextFile(shimPath, renderShimFile(shimPath));
      changedFiles.push(shimPath);
      shimsWritten = true;
      if (!shimPath.endsWith(".cmd") && !shimPath.endsWith(".ps1")) {
        try {
          await fs.chmod(shimPath, 0o755);
        } catch {
          // Ignore chmod failures on filesystems that do not preserve POSIX modes.
        }
      }
    }

    if (context.profilePath && context.shell !== "unsupported") {
      profileUpdated = await updateManagedProfile(context.profilePath, renderManagedProfileBlock(context));
      if (profileUpdated) {
        changedFiles.push(context.profilePath);
      }
    }
  }

  const statusAfter = await getShellIntegrationStatus(platform, env);
  const profileBlockPreview = context.profilePath && context.shell !== "unsupported" ? renderManagedProfileBlock(context) : null;
  const previewSummary = [
    `Shell: ${statusAfter.shellLabel}`,
    `Shim directory: ${statusAfter.shimDir}`,
    `Profile target: ${statusAfter.profilePath ?? "manual setup required"}`,
    statusAfter.shell === "unsupported"
      ? "Shell profile updates are not supported automatically for this shell."
      : "Harness Forge can manage PATH through an idempotent profile block."
  ];
  const nextSteps =
    statusAfter.shell === "unsupported"
      ? [...statusAfter.manualCommands, "Restart your shell after adding the PATH entry."]
      : [
          "Restart your shell or reload your profile to pick up the PATH change.",
          "Run `hforge shell status --json` to confirm bare `hforge` is now resolvable."
        ];

  return {
    ...statusAfter,
    applyRequested: applyChanges,
    changedFiles,
    profileUpdated,
    shimsWritten,
    requiresManualPathStep: statusAfter.shell === "unsupported",
    previewSummary,
    profileBlockPreview,
    nextSteps: applyChanges ? nextSteps : [...statusBefore.manualCommands]
  };
}
