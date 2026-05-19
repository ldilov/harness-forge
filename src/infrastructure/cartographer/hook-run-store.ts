import fs from "node:fs/promises";
import { ensureDir, exists } from "../../shared/fs.js";
import { withPathLock } from "../../shared/path-mutex.js";
import {
  parseAgentHookRun,
  type AgentHookRun,
} from "../../domain/cartographer/broker/hook-run.js";
import {
  cartographerHooksDir,
  cartographerHookRunsPath,
  cartographerHookCachePath,
} from "../../domain/cartographer/paths.js";
import { redactSecrets } from "./store-safety.js";

interface CacheEntry {
  readonly runId: string;
  readonly at: string;
}

type FingerprintCache = Record<string, CacheEntry>;

const MAX_RUNS_RETAINED = 1000;
const MAX_CACHE_ENTRIES = 5000;

export class HookRunStore {
  constructor(private readonly workspaceRoot: string) {}

  async append(run: AgentHookRun): Promise<void> {
    const validated = parseAgentHookRun(run);
    const runsPath = cartographerHookRunsPath(this.workspaceRoot);
    await withPathLock(runsPath, async () => {
      await ensureDir(cartographerHooksDir(this.workspaceRoot));
      const line = `${redactSecrets(JSON.stringify(validated))}\n`;
      let existing = "";
      if (await exists(runsPath)) {
        existing = await fs.readFile(runsPath, "utf8");
      }
      const lines = existing.split(/\r?\n/).filter((entry) => entry.length > 0);
      lines.push(line.trimEnd());
      if (lines.length <= MAX_RUNS_RETAINED) {
        await fs.appendFile(runsPath, line, "utf8");
        return;
      }
      const retained = lines.slice(lines.length - MAX_RUNS_RETAINED);
      const tmp = `${runsPath}.${process.pid}.tmp`;
      await fs.writeFile(tmp, `${retained.join("\n")}\n`, "utf8");
      await fs.rename(tmp, runsPath);
    });
  }

  async recent(limit: number): Promise<readonly AgentHookRun[]> {
    const runsPath = cartographerHookRunsPath(this.workspaceRoot);
    if (!(await exists(runsPath))) {
      return [];
    }
    const lines = (await fs.readFile(runsPath, "utf8")).split(/\r?\n/).filter((line) => line.length > 0);
    const tail = lines.slice(Math.max(0, lines.length - limit));
    const runs: AgentHookRun[] = [];
    for (const line of tail) {
      try {
        runs.push(parseAgentHookRun(JSON.parse(line)));
      } catch {
        continue;
      }
    }
    return runs;
  }

  async lookupFingerprint(fingerprint: string, cooldownMs: number): Promise<CacheEntry | null> {
    const cachePath = cartographerHookCachePath(this.workspaceRoot);
    return withPathLock(cachePath, async () => {
      if (!(await exists(cachePath))) {
        return null;
      }
      try {
        const cache = JSON.parse(await fs.readFile(cachePath, "utf8")) as FingerprintCache;
        const entry = cache[fingerprint];
        if (entry === undefined) {
          return null;
        }
        const age = Date.now() - Date.parse(entry.at);
        return Number.isFinite(age) && age >= 0 && age <= cooldownMs ? entry : null;
      } catch {
        return null;
      }
    });
  }

  async recordFingerprint(
    fingerprint: string,
    runId: string,
    at: string,
    cooldownMs: number,
  ): Promise<void> {
    const cachePath = cartographerHookCachePath(this.workspaceRoot);
    await withPathLock(cachePath, async () => {
      await ensureDir(cartographerHooksDir(this.workspaceRoot));
      let cache: FingerprintCache = {};
      if (await exists(cachePath)) {
        try {
          cache = JSON.parse(await fs.readFile(cachePath, "utf8")) as FingerprintCache;
        } catch {
          cache = {};
        }
      }
      const now = Date.now();
      const pruned: FingerprintCache = {};
      for (const [key, value] of Object.entries(cache)) {
        const age = now - Date.parse(value.at);
        if (Number.isFinite(age) && age >= 0 && age <= cooldownMs) {
          pruned[key] = value;
        }
      }
      pruned[fingerprint] = { runId, at };
      const entries = Object.entries(pruned);
      const capped =
        entries.length > MAX_CACHE_ENTRIES
          ? Object.fromEntries(entries.slice(entries.length - MAX_CACHE_ENTRIES))
          : pruned;
      const tmp = `${cachePath}.${process.pid}.tmp`;
      await fs.writeFile(tmp, `${JSON.stringify(capped, null, 2)}\n`, "utf8");
      await fs.rename(tmp, cachePath);
    });
  }
}
