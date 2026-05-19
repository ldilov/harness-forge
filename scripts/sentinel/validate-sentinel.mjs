#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import { parse as parseYaml } from "yaml";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const PROJECT_PATHS_TO_SCAN = [
  "src/application/sentinel",
  "src/domain/sentinel",
  "src/infrastructure/sentinel",
  "src/cli/commands/monitor.ts",
  "src/cli/commands/observe.ts",
  "src/cli/commands/signals.ts",
  "src/cli/commands/actions.ts",
  "src/cli/commands/autonomy.ts",
  "src/cli/commands/world.ts",
  "src/cli/commands/watchdog.ts",
  "src/application/dashboard/sentinel-snapshot.ts",
];

const ALLOWED_LEADING_TRIPLE_SLASH = /^\s*\/\/\/\s/;

async function* walkTsFiles(absRoot) {
  const stat = await fs.stat(absRoot).catch(() => null);
  if (stat === null) {
    return;
  }
  if (stat.isFile()) {
    if (absRoot.endsWith(".ts")) {
      yield absRoot;
    }
    return;
  }
  const entries = await fs.readdir(absRoot, { withFileTypes: true });
  for (const entry of entries) {
    const next = path.join(absRoot, entry.name);
    if (entry.isDirectory()) {
      yield* walkTsFiles(next);
    } else if (entry.isFile() && entry.name.endsWith(".ts")) {
      yield next;
    }
  }
}

function findCommentInLine(line) {
  let i = 0;
  let inSingle = false;
  let inDouble = false;
  let inBacktick = false;
  while (i < line.length) {
    const ch = line[i];
    const next = line[i + 1];
    if (!inSingle && !inDouble && !inBacktick) {
      if (ch === "/" && next === "/") {
        if (line[i + 2] === "/") {
          return null;
        }
        const after = line[i + 2];
        if (after === " " || after === undefined) {
          return i;
        }
      }
      if (ch === "/" && next === "*") {
        const after = line[i + 2];
        if (after === " " || after === "*" || after === undefined) {
          return i;
        }
      }
      if (ch === "'") {
        inSingle = true;
      } else if (ch === '"') {
        inDouble = true;
      } else if (ch === "`") {
        inBacktick = true;
      }
    } else if (inSingle && ch === "'" && line[i - 1] !== "\\") {
      inSingle = false;
    } else if (inDouble && ch === '"' && line[i - 1] !== "\\") {
      inDouble = false;
    } else if (inBacktick && ch === "`" && line[i - 1] !== "\\") {
      inBacktick = false;
    }
    i += 1;
  }
  return null;
}

async function scanForInlineComments() {
  const offenders = [];
  for (const target of PROJECT_PATHS_TO_SCAN) {
    const abs = path.join(REPO_ROOT, target);
    for await (const file of walkTsFiles(abs)) {
      const raw = await fs.readFile(file, "utf8");
      const lines = raw.split(/\r?\n/);
      for (let i = 0; i < lines.length; i += 1) {
        const line = lines[i];
        if (ALLOWED_LEADING_TRIPLE_SLASH.test(line)) {
          continue;
        }
        const commentAt = findCommentInLine(line);
        if (commentAt !== null) {
          offenders.push({
            file: path.relative(REPO_ROOT, file),
            line: i + 1,
            column: commentAt + 1,
            content: line.trim(),
          });
        }
      }
    }
  }
  return offenders;
}

async function loadZodSchemas() {
  const monitorUrl = pathToFileURL(path.join(REPO_ROOT, "dist/domain/sentinel/monitor/monitor.js")).href;
  const budgetUrl = pathToFileURL(path.join(REPO_ROOT, "dist/application/sentinel/budget/budget-ledger.js")).href;
  const monitorMod = await import(monitorUrl);
  const budgetMod = await import(budgetUrl);
  return {
    MonitorConfigSchema: monitorMod.MonitorConfigSchema,
    BudgetConfigSchema: budgetMod.BudgetConfigSchema,
    CadenceConfigSchema: budgetMod.CadenceConfigSchema,
  };
}

