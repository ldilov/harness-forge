import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const cliPath = path.join(root, "dist", "cli", "index.js");

function createShellEnv(homeDir: string, extra: NodeJS.ProcessEnv = {}): NodeJS.ProcessEnv {
  return {
    ...process.env,
    HOME: homeDir,
    USERPROFILE: homeDir,
    ...(process.platform === "win32" ? {} : { SHELL: process.env.SHELL ?? "/bin/bash" }),
    PATH: process.env.PATH ?? "",
    ...extra
  };
}

function expectedShimPaths(homeDir: string): string[] {
  return process.platform === "win32"
    ? [
        path.join(homeDir, ".hforge", "bin", "hforge.cmd"),
        path.join(homeDir, ".hforge", "bin", "hforge.ps1")
      ]
    : [path.join(homeDir, ".hforge", "bin", "hforge")];
}

function expectedProfilePath(homeDir: string, shellValue: string | undefined): string | null {
  if (process.platform === "win32") {
    return path.join(homeDir, "Documents", "PowerShell", "Microsoft.PowerShell_profile.ps1");
  }

  const shellName = path.basename(shellValue ?? "/bin/bash").toLowerCase();
  if (shellName === "zsh") {
    return path.join(homeDir, ".zshrc");
  }
  if (shellName === "bash") {
    return path.join(homeDir, ".bashrc");
  }
  return null;
}

describe("shell integration", () => {
  it("shows a preview without writing files by default", async () => {
    const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-shell-preview-"));
    const result = spawnSync(process.execPath, [cliPath, "shell", "setup", "--json"], {
      cwd: root,
      encoding: "utf8",
      env: createShellEnv(homeDir)
    });

    expect(result.status).toBe(1);
    expect(result.stdout).toContain('"applyRequested": false');
    expect(result.stdout).toContain('"shimDir"');
    await expect(fs.access(expectedShimPaths(homeDir)[0])).rejects.toThrow();
  });

  it("writes shims and an idempotent profile block when applied", async () => {
    const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-shell-apply-"));
    const env = createShellEnv(homeDir);
    const firstRun = spawnSync(process.execPath, [cliPath, "shell", "setup", "--yes", "--json"], {
      cwd: root,
      encoding: "utf8",
      env
    });

    expect(firstRun.status).toBe(0);
    expect(firstRun.stdout).toContain('"applyRequested": true');

    const shimPaths = expectedShimPaths(homeDir);
    for (const shimPath of shimPaths) {
      await expect(fs.readFile(shimPath, "utf8")).resolves.toContain("npx @harness-forge/cli");
    }

    const profilePath = expectedProfilePath(homeDir, env.SHELL);
    if (profilePath) {
      const initialProfile = await fs.readFile(profilePath, "utf8");
      expect(initialProfile.match(/Harness Forge shell integration/gu)?.length ?? 0).toBe(2);
    }

    const secondRun = spawnSync(process.execPath, [cliPath, "shell", "setup", "--yes", "--json"], {
      cwd: root,
      encoding: "utf8",
      env
    });

    expect(secondRun.status).toBe(0);
    if (profilePath) {
      const rerunProfile = await fs.readFile(profilePath, "utf8");
      expect(rerunProfile.match(/Harness Forge shell integration/gu)?.length ?? 0).toBe(2);
    }
  });

  it("reports missing versus configured shell status correctly", { timeout: 30_000 }, async () => {
    const homeDir = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-shell-status-"));
    const baseEnv = createShellEnv(homeDir);

    const missingResult = spawnSync(process.execPath, [cliPath, "shell", "status", "--json"], {
      cwd: root,
      encoding: "utf8",
      env: baseEnv
    });

    expect(missingResult.status).toBe(0);
    expect(missingResult.stdout).toContain('"shimExists": false');

    spawnSync(process.execPath, [cliPath, "shell", "setup", "--yes", "--json"], {
      cwd: root,
      encoding: "utf8",
      env: baseEnv
    });

    const shimDir = path.join(homeDir, ".hforge", "bin");
    const configuredEnv = createShellEnv(homeDir, { PATH: `${shimDir}${path.delimiter}${process.env.PATH ?? ""}` });
    const configuredResult = spawnSync(process.execPath, [cliPath, "shell", "status", "--json"], {
      cwd: root,
      encoding: "utf8",
      env: configuredEnv
    });

    expect(configuredResult.status).toBe(0);
    expect(configuredResult.stdout).toContain('"shimExists": true');
    expect(configuredResult.stdout).toContain('"profileManagedBlockPresent": true');
    expect(configuredResult.stdout).toContain('"bareHforgeResolvable": true');
  });
});
