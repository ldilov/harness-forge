#!/usr/bin/env node
function arg(name, fallback = "") {
  const idx = process.argv.indexOf(`--${name}`);
  if (idx >= 0 && idx + 1 < process.argv.length) {
    return process.argv[idx + 1];
  }
  return fallback;
}

function hasFlag(name) {
  return process.argv.includes(`--${name}`);
}

function q(value) {
  return `"${String(value || "").replace(/"/g, '\\"')}"`;
}

function rec(command, reason, autoExecutable = true) {
  return { command, reason, autoExecutable };
}

function buildPlan(event, goal, files, hforge) {
  const recs = [];
  if (event === "task.started") {
    recs.push(rec(`${hforge} graph build --if-stale`, "Keep project graph fresh."));
    recs.push(rec(`${hforge} context compile --goal ${q(goal)}`, "Produce focused task context."));
  } else if (event === "task.context_needed") {
    recs.push(rec(`${hforge} context compile --goal ${q(goal)}`, "Agent requested focused context."));
  } else if (event === "files.pre_edit" || event === "files.changed") {
    recs.push(rec(`${hforge} impact --files ${q(files)} --json`, "Estimate change impact."));
  } else if (event === "command.failed" || event === "tests.failed") {
    recs.push(rec(`${hforge} impact --files ${q(files)} --json`, "Link failure to impacted modules."));
  } else if (event === "pr.prep" || event === "task.completed") {
    recs.push(rec(`${hforge} impact --changed --json`, "Summarize changed-file impact."));
  } else {
    recs.push(rec(`${hforge} context compile --goal ${q(goal || event)}`, "Fallback context.", false));
  }
  return recs;
}

const event = arg("event", "task.started");
const goal = arg("goal", "");
const files = arg("files", "");
const asJson = hasFlag("json");
const hforge = process.env.HFORGE_BIN || "hforge";
const recommendedCommands = buildPlan(event, goal, files, hforge);
const diagnostics = hasFlag("execute")
  ? ["this helper never executes commands; run 'hforge agent hook --execute' for in-process diagnostic execution"]
  : [];
const payload = {
  event,
  mode: "dry-run",
  recommendedCommands,
  executedCommands: [],
  diagnostics,
  nextAction: "review the plan, then call 'hforge agent hook' for execution and audit",
};

if (asJson) {
  process.stdout.write(`${JSON.stringify(payload, null, 2)}\n`);
} else {
  process.stdout.write(`Event: ${event}\nMode: dry-run\nRecommended commands:\n`);
  for (const item of recommendedCommands) {
    process.stdout.write(`- ${item.command}\n  reason: ${item.reason}\n`);
  }
}
