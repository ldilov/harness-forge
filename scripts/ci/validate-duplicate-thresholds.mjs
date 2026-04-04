import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const inventoryPath = path.join(root, "docs", "runtime", "examples", "duplicate-inventory.example.json");
const inventory = JSON.parse(await fs.readFile(inventoryPath, "utf8"));
const groups = inventory.duplicateGroups ?? [];

if (groups.length > 20) {
  console.error(JSON.stringify({ ok: false, reason: "duplicateGroups exceeds threshold", groups: groups.length }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, check: "duplicate-threshold", groups: groups.length }, null, 2));
