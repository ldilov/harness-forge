import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const bridgePath = path.join(root, "AGENTS.md");
const content = await fs.readFile(bridgePath, "utf8");
const tokenEstimate = Math.max(1, Math.round(content.split(/\s+/).filter(Boolean).length * 1.33));

if (tokenEstimate > 12000) {
  console.error(JSON.stringify({ ok: false, reason: "AGENTS.md exceeds token budget", tokenEstimate }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, check: "bridge-size", tokenEstimate }, null, 2));
