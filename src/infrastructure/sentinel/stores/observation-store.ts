import { JsonlStore } from "./jsonl-store.js";
import { AtomicJsonStore } from "./atomic-json-store.js";
import {
  FingerprintIndex,
  FingerprintIndexEntry,
  FingerprintIndexSchema,
  Observation,
  ObservationSchema,
  MonitorRunRecord,
  MonitorRunRecordSchema,
} from "../../../domain/sentinel/observation/observation.js";
import {
  sentinelFingerprintsPath,
  sentinelMonitorRunsPath,
  sentinelObservationsPath,
} from "../../../domain/sentinel/paths.js";
import { generateSentinelId } from "../../../shared/ulid.js";
import { nowISO } from "../../../shared/timestamps.js";
import { withPathLock } from "../../../shared/path-mutex.js";

export interface ObservationDraft {
  readonly source: string;
  readonly kind: string;
  readonly severity: Observation["severity"];
  readonly classifyKey?: string;
  readonly subject: string;
  readonly summary: string;
  readonly evidence: Observation["evidence"];
  readonly fingerprint: string;
  readonly confidence: number;
  readonly metadata?: Observation["metadata"];
}

export interface ObservationWriteResult {
  readonly observation: Observation;
  readonly deduped: boolean;
  readonly occurrenceCount: number;
}

export class ObservationStore {
  private readonly observations: JsonlStore<Observation>;
  private readonly fingerprints: AtomicJsonStore<FingerprintIndex>;

  constructor(workspaceRoot: string) {
    this.observations = new JsonlStore<Observation>(sentinelObservationsPath(workspaceRoot));
    this.fingerprints = new AtomicJsonStore<FingerprintIndex>(
      sentinelFingerprintsPath(workspaceRoot),
      () => ({}),
      { validate: (raw) => FingerprintIndexSchema.parse(raw) },
    );
  }

  async ingest(draft: ObservationDraft): Promise<ObservationWriteResult> {
    return withPathLock(this.fingerprints.path, async () => {
      const index = await this.fingerprints.read();
      const existing = index[draft.fingerprint];
      const now = nowISO();
      if (existing !== undefined) {
        const updatedEntry: FingerprintIndexEntry = {
          id: existing.id,
          fingerprint: existing.fingerprint,
          occurrenceCount: existing.occurrenceCount + 1,
          firstSeenAt: existing.firstSeenAt,
          lastSeenAt: now,
        };
        await this.fingerprints.writeWithinLock({ ...index, [draft.fingerprint]: updatedEntry });
        const reconstructed: Observation = ObservationSchema.parse({
          id: existing.id,
          source: draft.source,
          kind: draft.kind,
          severity: draft.severity,
          subject: draft.subject,
          summary: draft.summary,
          evidence: draft.evidence,
          detectedAt: existing.firstSeenAt,
          fingerprint: draft.fingerprint,
          confidence: draft.confidence,
          occurrenceCount: updatedEntry.occurrenceCount,
          firstSeenAt: existing.firstSeenAt,
          lastSeenAt: now,
          metadata: draft.metadata,
        });
        return { observation: reconstructed, deduped: true, occurrenceCount: updatedEntry.occurrenceCount };
      }

      const id = generateSentinelId("observation");
      const observation = ObservationSchema.parse({
        id,
        source: draft.source,
        kind: draft.kind,
        severity: draft.severity,
        subject: draft.subject,
        summary: draft.summary,
        evidence: draft.evidence,
        detectedAt: now,
        fingerprint: draft.fingerprint,
        confidence: draft.confidence,
        occurrenceCount: 1,
        firstSeenAt: now,
        lastSeenAt: now,
        metadata: draft.metadata,
      });
      await this.observations.append(observation);
      const newEntry: FingerprintIndexEntry = {
        id,
        fingerprint: draft.fingerprint,
        occurrenceCount: 1,
        firstSeenAt: now,
        lastSeenAt: now,
      };
      await this.fingerprints.writeWithinLock({ ...index, [draft.fingerprint]: newEntry });
      return { observation, deduped: false, occurrenceCount: 1 };
    });
  }

  async readAll(): Promise<readonly Observation[]> {
    return this.observations.readAll();
  }

  async tail(limit: number): Promise<readonly Observation[]> {
    return this.observations.tail(limit);
  }
}

export class MonitorRunsStore {
  private readonly store: JsonlStore<MonitorRunRecord>;

  constructor(workspaceRoot: string) {
    this.store = new JsonlStore<MonitorRunRecord>(sentinelMonitorRunsPath(workspaceRoot));
  }

  async record(record: MonitorRunRecord): Promise<void> {
    await this.store.append(MonitorRunRecordSchema.parse(record));
  }

  async tail(limit: number): Promise<readonly MonitorRunRecord[]> {
    return this.store.tail(limit);
  }
}
