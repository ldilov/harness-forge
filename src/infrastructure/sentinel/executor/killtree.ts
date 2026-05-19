import { spawn } from "node:child_process";

export type KillSignal = "SIGTERM" | "SIGKILL";

function isWindows(): boolean {
  return process.platform === "win32";
}

async function runTaskkill(pid: number, force: boolean): Promise<void> {
  await new Promise<void>((resolve) => {
    const args = force ? ["/F", "/T", "/PID", String(pid)] : ["/T", "/PID", String(pid)];
    const child = spawn("taskkill", args, { stdio: "ignore", windowsHide: true });
    child.on("close", () => resolve());
    child.on("error", () => resolve());
  });
}

export async function killTree(pid: number, signal: KillSignal = "SIGTERM"): Promise<void> {
  if (!Number.isFinite(pid) || pid <= 0) {
    return;
  }
  if (isWindows()) {
    await runTaskkill(pid, signal === "SIGKILL");
    return;
  }
  try {
    process.kill(-pid, signal);
  } catch (groupError: unknown) {
    const code = (groupError as NodeJS.ErrnoException).code;
    if (code === "ESRCH") {
      return;
    }
    try {
      process.kill(pid, signal);
    } catch (singleError: unknown) {
      const fallbackCode = (singleError as NodeJS.ErrnoException).code;
      if (fallbackCode !== "ESRCH") {
        throw singleError;
      }
    }
  }
}

export function spawnDetachedOptions(): { detached: boolean; windowsHide: boolean } {
  return {
    detached: !isWindows(),
    windowsHide: true,
  };
}
