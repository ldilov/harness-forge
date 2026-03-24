import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const scanRoots = ["docs", "commands", "agents", "contexts", "rules", "templates"];

async function listMarkdownFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const absolutePath = path.join(dir, entry.name);
      if (entry.isDirectory()) {
        return listMarkdownFiles(absolutePath);
      }

      return absolutePath.endsWith(".md") ? [absolutePath] : [];
    })
  );

  return nested.flat();
}

function parseScalar(value) {
  const trimmed = value.trim();
  if (trimmed === "true") {
    return true;
  }

  if (trimmed === "false") {
    return false;
  }

  if ((trimmed.startsWith("\"") && trimmed.endsWith("\"")) || (trimmed.startsWith("'") && trimmed.endsWith("'"))) {
    return trimmed.slice(1, -1);
  }

  return trimmed;
}

function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return null;
  }

  const metadata = {};
  let currentArrayKey = null;

  for (const line of match[1].replaceAll("\r", "").split("\n")) {
    if (!line.trim()) {
      continue;
    }

    const arrayItemMatch = line.match(/^\s*-\s+(.*)$/);
    if (arrayItemMatch && currentArrayKey) {
      metadata[currentArrayKey].push(parseScalar(arrayItemMatch[1]));
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!keyMatch) {
      continue;
    }

    const [, key, rawValue = ""] = keyMatch;
    if (rawValue.trim() === "") {
      metadata[key] = [];
      currentArrayKey = key;
      continue;
    }

    metadata[key] = parseScalar(rawValue);
    currentArrayKey = null;
  }

  return metadata;
}

const failures = [];
let generatedFiles = 0;

for (const scanRoot of scanRoots) {
  const absoluteRoot = path.join(root, scanRoot);
  try {
    await fs.access(absoluteRoot);
  } catch {
    continue;
  }

  for (const absolutePath of await listMarkdownFiles(absoluteRoot)) {
    const content = await fs.readFile(absolutePath, "utf8");
    const metadata = parseFrontMatter(content);
    if (!metadata || metadata.generated !== true) {
      continue;
    }

    generatedFiles += 1;
    const canonicalSource = metadata.canonical_source;
    if (!canonicalSource) {
      failures.push({ file: path.relative(root, absolutePath).replaceAll("\\", "/"), issue: "Generated file is missing canonical_source." });
      continue;
    }

    const canonicalPath = path.join(root, canonicalSource);
    try {
      await fs.access(canonicalPath);
    } catch {
      failures.push({
        file: path.relative(root, absolutePath).replaceAll("\\", "/"),
        issue: "Generated file points to a missing canonical source.",
        canonicalSource
      });
    }
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, generatedFiles }, null, 2));
