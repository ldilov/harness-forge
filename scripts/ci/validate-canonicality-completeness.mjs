import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const authorityPath = path.join(root, "schemas", "runtime", "authority-map.schema.json");
const content = JSON.parse(await fs.readFile(authorityPath, "utf8"));
const hasCanonicalPath = JSON.stringify(content).includes("canonicalPath");

if (!hasCanonicalPath) {
  console.error(JSON.stringify({ ok: false, reason: "authority-map schema is missing canonicalPath" }, null, 2));
  process.exit(1);
}

console.log(JSON.stringify({ ok: true, check: "canonicality-completeness" }, null, 2));
