import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const budgetPath = path.join(root, "docs", "runtime", "examples", "context-budget.example.json");
const budget = JSON.parse(await fs.readFile(budgetPath, "utf8"));
const max = Number(budget.maxFirstHopTokens ?? 0);

if (!Number.isFinite(max) || max <= 0 || max > 12000) {
  console.error(JSON.stringify({ ok: false, reason: "maxFirstHopTokens must be > 0 and <= 12000", value: max }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, check: "hot-path-budget", maxFirstHopTokens: max }, null, 2));
