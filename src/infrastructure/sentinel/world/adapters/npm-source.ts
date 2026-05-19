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

export const NPM_ADAPTER_KIND = "npm";

export interface NpmAdapterOptions {
  readonly packageName: string;
  readonly cache: WorldCache;
  readonly fetchImpl?: typeof policyFetch;
  readonly registry?: string;
}

interface NpmRegistryDocument {
  readonly name?: string;
  readonly "dist-tags"?: Record<string, string>;
  readonly versions?: Record<string, { readonly _npmUser?: { readonly name?: string } }>;
  readonly time?: Record<string, string>;
  readonly homepage?: string;
  readonly deprecated?: string;
}

function newestPublish(time: Record<string, string>): { version: string; publishedAt: string } | null {
  let best: { version: string; publishedAt: string } | null = null;
  for (const [version, when] of Object.entries(time)) {
    if (version === "modified" || version === "created") {
      continue;
    }
    if (best === null || Date.parse(when) > Date.parse(best.publishedAt)) {
      best = { version, publishedAt: when };
    }
  }
  return best;
}

function major(version: string): number {
  const segment = version.split(".")[0] ?? "0";
  return Number.parseInt(segment.replace(/[^0-9]/g, ""), 10) || 0;
}

export class NpmSourceAdapter implements WorldSourceAdapter {
  readonly kind = "npm" as const;
  readonly id: string;
  readonly subject: string;

  constructor(private readonly options: NpmAdapterOptions) {
    this.subject = options.packageName;
    this.id = `${NPM_ADAPTER_KIND}:${options.packageName}`;
  }

  private registryUrl(): string {
    const base = this.options.registry ?? "https://registry.npmjs.org";
    return `${base}/${encodeURIComponent(this.options.packageName)}`;
  }

  async fetchSince(context: FetchSinceContext): Promise<FetchSinceResult> {
    const cached = await this.options.cache.read(this.options.packageName);
    const fetchImpl = this.options.fetchImpl ?? policyFetch;
    const result = await fetchImpl({
      url: this.registryUrl(),
      userAgent: context.userAgent,
      mode: "package-registry-only",
      etag: cached?.etag ?? null,
      timeoutMs: 15_000,
    });
    if (result.notModified && cached !== null) {
      return { events: [], nextCursor: context.cursor, fromCache: true };
    }
    if (result.status >= 400) {
      throw new Error(`npm registry returned ${result.status} for ${this.options.packageName}`);
    }
    await this.options.cache.write(this.options.packageName, result.body, result.etag);
    let parsed: NpmRegistryDocument;
    try {
      parsed = JSON.parse(result.body) as NpmRegistryDocument;
    } catch (error: unknown) {
      throw new Error(`failed to parse npm response for ${this.options.packageName}: ${error instanceof Error ? error.message : String(error)}`);
    }
    const time = parsed.time ?? {};
    const newest = newestPublish(time);
    if (newest === null) {
      return { events: [], nextCursor: result.etag ?? null, fromCache: false };
    }
    const cursorVersion = context.cursor;
    if (cursorVersion === newest.version) {
      return { events: [], nextCursor: cursorVersion, fromCache: false };
    }
    const distTags = parsed["dist-tags"] ?? {};
    const events: WorldEvent[] = [];
    const event: WorldEvent = {
      source: this.id,
      kind: cursorVersion === null ? "npm.bootstrap" : "npm.release",
      subject: this.options.packageName,
      version: newest.version,
      url: `https://www.npmjs.com/package/${this.options.packageName}/v/${newest.version}`,
      publishedAt: newest.publishedAt,
      raw: {
        package: this.options.packageName,
        version: newest.version,
        previousVersion: cursorVersion,
        majorBump: cursorVersion !== null && major(newest.version) > major(cursorVersion),
        latestTag: distTags.latest ?? null,
        deprecated: parsed.deprecated ?? null,
      },
    };
    events.push(event);
    void context.maxEvents;
    return { events, nextCursor: newest.version, fromCache: false };
  }

  normalize(event: WorldEvent): ObservationDraft {
    const raw = event.raw as {
      readonly package: string;
      readonly version: string;
      readonly previousVersion: string | null;
      readonly majorBump: boolean;
      readonly deprecated?: string | null;
    };
    const baseSeverity = raw.deprecated !== null && raw.deprecated !== undefined
      ? "warning"
      : raw.majorBump
        ? "notice"
        : "info";
    const summary = raw.previousVersion === null
      ? `Captured baseline for npm package ${raw.package} at ${raw.version}.`
      : raw.deprecated !== null && raw.deprecated !== undefined
        ? `npm package ${raw.package} ${raw.version} is deprecated: ${raw.deprecated}`
        : raw.majorBump
          ? `npm package ${raw.package} released major ${raw.version} (was ${raw.previousVersion}).`
          : `npm package ${raw.package} released ${raw.version} (was ${raw.previousVersion}).`;
    const fingerprint = resolveFingerprint("npm:${package}:${version}", {
      subject: raw.package,
      metadata: { package: raw.package, version: raw.version },
    });
    return {
      source: this.id,
      kind: event.kind,
      severity: baseSeverity as ObservationDraft["severity"],
      classifyKey: raw.deprecated !== null && raw.deprecated !== undefined ? "deprecated" : raw.majorBump ? "major_release" : "default",
      subject: raw.package,
      summary,
      evidence: [
        { kind: "url", ref: event.url ?? `https://www.npmjs.com/package/${raw.package}` },
      ],
      fingerprint,
      confidence: 0.95,
      metadata: {
        package: raw.package,
        version: raw.version,
        previousVersion: raw.previousVersion,
        majorBump: raw.majorBump,
        publishedAt: event.publishedAt ?? null,
      },
    };
  }
}
