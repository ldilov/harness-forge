import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const adapterPath = path.join(root, "docs", "runtime", "examples", "target-adapter.example.json");
const adapter = JSON.parse(await fs.readFile(adapterPath, "utf8"));
const allowed = new Set(["native", "bridged", "translated", "partial"]);

if (!allowed.has(adapter.supportMode)) {
  console.error(JSON.stringify({ ok: false, reason: "unsupported supportMode", supportMode: adapter.supportMode }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, check: "target-support-honesty", supportMode: adapter.supportMode }, null, 2));
