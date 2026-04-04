import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface PythonCellRunnerInput {
  command: string;
  args: string[];
  scriptPath: string;
  timeoutMs: number;
}

export async function runPythonCell(input: PythonCellRunnerInput): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await execFileAsync(input.command, [...input.args, input.scriptPath], {
    timeout: input.timeoutMs,
    maxBuffer: 1024 * 1024
  });
  return {
    stdout: stdout ?? "",
    stderr: stderr ?? ""
  };
}
