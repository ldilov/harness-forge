import path from "node:path";
import fs from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import {
  MonitorConfig,
  MonitorConfigSchema,
  parseIntervalSeconds,
} from "../../../domain/sentinel/monitor/monitor.js";
import { sentinelMonitorsDir } from "../../../domain/sentinel/paths.js";
import { exists } from "../../../shared/fs.js";
import type { CadenceConfig } from "../budget/budget-ledger.js";

export interface LoadedMonitor {
  readonly config: MonitorConfig;
  readonly intervalSeconds: number;
  readonly sourceFile: string;
  readonly warnings: readonly string[];
}

export interface RegistryLoadResult {
  readonly monitors: readonly LoadedMonitor[];
  readonly errors: readonly { readonly file: string; readonly message: string }[];
}

function applyCadenceFloor(intervalSeconds: number, cadence: CadenceConfig): { coerced: number; warning: string | null } {
  if (intervalSeconds < cadence.globalMinIntervalSeconds) {
    return {
      coerced: cadence.globalMinIntervalSeconds,
      warning: `interval ${intervalSeconds}s below globalMinIntervalSeconds ${cadence.globalMinIntervalSeconds}s; coerced up`,
    };
  }
  return { coerced: intervalSeconds, warning: null };
}

export async function loadMonitorRegistry(
  workspaceRoot: string,
  cadence: CadenceConfig,
): Promise<RegistryLoadResult> {
  const dir = sentinelMonitorsDir(workspaceRoot);
  if (!(await exists(dir))) {
    return { monitors: [], errors: [] };
  }
  const entries = await fs.readdir(dir);
  const yamlFiles = entries.filter((entry) => entry.endsWith(".yaml") || entry.endsWith(".yml"));
  const monitors: LoadedMonitor[] = [];
  const errors: { file: string; message: string }[] = [];
  for (const fileName of yamlFiles) {
    const filePath = path.join(dir, fileName);
    try {
      const raw = await fs.readFile(filePath, "utf8");
      const parsed = parseYaml(raw);
      const config = MonitorConfigSchema.parse(parsed);
      const intervalSeconds = parseIntervalSeconds(config.interval);
      const { coerced, warning } = applyCadenceFloor(intervalSeconds, cadence);
      monitors.push({
        config,
        intervalSeconds: coerced,
        sourceFile: filePath,
        warnings: warning === null ? [] : [warning],
      });
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : String(error);
      errors.push({ file: filePath, message });
    }
  }
  return { monitors, errors };
}

export function filterEnabledMonitors(monitors: readonly LoadedMonitor[]): readonly LoadedMonitor[] {
  return monitors.filter((monitor) => monitor.config.enabled);
}

export function findMonitorByKind(
  monitors: readonly LoadedMonitor[],
  kind: string,
): readonly LoadedMonitor[] {
  return monitors.filter(
    (monitor) =>
      monitor.config.id === kind ||
      monitor.config.source === kind ||
      monitor.config.id.startsWith(`${kind}-`),
  );
}
