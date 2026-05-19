import { resolveFingerprint } from "../../../../domain/sentinel/observation/fingerprint.js";
import type { ObservationDraft } from "../../stores/observation-store.js";
import type {
  FetchSinceContext,
  FetchSinceResult,
  WorldSourceAdapter,
} from "../../../../domain/sentinel/world/world-source-adapter.js";
import type { WorldEvent } from "../../../../domain/sentinel/world/world-event.js";
import { policyFetch } from "../policy-fetch.js";
import { WorldCache } from "../../stores/world-store.js";

export const RUNTIME_LTS_ADAPTER_KIND = "runtime";
const NODE_SCHEDULE_URL = "https://raw.githubusercontent.com/nodejs/Release/main/schedule.json";

export interface RuntimeLtsAdapterOptions {
  readonly runtime: string;
  readonly cache: WorldCache;
  readonly fetchImpl?: typeof policyFetch;
  readonly now?: () => Date;
}

interface NodeScheduleEntry {
  readonly start?: string;
  readonly lts?: string;
  readonly maintenance?: string;
  readonly end?: string;
  readonly codename?: string;
}

type NodeSchedule = Record<string, NodeScheduleEntry>;

interface LifecyclePhase {
  readonly major: string;
  readonly phase: "current" | "active-lts" | "maintenance" | "end-of-life";
  readonly until: string;
}

function classifyPhase(major: string, entry: NodeScheduleEntry, now: Date): LifecyclePhase {
  const start = entry.start === undefined ? null : Date.parse(entry.start);
  const lts = entry.lts === undefined ? null : Date.parse(entry.lts);
  const maintenance = entry.maintenance === undefined ? null : Date.parse(entry.maintenance);
  const end = entry.end === undefined ? null : Date.parse(entry.end);
  const ts = now.getTime();
  if (end !== null && ts >= end) {
    return { major, phase: "end-of-life", until: entry.end ?? "" };
  }
  if (maintenance !== null && ts >= maintenance) {
    return { major, phase: "maintenance", until: entry.end ?? "" };
  }
  if (lts !== null && ts >= lts) {
    return { major, phase: "active-lts", until: entry.maintenance ?? entry.end ?? "" };
  }
  if (start !== null && ts >= start) {
    return { major, phase: "current", until: entry.lts ?? entry.maintenance ?? entry.end ?? "" };
  }
  return { major, phase: "current", until: entry.start ?? "" };
}

function activeMajors(schedule: NodeSchedule, now: Date): readonly LifecyclePhase[] {
  const phases: LifecyclePhase[] = [];
  for (const [major, entry] of Object.entries(schedule)) {
    const phase = classifyPhase(major, entry, now);
    if (phase.phase !== "end-of-life") {
      phases.push(phase);
    }
  }
  return phases;
}

export class RuntimeLtsSourceAdapter implements WorldSourceAdapter {
  readonly kind = "runtime" as const;
  readonly id: string;
  readonly subject: string;

  constructor(private readonly options: RuntimeLtsAdapterOptions) {
    this.subject = options.runtime;
    this.id = `${RUNTIME_LTS_ADAPTER_KIND}:${options.runtime}`;
  }

  async fetchSince(context: FetchSinceContext): Promise<FetchSinceResult> {
    if (this.options.runtime !== "nodejs:lts" && this.options.runtime !== "nodejs") {
      return { events: [], nextCursor: context.cursor, fromCache: true };
    }
    const cached = await this.options.cache.read("nodejs-schedule");
    const fetchImpl = this.options.fetchImpl ?? policyFetch;
    const result = await fetchImpl({
      url: NODE_SCHEDULE_URL,
      userAgent: context.userAgent,
      mode: "allowlist",
      allowlist: ["raw.githubusercontent.com"],
      etag: cached?.etag ?? null,
      timeoutMs: 15_000,
    });
    if (result.notModified && cached !== null) {
      return { events: [], nextCursor: context.cursor, fromCache: true };
    }
    if (result.status >= 400) {
      throw new Error(`Node.js schedule fetch returned ${result.status}`);
    }
    await this.options.cache.write("nodejs-schedule", result.body, result.etag);
    let schedule: NodeSchedule;
    try {
      schedule = JSON.parse(result.body) as NodeSchedule;
    } catch (error: unknown) {
      throw new Error(`failed to parse Node.js schedule: ${error instanceof Error ? error.message : String(error)}`);
    }
    const now = (this.options.now ?? (() => new Date()))();
    const actives = activeMajors(schedule, now);
    const cursor = context.cursor;
    const fingerprintForCursor = actives
      .map((phase) => `${phase.major}=${phase.phase}`)
      .sort()
      .join(",");
    if (cursor === fingerprintForCursor) {
      return { events: [], nextCursor: cursor, fromCache: false };
    }
    const events: WorldEvent[] = actives.map((phase) => ({
      source: this.id,
      kind: phase.phase === "maintenance" ? "runtime.maintenance" : "runtime.lifecycle",
      subject: `nodejs:${phase.major}`,
      version: phase.major,
      publishedAt: phase.until.length > 0 ? phase.until : undefined,
      url: "https://nodejs.org/en/about/previous-releases",
      raw: { major: phase.major, phase: phase.phase, until: phase.until },
    }));
    return { events, nextCursor: fingerprintForCursor, fromCache: false };
  }

  normalize(event: WorldEvent): ObservationDraft {
    const raw = event.raw as { readonly major: string; readonly phase: LifecyclePhase["phase"]; readonly until: string };
    const severity: ObservationDraft["severity"] =
      raw.phase === "maintenance" ? "notice" : raw.phase === "active-lts" ? "info" : "info";
    const fingerprint = resolveFingerprint("runtime:${runtime}:${major}:${phase}", {
      subject: this.subject,
      metadata: { runtime: this.subject, major: raw.major, phase: raw.phase },
    });
    return {
      source: this.id,
      kind: event.kind,
      severity,
      classifyKey: raw.phase === "maintenance" ? "maintenance" : "default",
      subject: `Node.js ${raw.major} (${raw.phase})`,
      summary:
        raw.phase === "maintenance"
          ? `Node.js ${raw.major} is in maintenance phase${raw.until.length === 0 ? "" : ` until ${raw.until}`}.`
          : `Node.js ${raw.major} is ${raw.phase}${raw.until.length === 0 ? "" : ` until ${raw.until}`}.`,
      evidence: [{ kind: "url", ref: event.url ?? "https://nodejs.org/en/about/previous-releases" }],
      fingerprint,
      confidence: 1,
      metadata: { major: raw.major, phase: raw.phase, until: raw.until },
    };
  }
}
