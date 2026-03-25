#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const summaryPath = path.join(root, ".hforge", "observability", "summary.json");

let summary;
try {
  summary = JSON.parse(await fs.readFile(summaryPath, "utf8"));
} catch {
  summary = {
    generatedAt: new Date().toISOString(),
    totalEvents: 0,
    byEventType: {},
    byResult: {},
    driftFindings: []
  };
}

const lines = [
  "# Observability Report",
  "",
  `Generated: ${summary.generatedAt}`,
  `Total events: ${summary.totalEvents}`,
  `Acceptance rate: ${summary.recommendationAcceptanceRate ?? "n/a"}`,
  `Benchmark pass rate: ${summary.benchmarkPassRate ?? "n/a"}`,
  "",
  "## Event types"
];

for (const [eventType, count] of Object.entries(summary.byEventType ?? {})) {
  lines.push(`- ${eventType}: ${count}`);
}

lines.push("", "## Results");
for (const [result, count] of Object.entries(summary.byResult ?? {})) {
  lines.push(`- ${result}: ${count}`);
}

lines.push("", "## Drift findings");
if ((summary.driftFindings ?? []).length === 0) {
  lines.push("- none");
} else {
  for (const finding of summary.driftFindings) {
    lines.push(`- ${finding}`);
  }
}

console.log(lines.join("\n"));
