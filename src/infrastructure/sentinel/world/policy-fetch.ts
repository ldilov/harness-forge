export type NetworkPolicyMode = "none" | "package-registry-only" | "github-only" | "allowlist" | "unrestricted";

export interface PolicyFetchOptions {
  readonly url: string;
  readonly userAgent: string;
  readonly mode: NetworkPolicyMode;
  readonly allowlist?: readonly string[];
  readonly etag?: string | null;
  readonly lastModified?: string | null;
  readonly timeoutMs?: number;
  readonly maxBytes?: number;
}

export class NetworkBlockedError extends Error {
  constructor(readonly url: string, readonly reason: string) {
    super(`network blocked: ${url} — ${reason}`);
    this.name = "NetworkBlockedError";
  }
}

export class ResponseTooLargeError extends Error {
  constructor(readonly url: string, readonly limitBytes: number) {
    super(`response from ${url} exceeded max ${limitBytes} bytes`);
    this.name = "ResponseTooLargeError";
  }
}

const DEFAULT_MAX_BYTES = 5 * 1024 * 1024;

export interface PolicyFetchResult {
  readonly status: number;
  readonly notModified: boolean;
  readonly body: string;
  readonly etag: string | null;
  readonly lastModified: string | null;
}

const NPM_HOSTS: ReadonlySet<string> = new Set(["registry.npmjs.org", "registry.npmjs.com"]);
const GITHUB_HOSTS: ReadonlySet<string> = new Set(["api.github.com", "github.com"]);
const RUNTIME_HOSTS: ReadonlySet<string> = new Set(["nodejs.org", "raw.githubusercontent.com"]);

function isOriginAllowed(url: URL, mode: NetworkPolicyMode, allowlist: readonly string[] | undefined): boolean {
  switch (mode) {
    case "none":
      return false;
    case "unrestricted":
      return true;
    case "package-registry-only":
      return NPM_HOSTS.has(url.hostname);
    case "github-only":
      return GITHUB_HOSTS.has(url.hostname);
    case "allowlist":
      if (allowlist === undefined) {
        return false;
      }
      return allowlist.some((entry) => url.hostname === entry || url.hostname.endsWith(`.${entry}`));
    default:
      return false;
  }
}

export function isHostBuiltInTrusted(url: URL): boolean {
  return NPM_HOSTS.has(url.hostname) || RUNTIME_HOSTS.has(url.hostname) || GITHUB_HOSTS.has(url.hostname);
}

export async function policyFetch(options: PolicyFetchOptions): Promise<PolicyFetchResult> {
  const parsed = new URL(options.url);
  if (!isOriginAllowed(parsed, options.mode, options.allowlist)) {
    throw new NetworkBlockedError(options.url, `origin '${parsed.hostname}' not allowed under mode '${options.mode}'`);
  }
  const headers: Record<string, string> = {
    "User-Agent": options.userAgent,
    Accept: "application/json",
  };
  if (options.etag !== null && options.etag !== undefined) {
    headers["If-None-Match"] = options.etag;
  }
  if (options.lastModified !== null && options.lastModified !== undefined) {
    headers["If-Modified-Since"] = options.lastModified;
  }
  const controller = new AbortController();
  const timeoutMs = options.timeoutMs ?? 15_000;
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await globalThis.fetch(options.url, {
      method: "GET",
      headers,
      signal: controller.signal,
    });
    if (response.status === 304) {
      return {
        status: 304,
        notModified: true,
        body: "",
        etag: options.etag ?? null,
        lastModified: options.lastModified ?? null,
      };
    }
    const limitBytes = options.maxBytes ?? DEFAULT_MAX_BYTES;
    const declaredLength = response.headers.get("content-length");
    if (declaredLength !== null) {
      const declared = Number.parseInt(declaredLength, 10);
      if (Number.isFinite(declared) && declared > limitBytes) {
        throw new ResponseTooLargeError(options.url, limitBytes);
      }
    }
    const body = await readBoundedBody(response, options.url, limitBytes);
    return {
      status: response.status,
      notModified: false,
      body,
      etag: response.headers.get("etag"),
      lastModified: response.headers.get("last-modified"),
    };
  } finally {
    clearTimeout(timeout);
  }
}

async function readBoundedBody(response: Response, url: string, limitBytes: number): Promise<string> {
  const reader = response.body?.getReader();
  if (reader === undefined) {
    const fallback = await response.text();
    if (fallback.length > limitBytes) {
      throw new ResponseTooLargeError(url, limitBytes);
    }
    return fallback;
  }
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { value, done } = await reader.read();
    if (done) {
      break;
    }
    if (value === undefined) {
      continue;
    }
    total += value.byteLength;
    if (total > limitBytes) {
      await reader.cancel().catch(() => undefined);
      throw new ResponseTooLargeError(url, limitBytes);
    }
    chunks.push(value);
  }
  const buffer = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    buffer.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return new TextDecoder("utf-8").decode(buffer);
}