async function validateMonitorTemplates(schemas) {
  const offenders = [];
  const dir = path.join(REPO_ROOT, "templates/sentinel/monitors");
  const exists = await fs.stat(dir).then(() => true).catch(() => false);
  if (!exists) {
    return offenders;
  }
  const entries = await fs.readdir(dir);
  for (const entry of entries) {
    if (!entry.endsWith(".yaml") && !entry.endsWith(".yml")) {
      continue;
    }
    const file = path.join(dir, entry);
    const raw = await fs.readFile(file, "utf8");
    const parsed = parseYaml(raw);
    const result = schemas.MonitorConfigSchema.safeParse(parsed);
    if (!result.success) {
      offenders.push({ file: path.relative(REPO_ROOT, file), errors: result.error.errors });
    }
  }
  return offenders;
}

async function validatePolicyTemplates(schemas) {
  const offenders = [];
  const dir = path.join(REPO_ROOT, "templates/sentinel/policies");
  const exists = await fs.stat(dir).then(() => true).catch(() => false);
  if (!exists) {
    return offenders;
  }
  const targets = [
    { file: "cadence.yaml", schema: schemas.CadenceConfigSchema },
    { file: "budget.yaml", schema: schemas.BudgetConfigSchema },
  ];
  for (const target of targets) {
    const filePath = path.join(dir, target.file);
    const fileExists = await fs.stat(filePath).then(() => true).catch(() => false);
    if (!fileExists) {
      continue;
    }
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = parseYaml(raw);
    const result = target.schema.safeParse(parsed ?? {});
    if (!result.success) {
      offenders.push({ file: path.relative(REPO_ROOT, filePath), errors: result.error.errors });
    }
  }
  return offenders;
}

async function main() {
  const startedAt = Date.now();
  const summary = { ok: true, checks: {} };

  let schemas;
  try {
    schemas = await loadZodSchemas();
  } catch (error) {
    summary.ok = false;
    summary.checks.bootstrap = {
      status: "failed",
      message: `could not import compiled Zod schemas: ${error instanceof Error ? error.message : String(error)} (run 'npm run build' first)`,
    };
    process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
    process.exit(1);
  }

  const monitorOffenders = await validateMonitorTemplates(schemas);
  summary.checks.monitorTemplates = {
    status: monitorOffenders.length === 0 ? "passed" : "failed",
    files: monitorOffenders.map((entry) => entry.file),
    errors: monitorOffenders.flatMap((entry) =>
      entry.errors.map((err) => `${entry.file}: ${err.path.join(".")} ${err.message}`),
    ),
  };
  if (monitorOffenders.length > 0) {
    summary.ok = false;
  }

  const policyOffenders = await validatePolicyTemplates(schemas);
  summary.checks.policyTemplates = {
    status: policyOffenders.length === 0 ? "passed" : "failed",
    files: policyOffenders.map((entry) => entry.file),
    errors: policyOffenders.flatMap((entry) =>
      entry.errors.map((err) => `${entry.file}: ${err.path.join(".")} ${err.message}`),
    ),
  };
  if (policyOffenders.length > 0) {
    summary.ok = false;
  }

  const commentOffenders = await scanForInlineComments();
  summary.checks.noInlineComments = {
    status: commentOffenders.length === 0 ? "passed" : "failed",
    count: commentOffenders.length,
    sample: commentOffenders.slice(0, 5).map((o) => `${o.file}:${o.line} ${o.content.slice(0, 80)}`),
  };
  if (commentOffenders.length > 0) {
    summary.ok = false;
  }

  summary.durationMs = Date.now() - startedAt;
  process.stdout.write(`${JSON.stringify(summary, null, 2)}\n`);
  process.exit(summary.ok ? 0 : 1);
}

await main();
