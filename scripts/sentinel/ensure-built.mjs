#!/usr/bin/env node
import { spawn } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const REQUIRED_DIST_FILES = [
  "dist/domain/sentinel/monitor/monitor.js",
  "dist/application/sentinel/budget/budget-ledger.js",
];

async function exists(filePath) {
  try {
    await fs.stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function main() {
  for (const rel of REQUIRED_DIST_FILES) {
    if (!(await exists(path.join(REPO_ROOT, rel)))) {
      process.stdout.write(`prevalidate:sentinel: dist artifacts missing (${rel}); running 'npm run build' first...\n`);
      await new Promise((resolve, reject) => {
        const npm = process.platform === "win32" ? "npm.cmd" : "npm";
        const child = spawn(npm, ["run", "build"], {
          cwd: REPO_ROOT,
          stdio: "inherit",
          shell: process.platform === "win32",
        });
        child.on("close", (code) => (code === 0 ? resolve() : reject(new Error(`npm run build exited ${code}`))));
        child.on("error", reject);
      });
      return;
    }
  }
  process.stdout.write("prevalidate:sentinel: dist artifacts present.\n");
}

await main();
