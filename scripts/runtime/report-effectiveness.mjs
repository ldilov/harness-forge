#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";

const args = process.argv.slice(2);
const json = args.includes("--json");
const root = path.resolve(args.find((value) => !value.startsWith("--")) ?? ".");
const filePath = path.join(root, ".hforge", "observability", "effectiveness-signals.json");

let signals = [];
try {
  signals = JSON.parse(await fs.readFile(filePath, "utf8"));
} catch {
  signals = [];
}

const bySignalType = {};
const byResult = {};
for (const signal of signals) {
  bySignalType[signal.signalType] = (bySignalType[signal.signalType] ?? 0) + 1;
  byResult[signal.result] = (byResult[signal.result] ?? 0) + 1;
}

const summary = {
  total: signals.length,
  bySignalType,
  byResult,
  latest: signals[signals.length - 1] ?? null
};

if (json) {
  console.log(JSON.stringify(summary, null, 2));
} else {
  console.log(JSON.stringify(summary, null, 2));
}
