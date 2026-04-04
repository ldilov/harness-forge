#!/usr/bin/env node
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

const args = process.argv.slice(2);
const getArg = (flag, fallback = undefined) => {
  const index = args.indexOf(flag);
  return index >= 0 ? args[index + 1] : fallback;
};

const workspace = path.resolve(getArg("--workspace", "."));
const homeFile = path.resolve(getArg("--home-file", path.join(os.homedir(), ".codex", "config.toml")));
const dryRun = args.includes("--dry-run");
const workspaceConfigPath = path.join(workspace, ".codex", "config.toml");
const markers = { start: "# >>> harness-forge managed block >>>", end: "# <<< harness-forge managed block <<<" };

const workspaceConfig = await fs.readFile(workspaceConfigPath, "utf8");
let existing = "";
try { existing = await fs.readFile(homeFile, "utf8"); } catch { existing = ""; }

const block = `${markers.start}
# source: ${workspaceConfigPath}
${workspaceConfig.trim()}
${markers.end}
`;
const esc = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
const pattern = new RegExp(`${esc(markers.start)}[\s\S]*?${esc(markers.end)}\n?`, "g");
const next = existing.match(pattern) ? existing.replace(pattern, block) : `${existing.trimEnd()}${existing.trim() ? "\n\n" : ""}${block}`;

if (dryRun) {
  process.stdout.write(next);
  process.exit(0);
}

await fs.mkdir(path.dirname(homeFile), { recursive: true });
await fs.writeFile(homeFile, next, "utf8");
process.stdout.write(`${homeFile}
`);
