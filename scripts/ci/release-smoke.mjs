import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const nodeCommand = process.execPath;
const powerShellCandidates = process.platform === "win32" ? ["pwsh", "powershell"] : ["pwsh"];
const requiredSurfaces = [
  "manifests/catalog/enhanced-skill-import-inventory.json",
  "docs/authoring/enhanced-skill-import.md"
];

function run(command, args) {
  return spawnSync(command, args, {
    cwd: root,
    stdio: "pipe",
    encoding: "utf8"
  });
}

const missingSurfaces = requiredSurfaces.filter((relativePath) => !fs.existsSync(path.join(root, relativePath)));
if (missingSurfaces.length > 0) {
  console.error(JSON.stringify({ ok: false, failures: missingSurfaces.map((name) => ({ name, stderr: "Missing required surface" })) }, null, 2));
  process.exit(1);
}

const scriptRuns = [
  ["scripts/ci/validate-pack-dependencies.mjs"],
  ["scripts/ci/validate-content-metadata.mjs"],
  ["scripts/ci/validate-seeded-knowledge-coverage.mjs"],
  ["scripts/ci/validate-generated-sync.mjs"],
  ["scripts/ci/validate-packed-install-surface.mjs"],
  ["scripts/ci/validate-capability-matrix.mjs"],
  ["scripts/ci/validate-no-placeholders.mjs"],
  ["scripts/ci/validate-skill-depth.mjs"],
  ["scripts/ci/validate-framework-coverage.mjs"],
  ["scripts/ci/validate-doc-command-alignment.mjs"],
  ["scripts/ci/validate-manifest-runtime-consistency.mjs"],
  ["scripts/knowledge/report-coverage.mjs", "--json"],
  ["scripts/knowledge/report-drift.mjs", "--json"]
].map(([relativePath, ...extraArgs]) => ({
  name: relativePath,
  result: run(nodeCommand, [path.join(root, relativePath), ...extraArgs])
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
      { name: "template-validate", result: run(nodeCommand, [distCliPath, "template", "validate", "--json"]) },
      { name: "flow-status", result: run(nodeCommand, [distCliPath, "flow", "status", "--json"]) },
      { name: "doctor", result: run(nodeCommand, [distCliPath, "doctor", "--json"]) },
      { name: "audit", result: run(nodeCommand, [distCliPath, "audit", "--json"]) }
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
