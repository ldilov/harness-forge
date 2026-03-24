import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();

const filesToValidate = [
  "commands/plan.md",
  "commands/test.md",
  "agents/planner.md",
  "contexts/dev.md",
  "rules/README.md",
  "rules/typescript/README.md",
  "rules/java/README.md",
  "rules/dotnet/README.md",
  "rules/lua/README.md",
  "rules/powershell/README.md",
  "docs/catalog/languages/typescript.md",
  "docs/catalog/languages/java.md",
  "docs/catalog/languages/dotnet.md",
  "docs/catalog/languages/lua.md",
  "docs/catalog/languages/powershell.md",
  "docs/style-guides/command-style-guide.md",
  "docs/style-guides/agent-style-guide.md",
  "docs/style-guides/rule-style-guide.md",
  "templates/tasks/implement-feature.md",
  "templates/tasks/fix-bug.md",
  "templates/workflows/research-plan-implement-validate.md",
  "templates/workflows/triage-reproduce-fix-verify.md"
];

const requiredSectionsByKind = {
  command: ["## Syntax", "## Arguments and options", "## Output contract", "## Side effects", "## Failure behavior"],
  agent: ["## Mission", "## Inputs expected", "## Workflow", "## Output contract", "## Stop conditions", "## Escalation rules"],
  "language-pack": ["## Best fit", "## What ships"],
  rule: [],
  "style-guide": [],
  "task-template": [],
  "workflow-template": []
};

const allowedKinds = new Set([
  "command",
  "agent",
  "context",
  "rule",
  "example",
  "language-pack",
  "style-guide",
  "task-template",
  "workflow-template"
]);

const allowedStatuses = new Set(["draft", "stable", "deprecated"]);

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

function parseYamlObject(raw) {
  const result = {};
  let currentArrayKey = null;

  for (const line of raw.replaceAll("\r", "").split("\n")) {
    if (!line.trim()) {
      continue;
    }

    const arrayItemMatch = line.match(/^\s*-\s+(.*)$/);
    if (arrayItemMatch && currentArrayKey) {
      result[currentArrayKey].push(parseScalar(arrayItemMatch[1]));
      continue;
    }

    const keyMatch = line.match(/^([A-Za-z0-9_-]+):(?:\s*(.*))?$/);
    if (!keyMatch) {
      continue;
    }

    const [, key, rawValue = ""] = keyMatch;
    if (rawValue.trim() === "") {
      result[key] = [];
      currentArrayKey = key;
      continue;
    }

    result[key] = parseScalar(rawValue);
    currentArrayKey = null;
  }

  return result;
}

function parseFrontMatter(content) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) {
    return null;
  }

  return {
    metadata: parseYamlObject(match[1]),
    body: match[2] ?? ""
  };
}

function validateMetadata(metadata) {
  const failures = [];
  for (const field of ["id", "kind", "title", "summary", "status", "owner", "applies_to", "languages", "generated"]) {
    if (!(field in metadata)) {
      failures.push(`Missing required metadata field: ${field}`);
    }
  }

  if (metadata.kind && !allowedKinds.has(metadata.kind)) {
    failures.push(`Unsupported kind: ${metadata.kind}`);
  }

  if (metadata.status && !allowedStatuses.has(metadata.status)) {
    failures.push(`Unsupported status: ${metadata.status}`);
  }

  if (metadata.applies_to && !Array.isArray(metadata.applies_to)) {
    failures.push("applies_to must be an array.");
  }

  if (metadata.languages && !Array.isArray(metadata.languages)) {
    failures.push("languages must be an array.");
  }

  if ("generated" in metadata && typeof metadata.generated !== "boolean") {
    failures.push("generated must be a boolean.");
  }

  if (metadata.generated === true && typeof metadata.canonical_source !== "string") {
    failures.push("generated content must declare canonical_source.");
  }

  return failures;
}

const failures = [];

for (const relativePath of filesToValidate) {
  const absolutePath = path.join(root, relativePath);
  const content = await fs.readFile(absolutePath, "utf8");
  const parsed = parseFrontMatter(content);

  if (!parsed) {
    failures.push({ file: relativePath, issue: "Missing YAML front matter." });
    continue;
  }

  const metadataErrors = validateMetadata(parsed.metadata);
  if (metadataErrors.length > 0) {
    failures.push({
      file: relativePath,
      issue: "Metadata schema validation failed.",
      details: metadataErrors
    });
    continue;
  }

  const requiredSections = requiredSectionsByKind[parsed.metadata.kind] ?? [];
  for (const section of requiredSections) {
    if (!parsed.body.includes(section)) {
      failures.push({ file: relativePath, issue: `Missing required section: ${section}` });
    }
  }
}

if (failures.length > 0) {
  console.error(JSON.stringify({ ok: false, failures }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, validatedFiles: filesToValidate.length }, null, 2));
