import { randomBytes } from "node:crypto";

const CROCKFORD = "0123456789ABCDEFGHJKMNPQRSTVWXYZ";
const TIME_LEN = 10;
const RANDOM_LEN = 16;

const SENTINEL_PREFIXES = {
  observation: "obs_",
  signal: "sig_",
  action: "act_",
  approval: "apr_",
  effect: "eff_",
  worldEvent: "we_",
  cadence: "cad_",
  monitorRun: "mrn_",
} as const;

export type SentinelIdKind = keyof typeof SENTINEL_PREFIXES;

function encodeTime(now: number): string {
  let value = now;
  const out = new Array<string>(TIME_LEN);
  for (let i = TIME_LEN - 1; i >= 0; i -= 1) {
    out[i] = CROCKFORD[value % 32]!;
    value = Math.floor(value / 32);
  }
  return out.join("");
}

function encodeRandom(): string {
  const bytes = randomBytes(RANDOM_LEN);
  let out = "";
  for (let i = 0; i < RANDOM_LEN; i += 1) {
    out += CROCKFORD[bytes[i]! % 32];
  }
  return out;
}

export function ulid(now: number = Date.now()): string {
  return `${encodeTime(now)}${encodeRandom()}`;
}

export function generateSentinelId(kind: SentinelIdKind, now: number = Date.now()): string {
  return `${SENTINEL_PREFIXES[kind]}${ulid(now)}`;
}

export function shortSentinelId(fullId: string, length = 8): string {
  const underscoreAt = fullId.indexOf("_");
  const tail = underscoreAt >= 0 ? fullId.slice(underscoreAt + 1) : fullId;
  return tail.slice(-length).toLowerCase();
}
