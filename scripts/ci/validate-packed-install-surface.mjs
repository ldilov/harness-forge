import fs from "node:fs/promises";
import path from "node:path";
import { spawnSync } from "node:child_process";

const root = process.cwd();
const manifestPath = path.join(root, "manifests", "catalog", "package-surface.json");
const packageJsonPath = path.join(root, "package.json");
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));
const packageJson = JSON.parse(await fs.readFile(packageJsonPath, "utf8"));

const requiredPaths = new Set([
  ...(manifest.requiredPaths ?? []),
  ...((manifest.groups ?? []).flatMap((group) => group.paths ?? [])),
  ...((manifest.targetSurfaces ?? []).flatMap((surface) => surface.paths ?? []))
]);

const failures = [];
const packageFiles = packageJson.files ?? [];
const explicitlyRequiredRecursivePaths = [
  ".agents/skills/recursive-structured-analysis/SKILL.md",
  "skills/recursive-structured-analysis/SKILL.md",
  "schemas/runtime/recursive-execution-policy.schema.json",
  "schemas/runtime/recursive-language-capabilities.schema.json",
  "schemas/runtime/recursive-run-meta.schema.json",
  "schemas/runtime/recursive-run-result.schema.json"
];

function isCoveredByPackageFiles(requiredPath) {
  return packageFiles.some((entry) => requiredPath === entry || requiredPath.startsWith(`${entry}/`));
}

for (const requiredPath of requiredPaths) {
  try {
    await fs.access(path.join(root, requiredPath));
  } catch {
    failures.push({ issue: "Required package-surface path is missing in the repository.", path: requiredPath });
    continue;
  }

  if (!isCoveredByPackageFiles(requiredPath)) {
    failures.push({ issue: "Required package-surface path is not covered by package.json files.", path: requiredPath });
  }
}

for (const requiredPath of explicitlyRequiredRecursivePaths) {
  if (!requiredPaths.has(requiredPath)) {
    failures.push({ issue: "Recursive structured-analysis path is missing from package-surface manifest.", path: requiredPath });
  }
}

const packed =
  process.platform === "win32"
    ? spawnSync("cmd.exe", ["/d", "/s", "/c", "npm pack --json --dry-run"], {
        cwd: root,
        encoding: "utf8"
      })
    : spawnSync("npm", ["pack", "--json", "--dry-run"], {
        cwd: root,
        encoding: "utf8"
      });

if ((packed.status ?? 1) !== 0) {
  failures.push({
    issue: "npm pack --dry-run failed.",
    error: packed.error?.message,
    stdout: packed.stdout?.trim(),
    stderr: packed.stderr?.trim()
  });
} else {
  const output = JSON.parse(packed.stdout || "[]");
  const packedFiles = new Set((output[0]?.files ?? []).map((entry) => entry.path));

  for (const requiredPath of requiredPaths) {
    const absolutePath = path.join(root, requiredPath);
    const stats = await fs.stat(absolutePath);
    const packedMatch = stats.isDirectory()
      ? [...packedFiles].some((filePath) => filePath.startsWith(`${requiredPath}/`))
      : packedFiles.has(requiredPath);

    if (!packedMatch) {
      failures.push({ issue: "Required path is missing from npm pack dry-run output.", path: requiredPath });
    }
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, requiredPaths: requiredPaths.size }, null, 2));
