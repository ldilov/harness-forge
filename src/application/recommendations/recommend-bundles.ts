import fs from "node:fs/promises";
import path from "node:path";

const IGNORED_DIRS = new Set([
  ".git",
  ".hforge",
  ".turbo",
  ".venv",
  "coverage",
  "dist",
  "build",
  "vendor",
  "node_modules",
  "tmp",
  "temp",
  ".tmp",
  ".next",
  ".nuxt",
  ".idea",
  ".vscode"
]);

const LOW_SIGNAL_SEGMENTS = new Set([
  ".tmp",
  "tmp",
  "temp",
  "fixtures",
  "__fixtures__",
  "__snapshots__",
  "snapshots",
  "archive",
  "archives"
]);

function hasLowSignalSegment(relativePath: string): boolean {
  return relativePath.split("/").some((segment) => LOW_SIGNAL_SEGMENTS.has(segment));
}

async function walk(dir: string, visit: (relativePath: string, absolutePath: string) => void, base = dir): Promise<void> {
  let entries: Array<import("node:fs").Dirent> = [];
  try {
    entries = await fs.readdir(dir, { withFileTypes: true });
  } catch {
    return;
  }

  for (const entry of entries) {
    const absolutePath = path.join(dir, entry.name);
    const relativePath = path.relative(base, absolutePath).replaceAll("\\", "/");

    if (entry.isDirectory()) {
      if (IGNORED_DIRS.has(entry.name)) {
        continue;
      }
      await walk(absolutePath, visit, base);
      continue;
    }

    visit(relativePath, absolutePath);
  }
}

export async function recommendBundles(root: string): Promise<string[]> {
  const recommendations = new Set<string>();
  let sawTypeScriptSource = false;
  let sawTypeScriptMarker = false;
  let sawCppSource = false;
  let sawCppHeader = false;

  await walk(root, (relativePath) => {
    if (hasLowSignalSegment(relativePath)) {
      return;
    }

    const file = relativePath;
    const base = path.basename(file);

    if (file.endsWith(".ts") || file.endsWith(".tsx")) {
      sawTypeScriptSource = true;
      recommendations.add("lang:typescript");
    }
    if (base === "tsconfig.json") {
      sawTypeScriptMarker = true;
      recommendations.add("lang:typescript");
    }
    if (file.endsWith(".java")) recommendations.add("lang:java");
    if (file.endsWith(".cs") || file.endsWith(".csproj") || file.endsWith(".sln")) recommendations.add("lang:dotnet");
    if (file.endsWith(".lua")) recommendations.add("lang:lua");
    if (file.endsWith(".ps1") || file.endsWith(".psm1")) recommendations.add("lang:powershell");
    if (file.endsWith(".py")) recommendations.add("lang:python");
    if (file.endsWith(".go")) recommendations.add("lang:go");
    if (file.endsWith(".kt") || file.endsWith(".kts")) recommendations.add("lang:kotlin");
    if (file.endsWith(".rs")) recommendations.add("lang:rust");
    if (file.endsWith(".cpp") || file.endsWith(".cxx") || file.endsWith(".cc") || file.endsWith(".hpp") || file.endsWith(".hh")) {
      sawCppSource = true;
      recommendations.add("lang:cpp");
    }
    if (file.endsWith(".h")) {
      sawCppHeader = true;
    }
    if (file.endsWith(".php")) recommendations.add("lang:php");
    if (file.endsWith(".pl") || file.endsWith(".pm")) recommendations.add("lang:perl");
    if (file.endsWith(".swift")) recommendations.add("lang:swift");
    if (file.endsWith(".sh") || file.endsWith(".bash") || file.endsWith(".zsh")) recommendations.add("lang:shell");

    if (
      base === "package.json" ||
      base === "pyproject.toml" ||
      base === "requirements.txt" ||
      base === "go.mod" ||
      base === "Cargo.toml" ||
      base === "composer.json" ||
      base === "Package.swift" ||
      base === "Makefile" ||
      base === "CLAUDE.md" ||
      base === "AGENTS.md"
    ) {
      recommendations.add("capability:workflow-quality");
    }
  });

  if (!sawTypeScriptSource && !sawTypeScriptMarker) {
    recommendations.delete("lang:typescript");
  }
  if (!sawCppSource && sawCppHeader) {
    recommendations.delete("lang:cpp");
  }

  return [...recommendations].sort();
}
