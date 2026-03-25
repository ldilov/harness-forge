#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import crypto from "node:crypto";

const args = process.argv.slice(2);
const json = args.includes("--json");
const root = process.cwd();

function readOption(name, fallback) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] ?? fallback : fallback;
}

const event = {
  eventId: crypto.randomUUID(),
  eventType: readOption("--event-type", "manual-event"),
  recordedAt: new Date().toISOString(),
  workspaceId: readOption("--workspace-id", root),
  target: readOption("--target", "codex"),
  featureId: readOption("--feature-id", undefined),
  result: readOption("--result", "accepted"),
  artifacts: [],
  evidence: [],
  tags: []
};

const destination = path.join(root, ".hforge", "observability", "events.json");
let events = [];
try {
  events = JSON.parse(await fs.readFile(destination, "utf8"));
} catch {
  events = [];
}

events.push(event);
await fs.mkdir(path.dirname(destination), { recursive: true });
await fs.writeFile(destination, `${JSON.stringify(events, null, 2)}\n`, "utf8");

if (json) {
  console.log(JSON.stringify({ ok: true, destination, event }, null, 2));
} else {
  console.log(JSON.stringify({ ok: true, destination, event }, null, 2));
}
