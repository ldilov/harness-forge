import { parse as parseYaml } from "yaml";
import { exists, readTextFile } from "../../../shared/fs.js";
import {
  DEFAULT_DENIED_COMMANDS,
  DEFAULT_DENIED_PATHS,
  DeniedCommandsSchema,
  DeniedPathsSchema,
} from "../../../domain/sentinel/policy/denied.js";
import {
  sentinelDeniedCommandsPath,
  sentinelDeniedPathsPath,
} from "../../../domain/sentinel/paths.js";

export async function loadDeniedPaths(workspaceRoot: string): Promise<readonly string[]> {
  const filePath = sentinelDeniedPathsPath(workspaceRoot);
  if (!(await exists(filePath))) {
    return DEFAULT_DENIED_PATHS;
  }
  const raw = await readTextFile(filePath);
  const parsed = DeniedPathsSchema.parse(parseYaml(raw) ?? {});
  return parsed.deniedPaths.length > 0 ? parsed.deniedPaths : DEFAULT_DENIED_PATHS;
}

export async function loadDeniedCommands(workspaceRoot: string): Promise<readonly string[]> {
  const filePath = sentinelDeniedCommandsPath(workspaceRoot);
  if (!(await exists(filePath))) {
    return DEFAULT_DENIED_COMMANDS;
  }
  const raw = await readTextFile(filePath);
  const parsed = DeniedCommandsSchema.parse(parseYaml(raw) ?? {});
  return parsed.deniedCommands.length > 0 ? parsed.deniedCommands : DEFAULT_DENIED_COMMANDS;
}
