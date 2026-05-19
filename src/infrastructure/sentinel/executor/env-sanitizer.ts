import os from "node:os";
import path from "node:path";

const POSIX_PASSTHROUGH = ["PATH", "LANG", "LC_ALL", "LOGNAME", "USER", "TMPDIR"] as const;
const WINDOWS_PASSTHROUGH = [
  "Path",
  "PATH",
  "PATHEXT",
  "SYSTEMROOT",
  "SYSTEMDRIVE",
  "COMSPEC",
  "USERPROFILE",
  "APPDATA",
  "LOCALAPPDATA",
  "PROGRAMFILES",
  "PROGRAMFILES(X86)",
  "PROGRAMDATA",
  "WINDIR",
  "TEMP",
  "TMP",
] as const;

export interface SandboxEnvOptions {
  readonly actionId: string;
  readonly worktreePath: string;
  readonly inherit?: NodeJS.ProcessEnv;
}

function passthroughKeys(): readonly string[] {
  return process.platform === "win32" ? WINDOWS_PASSTHROUGH : POSIX_PASSTHROUGH;
}

export function buildSandboxEnv(options: SandboxEnvOptions): NodeJS.ProcessEnv {
  const source = options.inherit ?? process.env;
  const sandboxHome = path.join(options.worktreePath, ".sentinel-home");
  const env: NodeJS.ProcessEnv = {
    HOME: sandboxHome,
    USERPROFILE: sandboxHome,
    CI: "true",
    HFORGE_ACTION_ID: options.actionId,
    HFORGE_SANDBOX: "1",
    NODE_ENV: source.NODE_ENV ?? "development",
  };
  for (const key of passthroughKeys()) {
    const value = source[key];
    if (value !== undefined && value.length > 0) {
      env[key] = value;
    }
  }
  return env;
}

export function sandboxHomePath(worktreePath: string): string {
  return path.join(worktreePath, ".sentinel-home");
}

export function isPosixHomeKey(key: string): boolean {
  return key === "HOME";
}

export function defaultPosixPassthrough(): readonly string[] {
  return POSIX_PASSTHROUGH;
}

export function defaultWindowsPassthrough(): readonly string[] {
  return WINDOWS_PASSTHROUGH;
}

export function osTmpDir(): string {
  return os.tmpdir();
}
