import type { Observation } from "../../../domain/sentinel/observation/observation.js";
import type { Severity } from "../../../domain/sentinel/monitor/monitor.js";
import type { Signal, SignalCategory } from "../../../domain/sentinel/signal/signal.js";
import type { SignalStore } from "../../../infrastructure/sentinel/stores/signal-store.js";
import { computePriority } from "../../../domain/sentinel/signal/priority.js";
import { generateSentinelId } from "../../../shared/ulid.js";
import { nowISO } from "../../../shared/timestamps.js";
import { shortHash } from "../../../shared/sha256.js";

const PROMOTABLE: ReadonlySet<Severity> = new Set<Severity>(["notice", "warning", "critical"]);

function categoryOf(observation: Observation): SignalCategory {
  if (observation.kind.startsWith("agent.")) {
    return "agent-health";
  }
  if (observation.kind.startsWith("ci.")) {
    return "regression";
  }
  if (observation.kind.startsWith("security.")) {
    return "security";
  }
  if (observation.kind.startsWith("decision.") || observation.kind.startsWith("adr.")) {
    return "stale-decision";
  }
  if (observation.kind.startsWith("drift.")) {
    return "maintenance";
  }
  if (observation.kind.startsWith("npm.") || observation.kind.startsWith("runtime.")) {
    return "maintenance";
  }
  return "opportunity";
}

export function isWorldObservationSource(source: string): boolean {
  return (
    source.startsWith("npm:") ||
    source.startsWith("runtime:") ||
    source.startsWith("github:")
  );
}

function recommendedIntentFor(category: SignalCategory): string | undefined {
  switch (category) {
    case "maintenance":
      return "refresh-harness-runtime";
    case "regression":
      return "diagnose-ci-failure";
    case "security":
      return "dependency-upgrade-simulation";
    case "agent-health":
      return "agent-loop-recovery";
    case "stale-decision":
      return "adr-update-draft";
    default:
      return undefined;
  }
}

function signalFingerprint(observation: Observation, category: SignalCategory): string {
  return shortHash(`${category}:${observation.fingerprint}`, 16);
}

export interface CorrelationOutcome {
  readonly created: readonly Signal[];
  readonly updated: readonly Signal[];
  readonly skipped: number;
}

export class SignalCorrelator {
  constructor(private readonly signals: SignalStore) {}

  async correlate(observations: readonly Observation[], now: number = Date.now()): Promise<CorrelationOutcome> {
    const created: Signal[] = [];
    const updated: Signal[] = [];
    let skipped = 0;
    for (const observation of observations) {
      if (!PROMOTABLE.has(observation.severity)) {
        skipped += 1;
        continue;
      }
      const category = categoryOf(observation);
      const fingerprint = signalFingerprint(observation, category);
      const detectedAt = Date.parse(observation.detectedAt);
      const ageMs = Number.isFinite(detectedAt) ? Math.max(0, now - detectedAt) : 0;
      const priority = computePriority({
        severity: observation.severity,
        confidence: observation.confidence,
        occurrenceCount: observation.occurrenceCount ?? 1,
        ageMs,
      });
      const intent = recommendedIntentFor(category);
      const existing = await this.signals.findByFingerprint(fingerprint);
      const draft: Signal = {
        id: existing?.id ?? generateSentinelId("signal"),
        observationIds: [observation.id],
        category,
        title: observation.subject,
        summary: observation.summary,
        priority,
        severity: observation.severity,
        ...(intent === undefined ? {} : { recommendedIntent: intent }),
        confidence: observation.confidence,
        createdAt: existing?.createdAt ?? observation.firstSeenAt ?? observation.detectedAt,
        updatedAt: nowISO(),
        status: existing?.status ?? "open",
        fingerprint,
      };
      const result = await this.signals.upsert(draft);
      if (result.created) {
        created.push(result.signal);
      } else {
        updated.push(result.signal);
      }
    }
    return { created, updated, skipped };
  }
}
