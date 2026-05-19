import path from "node:path";
import fs from "node:fs/promises";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, "..", "..", "..");
const SCRIPT = path.join(REPO_ROOT, "scripts", "sentinel", "validate-sentinel.mjs");

interface RunResult {
  readonly exitCode: number;
  readonly stdout: string;
  readonly stderr: string;
}

function runScript(): Promise<RunResult> {
  return new Promise((resolve) => {
    const child = spawn(process.execPath, [SCRIPT], {
      cwd: REPO_ROOT,
      env: { ...process.env, FORCE_COLOR: "0" },
      stdio: ["ignore", "pipe", "pipe"],
      windowsHide: true,
    });
    let stdout = "";
    let stderr = "";
    child.stdout?.on("data", (chunk: Buffer) => {
      stdout += chunk.toString("utf8");
    });
    child.stderr?.on("data", (chunk: Buffer) => {
      stderr += chunk.toString("utf8");
    });
    child.on("close", (code) => resolve({ exitCode: code ?? 1, stdout, stderr }));
    child.on("error", () => resolve({ exitCode: 1, stdout, stderr }));
  });
}

let backupPath: string | null = null;
let backupContent: string | null = null;

beforeEach(async () => {
  backupPath = null;
  backupContent = null;
});

afterEach(async () => {
  if (backupPath !== null && backupContent !== null) {
    await fs.writeFile(backupPath, backupContent, "utf8");
    backupPath = null;
    backupContent = null;
  }
});

describe("validate:sentinel runtime gate", () => {
  it("passes on a clean repo", async () => {
    const result = await runScript();
    expect(result.exitCode).toBe(0);
    const summary = JSON.parse(result.stdout) as {
      ok: boolean;
      checks: Record<string, { status: string }>;
    };
    expect(summary.ok).toBe(true);
    expect(summary.checks.monitorTemplates.status).toBe("passed");
    expect(summary.checks.policyTemplates.status).toBe("passed");
    expect(summary.checks.noInlineComments.status).toBe("passed");
  }, 60_000);

  it("fails when a sentinel TS file contains a trailing inline comment", async () => {
    backupPath = path.join(REPO_ROOT, "src/cli/commands/observe.ts");
    backupContent = await fs.readFile(backupPath, "utf8");
    const broken = backupContent.replace(
      /^import path from "node:path";/m,
      `import path from "node:path"; // injected trailing comment for validate-sentinel test`,
    );
    if (broken === backupContent) {
      backupPath = null;
      backupContent = null;
      throw new Error("test setup failed: anchor pattern not found");
    }
    await fs.writeFile(backupPath, broken, "utf8");

    const result = await runScript();
    expect(result.exitCode).toBe(1);
    const summary = JSON.parse(result.stdout) as {
      ok: boolean;
      checks: { noInlineComments: { status: string; count: number; sample: readonly string[] } };
    };
    expect(summary.ok).toBe(false);
    expect(summary.checks.noInlineComments.status).toBe("failed");
    expect(summary.checks.noInlineComments.count).toBeGreaterThan(0);
    expect(summary.checks.noInlineComments.sample[0]).toContain("observe.ts");
  }, 60_000);

  it("fails when a monitor template YAML is malformed", async () => {
    backupPath = path.join(REPO_ROOT, "templates/sentinel/monitors/repo-drift.yaml");
    backupContent = await fs.readFile(backupPath, "utf8");
    const broken = backupContent.replace(/enabled: true/, 'enabled: "not-a-bool"');
    await fs.writeFile(backupPath, broken, "utf8");

    const result = await runScript();
    expect(result.exitCode).toBe(1);
    const summary = JSON.parse(result.stdout) as {
      ok: boolean;
      checks: { monitorTemplates: { status: string; errors: readonly string[] } };
    };
    expect(summary.ok).toBe(false);
    expect(summary.checks.monitorTemplates.status).toBe("failed");
    expect(summary.checks.monitorTemplates.errors.length).toBeGreaterThan(0);
  }, 60_000);
});
