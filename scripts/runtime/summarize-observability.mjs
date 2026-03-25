#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const json = args.includes("--json");
const root = process.cwd();
const eventsPath = path.join(root, ".hforge", "observability", "events.json");
const effectivenessPath = path.join(root, ".hforge", "observability", "effectiveness-signals.json");
const summaryPath = path.join(root, ".hforge", "observability", "summary.json");

async function readJson(targetPath, fallback) {
  try {
    return JSON.parse(await fs.readFile(targetPath, "utf8"));
  } catch {
    return fallback;
  }
}

const [events, effectivenessSignals] = await Promise.all([
  readJson(eventsPath, []),
  readJson(effectivenessPath, [])
]);

const byEventType = {};
const byResult = {};
for (const event of events) {
  byEventType[event.eventType] = (byEventType[event.eventType] ?? 0) + 1;
  byResult[event.result] = (byResult[event.result] ?? 0) + 1;
}

const accepted = (byResult.accepted ?? 0) + (byResult.success ?? 0);
const rejected = (byResult.rejected ?? 0) + (byResult.failed ?? 0) + (byResult.blocked ?? 0);
const benchmarkSignals = effectivenessSignals.filter((signal) => String(signal.signalType ?? "").includes("benchmark"));
const benchmarkPasses = benchmarkSignals.filter((signal) => signal.result === "success").length;

const summary = {
  generatedAt: new Date().toISOString(),
  totalEvents: events.length,
  byEventType,
  byResult,
  recommendationAcceptanceRate: accepted + rejected > 0 ? Number((accepted / (accepted + rejected)).toFixed(2)) : undefined,
  benchmarkPassRate:
    benchmarkSignals.length > 0 ? Number((benchmarkPasses / benchmarkSignals.length).toFixed(2)) : undefined,
  driftFindings: events
    .filter((event) => event.eventType === "capability-drift" || event.result === "blocked")
    .map((event) => `${event.eventType}:${event.result}`)
};

await fs.mkdir(path.dirname(summaryPath), { recursive: true });
await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

if (json) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(JSON.stringify(summary, null, 2));
}
