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

/** @param {number} count */
function deriveConfidence(count) {
  if (count > 5) return "direct";
  if (count > 2) return "inferred-high";
  if (count > 0) return "inferred-medium";
  return "inferred-low";
}

const dimensionRules = [
  { dimensionId: "repoUnderstanding", match: (s) => s.category === "install" || /scan|cartograph|recommend/i.test(s.signalType ?? "") },
  { dimensionId: "targetCorrectness", match: (s) => /target/i.test(s.signalType ?? "") || s.category === "install" },
  { dimensionId: "runtimeAdoption", match: (s) => s.category === "runtimeUsage" },
  { dimensionId: "maintenanceHygiene", match: (s) => s.category === "maintenance" },
  { dimensionId: "workContinuity", match: (s) => s.category === "recursive" || s.category === "handoff" },
  { dimensionId: "recommendationFollowThrough", match: (s) => s.category === "guidance" && (s.result === "accepted" || s.result === "success") }
];

const dimensionScores = dimensionRules.map((rule) => {
  const matched = effectivenessSignals.filter(rule.match);
  const signalCount = matched.length;
  return {
    dimensionId: rule.dimensionId,
    score: Math.min(100, signalCount * 15),
    evidence: matched.slice(0, 5).map((s) => `${s.signalType}:${s.result}`),
    confidenceLevel: deriveConfidence(signalCount),
    signalCount
  };
});

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
    .map((event) => `${event.eventType}:${event.result}`),
  dimensionScores
};

await fs.mkdir(path.dirname(summaryPath), { recursive: true });
await fs.writeFile(summaryPath, `${JSON.stringify(summary, null, 2)}\n`, "utf8");

if (json) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(JSON.stringify(summary, null, 2));
}
