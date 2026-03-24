import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const nodeCommand = process.execPath;
const powerShellCandidates = process.platform === "win32" ? ["pwsh", "powershell"] : ["pwsh"];

function run(command, args) {
  return spawnSync(command, args, {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8"
  });
}

const scriptRuns = [
  ["scripts/ci/validate-pack-dependencies.mjs"],
  ["scripts/ci/validate-content-metadata.mjs"],
  ["scripts/ci/validate-seeded-knowledge-coverage.mjs"],
  ["scripts/ci/validate-generated-sync.mjs"],
  ["scripts/ci/validate-packed-install-surface.mjs"]
].map(([relativePath]) => ({
  name: relativePath,
  result: run(nodeCommand, [path.join(root, relativePath)])
}));

const powerShell = powerShellCandidates.find((candidate) => (run(candidate, ["-NoProfile", "-Command", "$PSVersionTable.PSVersion.ToString()"]).status ?? 1) === 0);
const powerShellRuns = powerShell
  ? [
      ["scripts/templates/powershell/Check-TemplateFrontmatter.ps1", ["-Root", "."]],
      ["scripts/templates/powershell/Check-TemplateLinks.ps1", ["-Root", "."]],
      ["scripts/templates/powershell/Get-MissingTemplateSections.ps1", ["-Root", "."]],
      ["scripts/templates/powershell/Test-WorkflowContracts.ps1", ["-Root", "."]]
    ].map(([scriptPath, args]) => ({
      name: scriptPath,
      result: run(powerShell, ["-File", path.join(root, scriptPath), ...args])
    }))
  : [];

const distCliPath = path.join(root, "dist", "cli", "index.js");
const cliRuns = fs.existsSync(distCliPath)
  ? [
      { name: "catalog", result: run(nodeCommand, [distCliPath, "catalog", "--json"]) },
      { name: "template-validate", result: run(nodeCommand, [distCliPath, "template", "validate", "--json"]) }
    ]
  : [];

const results = [...scriptRuns, ...powerShellRuns, ...cliRuns];
const failures = results
  .filter(({ result }) => (result.status ?? 1) !== 0)
  .map(({ name, result }) => ({
    name,
    stdout: result.stdout?.trim(),
    stderr: result.stderr?.trim()
  }));

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(
  JSON.stringify(
    {
      ok: true,
      scripts: scriptRuns.length,
      powerShell: powerShellRuns.length,
      cli: cliRuns.length
    },
    null,
    2
  )
);
