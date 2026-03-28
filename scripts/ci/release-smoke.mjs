import path from "node:path";
import fs from "node:fs";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const nodeCommand = process.execPath;
const powerShellCandidates = process.platform === "win32" ? ["pwsh", "powershell"] : ["pwsh"];
const shellCandidates = process.platform === "win32" ? ["bash"] : ["bash", "sh"];
const requiredSurfaces = [
  "manifests/catalog/enhanced-skill-import-inventory.json",
  "docs/authoring/enhanced-skill-import.md",
  "docs/release-process.md",
  "CONTRIBUTING.md",
  "CHANGELOG.md"
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
  ["scripts/ci/smoke-runner.mjs"],
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
      { name: "help", result: run(nodeCommand, [distCliPath, "--help"]) },
      { name: "init", result: run(nodeCommand, [distCliPath, "init", "--help"]) },
      { name: "refresh", result: run(nodeCommand, [distCliPath, "refresh", "--help"]) },
      { name: "task", result: run(nodeCommand, [distCliPath, "task", "--help"]) },
      { name: "pack", result: run(nodeCommand, [distCliPath, "pack", "--help"]) },
      { name: "review", result: run(nodeCommand, [distCliPath, "review", "--help"]) },
      { name: "export", result: run(nodeCommand, [distCliPath, "export", "--help"]) },
      { name: "update", result: run(nodeCommand, [distCliPath, "update", "--help"]) },
      { name: "upgrade", result: run(nodeCommand, [distCliPath, "upgrade", "--help"]) },
      { name: "catalog", result: run(nodeCommand, [distCliPath, "catalog", "--json"]) },
      { name: "template-validate", result: run(nodeCommand, [distCliPath, "template", "validate", "--json"]) },
      { name: "flow-status", result: run(nodeCommand, [distCliPath, "flow", "status", "--json"]) },
      { name: "recursive-capabilities", result: run(nodeCommand, [distCliPath, "recursive", "capabilities", "--help"]) },
      { name: "recursive-run", result: run(nodeCommand, [distCliPath, "recursive", "run", "--help"]) },
      { name: "doctor", result: run(nodeCommand, [distCliPath, "doctor", "--json"]) },
      { name: "audit", result: run(nodeCommand, [distCliPath, "audit", "--json"]) }
    ]
  : [];

const shellRuntime = shellCandidates.find((candidate) => (run(candidate, ["-lc", "printf ok"]).status ?? 1) === 0);
const shellRuns = shellRuntime
  ? [
      ["scripts/templates/shell/check-template-frontmatter.sh", ["."]],
      ["scripts/templates/shell/check-template-links.sh", ["."]],
      ["scripts/templates/shell/list-missing-template-sections.sh", ["."]],
      ["scripts/templates/shell/verify-workflow-contracts.sh", ["."]]
    ].map(([scriptPath, args]) => ({
      name: scriptPath,
      result: run(shellRuntime, [path.join(root, scriptPath), ...args])
    }))
  : [];

const results = [...scriptRuns, ...shellRuns, ...powerShellRuns, ...cliRuns];
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
      shell: shellRuns.length,
      powerShell: powerShellRuns.length,
      cli: cliRuns.length
    },
    null,
    2
  )
);
