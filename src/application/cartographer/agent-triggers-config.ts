import fs from "node:fs/promises";
import { parse as parseYaml } from "yaml";
import { z } from "zod";
import { exists } from "../../shared/fs.js";
import { cartographerAgentTriggersPath } from "../../domain/cartographer/paths.js";
import { autonomyLevelSchema, type AutonomyLevel } from "../../domain/cartographer/broker/hook-event.js";

const agentTriggersFileSchema = z.object({
  agentTriggers: z.object({
    enabled: z.boolean().default(true),
    autonomyLevel: autonomyLevelSchema.default("diagnostic"),
    defaultJson: z.boolean().default(true),
  }),
});

export interface AgentTriggersConfig {
  readonly enabled: boolean;
  readonly autonomyLevel: AutonomyLevel;
  readonly defaultJson: boolean;
}

const DEFAULT_CONFIG: AgentTriggersConfig = {
  enabled: true,
  autonomyLevel: "diagnostic",
  defaultJson: true,
};

export async function loadAgentTriggersConfig(workspaceRoot: string): Promise<AgentTriggersConfig> {
  const configPath = cartographerAgentTriggersPath(workspaceRoot);
  if (!(await exists(configPath))) {
    return DEFAULT_CONFIG;
  }
  try {
    const parsed = agentTriggersFileSchema.parse(parseYaml(await fs.readFile(configPath, "utf8")));
    return {
      enabled: parsed.agentTriggers.enabled,
      autonomyLevel: parsed.agentTriggers.autonomyLevel,
      defaultJson: parsed.agentTriggers.defaultJson,
    };
  } catch {
    return DEFAULT_CONFIG;
  }
}
