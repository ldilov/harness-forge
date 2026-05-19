import { z } from "zod";
import { JsonlStore } from "../../../infrastructure/sentinel/stores/jsonl-store.js";
import { sentinelCadenceLedgerPath } from "../../../domain/sentinel/paths.js";
import { nowISO } from "../../../shared/timestamps.js";

export const CadenceEntrySchema = z
  .object({
    at: z.string(),
    kind: z.enum([
      "monitor.run",
      "action.proposed",
      "action.executed",
      "llm.call",
      "external.request",
      "policy.decision",
      "budget.decision",
      "panic.toggle",
    ]),
    subject: z.string().optional(),
    detail: z.record(z.string(), z.unknown()).optional(),
  })
  .strict();
export type CadenceEntry = z.infer<typeof CadenceEntrySchema>;

export class CadenceLedger {
  private readonly store: JsonlStore<CadenceEntry>;

  constructor(workspaceRoot: string) {
    this.store = new JsonlStore<CadenceEntry>(sentinelCadenceLedgerPath(workspaceRoot));
  }

  async record(entry: Omit<CadenceEntry, "at"> & { at?: string }): Promise<void> {
    const validated = CadenceEntrySchema.parse({ at: entry.at ?? nowISO(), ...entry });
    await this.store.append(validated);
  }

  async tail(limit = 100): Promise<readonly CadenceEntry[]> {
    return this.store.tail(limit);
  }

  async countSince(kind: CadenceEntry["kind"], windowMs: number, now: number = Date.now()): Promise<number> {
    const entries = await this.store.readAll();
    const cutoff = now - windowMs;
    let count = 0;
    for (const entry of entries) {
      if (entry.kind !== kind) {
        continue;
      }
      const entryTime = Date.parse(entry.at);
      if (Number.isFinite(entryTime) && entryTime >= cutoff) {
        count += 1;
      }
    }
    return count;
  }
}
