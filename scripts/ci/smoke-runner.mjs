import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const cliPath = path.join(root, "dist", "cli", "index.js");

function runCli(args, cwd = root) {
  return spawnSync(process.execPath, [cliPath, ...args], {
    cwd,
    encoding: "utf8",
    stdio: "pipe"
  });
}

const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-production-smoke-"));
await fs.writeFile(
  path.join(tempRoot, "package.json"),
  `${JSON.stringify({ name: "smoke-repo", private: true, version: "1.0.0" }, null, 2)}\n`,
  "utf8"
);

const scenarios = [
  {
    name: "global-help",
    args: ["--help"],
    expectStatus: 0,
    expectStdout: "Usage: hforge"
  },
  {
    name: "commands-json",
    args: ["commands", "--json"],
    expectStatus: 0,
    expectStdout: "\"cliCommands\""
  },
  {
    name: "target-inspect",
    args: ["target", "inspect", "codex", "--json"],
    expectStatus: 0,
    expectStdout: "\"id\": \"codex\""
  },
  {
    name: "init",
    args: ["init", "--root", tempRoot, "--json"],
    expectStatus: 0,
    expectStdout: "\"runtimeIndexPath\""
  },
  {
    name: "status-after-init",
    args: ["status", "--root", tempRoot, "--json"],
    expectStatus: 0,
    expectStdout: "\"runtimeSchemaVersion\""
  },
  {
    name: "refresh-guidance",
    args: ["refresh", "--root", tempRoot],
    expectStatus: 1,
    expectStderr: "No installed targets were found"
  }
];

const results = scenarios.map((scenario) => {
  const result = runCli(scenario.args);
  return {
    ...scenario,
    status: result.status ?? 1,
    stdout: result.stdout.trim(),
    stderr: result.stderr.trim()
  };
});

const failures = results.filter((result) => {
  if (result.status !== result.expectStatus) {
    return true;
  }
  if (result.expectStdout && !result.stdout.includes(result.expectStdout)) {
    return true;
  }
  if (result.expectStderr && !result.stderr.includes(result.expectStderr)) {
    return true;
  }
  return false;
});

console.log(JSON.stringify({ ok: failures.length === 0, tempRoot, results }, null, 2));

if (failures.length > 0) {
  process.exit(1);
}
