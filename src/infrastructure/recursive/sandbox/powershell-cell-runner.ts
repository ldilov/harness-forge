import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface PowerShellCellRunnerInput {
  command: string;
  args: string[];
  scriptPath: string;
  timeoutMs: number;
}

export async function runPowerShellCell(input: PowerShellCellRunnerInput): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await execFileAsync(input.command, [...input.args, "-NoProfile", "-File", input.scriptPath], {
    timeout: input.timeoutMs,
    maxBuffer: 1024 * 1024
  });
  return {
    stdout: stdout ?? "",
    stderr: stderr ?? ""
  };
}
