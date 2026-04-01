import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);

export interface NodeCellRunnerInput {
  scriptPath: string;
  timeoutMs: number;
}

export async function runNodeCell(input: NodeCellRunnerInput): Promise<{ stdout: string; stderr: string }> {
  const { stdout, stderr } = await execFileAsync(process.execPath, [input.scriptPath], {
    timeout: input.timeoutMs,
    maxBuffer: 1024 * 1024
  });
  return {
    stdout: stdout ?? "",
    stderr: stderr ?? ""
  };
}
