import { spawnSync } from "node:child_process";

export interface GlobalCliInstallResult {
  attempted: boolean;
  succeeded: boolean;
  command: string;
  stdout: string;
  stderr: string;
  status: number | null;
}

function resolveNpmCommand(platform: NodeJS.Platform): string {
  return platform === "win32" ? "npm.cmd" : "npm";
}

export function installHarnessForgeGlobally(
  packageName = "@harness-forge/cli",
  platform: NodeJS.Platform = process.platform,
  env: NodeJS.ProcessEnv = process.env
): GlobalCliInstallResult {
  const npmCommand = resolveNpmCommand(platform);
  const args = ["install", "-g", packageName];
  const result = spawnSync(npmCommand, args, {
    encoding: "utf8",
    stdio: "pipe",
    env
  });

  return {
    attempted: true,
    succeeded: (result.status ?? 1) === 0,
    command: `${npmCommand} ${args.join(" ")}`,
    stdout: result.stdout ?? "",
    stderr: result.stderr ?? "",
    status: result.status
  };
}
