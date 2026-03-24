import { spawnSync } from "node:child_process";

const scenarios = [
  ["--help"],
  ["catalog", "--json"],
  ["template", "list", "--json"]
];

const results = scenarios.map((args) => {
  const run = spawnSync("node", ["dist/cli/index.js", ...args], {
    stdio: "pipe",
    encoding: "utf8"
  });

  return {
    args,
    status: run.status ?? 1,
    stdout: run.stdout.trim(),
    stderr: run.stderr.trim()
  };
});

const failed = results.filter((result) => result.status !== 0);

for (const result of results) {
  console.log(JSON.stringify(result));
}

if (failed.length > 0) {
  process.exit(1);
}
