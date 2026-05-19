import { z } from "zod";
import { JsonlStore } from "./jsonl-store.js";
import { AtomicJsonStore } from "./atomic-json-store.js";
import {
  Signal,
  SignalSchema,
  SignalStatus,
  SignalStatusSchema,
  SuppressionEntry,
  SuppressionEntrySchema,
  SuppressionIndex,
  SuppressionIndexSchema,
} from "../../../domain/sentinel/signal/signal.js";
import {
  sentinelSignalsPath,
  sentinelSignalsIndexPath,
  sentinelSuppressionsPath,
} from "../../../domain/sentinel/paths.js";
import { withPathLock } from "../../../shared/path-mutex.js";

interface SignalIndexEntry {
  readonly id: string;
  readonly fingerprint: string;
  readonly status: SignalStatus;
  readonly priority: number;
  readonly updatedAt: string;
}

type SignalIndex = Record<string, SignalIndexEntry>;
type SignalIndexById = Record<string, string>;

interface SignalIndexFile {
  readonly byFingerprint: SignalIndex;
  readonly byId: SignalIndexById;
}

function emptyIndex(): SignalIndexFile {
  return { byFingerprint: {}, byId: {} };
}

const SignalIndexEntrySchema = z
  .object({
    id: z.string(),
    fingerprint: z.string(),
    status: SignalStatusSchema,
    priority: z.number(),
    updatedAt: z.string(),
  })
  .strict();

const SignalIndexFileSchema = z
  .object({
    byFingerprint: z.record(z.string(), SignalIndexEntrySchema),
    byId: z.record(z.string(), z.string()),
  })
  .strict();

function validateSignalIndex(raw: unknown): SignalIndexFile {
  return SignalIndexFileSchema.parse(raw);
}

function validateSuppressionIndex(raw: unknown): SuppressionIndex {
  return SuppressionIndexSchema.parse(raw);
}

export class SignalStore {
  private readonly journal: JsonlStore<Signal>;
  private readonly index: AtomicJsonStore<SignalIndexFile>;

  constructor(workspaceRoot: string) {
    this.journal = new JsonlStore<Signal>(sentinelSignalsPath(workspaceRoot));
    this.index = new AtomicJsonStore<SignalIndexFile>(
      sentinelSignalsIndexPath(workspaceRoot),
      () => emptyIndex(),
      { validate: validateSignalIndex },
    );
  }

  async upsert(signal: Signal): Promise<{ readonly created: boolean; readonly signal: Signal }> {
    return withPathLock(this.index.path, async () => {
      const validated = SignalSchema.parse(signal);
      const current = await this.index.read();
      const existingId = current.byFingerprint[validated.fingerprint]?.id;
      const created = existingId === undefined;
      const id = existingId ?? validated.id;
      const finalSignal: Signal = SignalSchema.parse({ ...validated, id });
      await this.journal.append(finalSignal);
      const entry: SignalIndexEntry = {
        id,
        fingerprint: finalSignal.fingerprint,
        status: finalSignal.status,
        priority: finalSignal.priority,
        updatedAt: finalSignal.updatedAt,
      };
      const next: SignalIndexFile = {
        byFingerprint: { ...current.byFingerprint, [finalSignal.fingerprint]: entry },
        byId: { ...current.byId, [id]: finalSignal.fingerprint },
      };
      await this.index.writeWithinLock(next);
      return { created, signal: finalSignal };
    });
  }

  async readAll(): Promise<readonly Signal[]> {
    const all = await this.journal.readAll();
    const indexFile = await this.index.read();
    const seen = new Set<string>();
    const latest: Signal[] = [];
    for (let i = all.length - 1; i >= 0; i -= 1) {
      const record = all[i]!;
      if (seen.has(record.id)) {
        continue;
      }
      seen.add(record.id);
      latest.unshift(record);
    }
    return latest.filter((signal) => indexFile.byId[signal.id] !== undefined);
  }

  async findById(id: string): Promise<Signal | null> {
    const all = await this.readAll();
    return all.find((signal) => signal.id === id) ?? null;
  }

  async findByFingerprint(fingerprint: string): Promise<Signal | null> {
    const indexFile = await this.index.read();
    const entry = indexFile.byFingerprint[fingerprint];
    if (entry === undefined) {
      return null;
    }
    return this.findById(entry.id);
  }
}

export class SuppressionStore {
  private readonly store: AtomicJsonStore<SuppressionIndex>;

  constructor(workspaceRoot: string) {
    this.store = new AtomicJsonStore<SuppressionIndex>(
      sentinelSuppressionsPath(workspaceRoot),
      () => ({}),
      { validate: validateSuppressionIndex },
    );
  }

  async list(): Promise<SuppressionIndex> {
    return this.store.read();
  }

  async add(entry: SuppressionEntry): Promise<void> {
    const validated = SuppressionEntrySchema.parse(entry);
    await this.store.update((current) => ({ ...current, [validated.signalId]: validated }));
  }

  async remove(signalId: string): Promise<void> {
    await this.store.update((current) => {
      const next: SuppressionIndex = { ...current };
      delete next[signalId];
      return next;
    });
  }

  isActive(entry: SuppressionEntry, now: number = Date.now()): boolean {
    if (entry.expiresAt === null) {
      return true;
    }
    const expiresAt = Date.parse(entry.expiresAt);
    if (Number.isNaN(expiresAt)) {
      return true;
    }
    return expiresAt > now;
  }
}
