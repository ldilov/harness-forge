import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const seededRoot = path.join(root, "knowledge-bases", "seeded");
const manifestPath = path.join(root, "manifests", "catalog", "seeded-knowledge-files.json");
const manifest = JSON.parse(await fs.readFile(manifestPath, "utf8"));

async function listFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const results = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listFiles(absolutePath);
      }

      return [absolutePath];
    })
  );

  return results.flat();
}

const seededFiles = (await listFiles(seededRoot))
  .map((absolutePath) => path.relative(root, absolutePath).replaceAll("\\", "/"))
  .sort();

const manifestEntries = manifest.files ?? [];
const manifestByPackagePath = new Map(manifestEntries.map((entry) => [entry.packagePath, entry]));
const failures = [];
const seededArchiveFiles = seededFiles.filter((filePath) => filePath !== "knowledge-bases/seeded/README.md");

for (const filePath of seededArchiveFiles) {
  if (!manifestByPackagePath.has(filePath)) {
    failures.push({ issue: "Seeded file missing from coverage manifest.", file: filePath });
  }
}

for (const entry of manifestEntries) {
  const absolutePath = path.join(root, entry.packagePath);
  try {
    await fs.access(absolutePath);
  } catch {
    failures.push({ issue: "Manifest entry points to a missing shipped file.", file: entry.packagePath });
  }
}

const expectedLanguages = new Set(["typescript", "java", "dotnet", "lua", "powershell"]);
const countsByLanguage = Object.fromEntries([...expectedLanguages].map((language) => [language, 0]));
const kindsByLanguage = Object.fromEntries([...expectedLanguages].map((language) => [language, new Set()]));

for (const entry of manifestEntries) {
  if (countsByLanguage[entry.language] === undefined) {
    failures.push({ issue: "Unexpected language in coverage manifest.", file: entry.packagePath, language: entry.language });
    continue;
  }

  countsByLanguage[entry.language] += 1;
  kindsByLanguage[entry.language].add(entry.contentKind);
}

for (const language of expectedLanguages) {
  if ((countsByLanguage[language] ?? 0) === 0) {
    failures.push({ issue: "No files mapped for seeded language.", language });
    continue;
  }

  for (const requiredKind of ["overview", "review-checklist", "framework-notes", "example", "common-rule", "language-rule"]) {
    if (!kindsByLanguage[language].has(requiredKind)) {
      failures.push({ issue: "Seeded language is missing a required coverage kind.", language, requiredKind });
    }
  }
}

if (seededArchiveFiles.length !== manifestEntries.length) {
  failures.push({
    issue: "Seeded file count does not match manifest coverage.",
    seededFiles: seededArchiveFiles.length,
    manifestEntries: manifestEntries.length
  });
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, seededFiles: seededArchiveFiles.length }, null, 2));
