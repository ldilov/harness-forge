import { z } from "zod";
import { JsonlStore } from "./jsonl-store.js";
import { AtomicJsonStore } from "./atomic-json-store.js";
import {
  AgentRunStateSchema,
  WatchdogInterventionRecord,
  WatchdogInterventionRecordSchema,
  type AgentRunState,
} from "../../../domain/sentinel/watchdog/intervention.js";
import {
  sentinelWatchdogInterventionsPath,
  sentinelWatchdogRunsPath,
} from "../../../domain/sentinel/paths.js";

const RegistrySchema = z
  .object({
    runs: z.record(z.string(), AgentRunStateSchema).default({}),
  })
  .strict();
type Registry = z.infer<typeof RegistrySchema>;

function emptyRegistry(): Registry {
  return { runs: {} };
}

export class WatchdogInterventionStore {
  private readonly store: JsonlStore<WatchdogInterventionRecord>;

  constructor(workspaceRoot: string) {
    this.store = new JsonlStore<WatchdogInterventionRecord>(
      sentinelWatchdogInterventionsPath(workspaceRoot),
    );
  }

  async record(entry: WatchdogInterventionRecord): Promise<WatchdogInterventionRecord> {
    const validated = WatchdogInterventionRecordSchema.parse(entry);
    await this.store.append(validated);
    return validated;
  }

  async readAll(): Promise<readonly WatchdogInterventionRecord[]> {
    return this.store.readAll();
  }

  async tail(limit: number): Promise<readonly WatchdogInterventionRecord[]> {
    return this.store.tail(limit);
  }
}

export class AgentRunStateStore {
  private readonly store: AtomicJsonStore<Registry>;

  constructor(workspaceRoot: string) {
    this.store = new AtomicJsonStore<Registry>(
      sentinelWatchdogRunsPath(workspaceRoot),
      () => emptyRegistry(),
      { validate: (raw) => RegistrySchema.parse(raw) },
    );
  }

  async list(): Promise<readonly AgentRunState[]> {
    const file = await this.store.read();
    return Object.values(file.runs);
  }

  async get(runId: string): Promise<AgentRunState | null> {
    const file = await this.store.read();
    return file.runs[runId] ?? null;
  }

  async upsert(state: AgentRunState): Promise<AgentRunState> {
    const validated = AgentRunStateSchema.parse(state);
    await this.store.update((current) => ({
      runs: { ...current.runs, [validated.runId]: validated },
    }));
    return validated;
  }

  async remove(runId: string): Promise<void> {
    await this.store.update((current) => {
      const next = { ...current.runs };
      delete next[runId];
      return { runs: next };
    });
  }
}
