import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const outputPath = path.join(root, "docs", "runtime", "examples", "output-policy.example.json");
const output = JSON.parse(await fs.readFile(outputPath, "utf8"));
const defaults = output.defaults ?? {};
const ok = defaults.topLevelHuman && defaults.recursiveWorker && defaults.releaseSignoff;

if (!ok) {
  console.error(JSON.stringify({ ok: false, reason: "output policy defaults are incomplete" }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, check: "output-profile-coverage", defaults }, null, 2));
