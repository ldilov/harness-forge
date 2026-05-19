#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const REPO_ROOT = path.resolve(__dirname, "..", "..");

const PROJECT_PATHS_TO_SCAN = [
  "src/domain/cartographer",
  "src/application/cartographer",
  "src/infrastructure/cartographer",
  "src/cli/commands/graph.ts",
  "src/cli/commands/context.ts",
  "src/cli/commands/impact.ts",
  "src/cli/commands/agent-hook.ts",
  "src/cli/commands/explain.ts",
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
            content: line.trim(),
          });
        }
      }
    }
  }
  return offenders;
}

async function validateSchemas() {
  const errors = [];
  try {
    const graphUrl = pathToFileURL(
      path.join(REPO_ROOT, "dist/domain/cartographer/graph/project-graph.js"),
    ).href;
    const mod = await import(graphUrl);
    const sample = {
      schemaVersion: 1,
      version: "graph-validate",
      root: "/repo",
      createdAt: new Date().toISOString(),
      builderVersion: "cartographer-1.0.0",
      nodes: [],
      edges: [],
      diagnostics: [],
    };
    mod.parseProjectGraph(sample);
    const bad = mod.projectGraphSchema.safeParse({ schemaVersion: 2 });
    if (bad.success) {
      errors.push("projectGraphSchema accepted an invalid schemaVersion");
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  try {
    const explainUrl = pathToFileURL(
      path.join(REPO_ROOT, "dist/domain/cartographer/explain/explanation.js"),
    ).href;
    const mod = await import(explainUrl);
    for (const kind of ["impact", "context", "diff", "pr-narrative", "pr-checklist"]) {
      mod.parseExplanation({
        schemaVersion: 1,
        id: "sum_validate",
        kind,
        createdAt: new Date().toISOString(),
        subject: "validate",
        summary: "validate",
        sections: [],
        sourceRefs: [],
      });
    }
    const badKind = mod.explanationSchema.safeParse({
      schemaVersion: 1,
      id: "x",
      kind: "bogus",
      createdAt: "t",
      subject: "s",
      summary: "s",
    });
    const badLine = mod.explanationSchema.safeParse({
      schemaVersion: 1,
      id: "x",
      kind: "impact",
      createdAt: "t",
      subject: "line1\nline2",
      summary: "s",
    });
    if (badKind.success) {
      errors.push("explanationSchema accepted an invalid kind");
    }
    if (badLine.success) {
      errors.push("explanationSchema accepted a multi-line subject");
    }
  } catch (error) {
    errors.push(error instanceof Error ? error.message : String(error));
  }
  return errors;
}

async function main() {
  const startedAt = Date.now();
  const summary = { ok: true, checks: {} };

  const schemaErrors = await validateSchemas();
  summary.checks.schemas = {
    status: schemaErrors.length === 0 ? "passed" : "failed",
    errors: schemaErrors,
  };
  if (schemaErrors.length > 0) {
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
