import { describe, expect, it } from "vitest";

import { generateSentinelId, shortSentinelId, ulid } from "../../../src/shared/ulid.js";

describe("ulid", () => {
  it("produces 26-character base32 ids", () => {
    const value = ulid();
    expect(value).toHaveLength(26);
    expect(value).toMatch(/^[0-9A-HJKMNPQRSTVWXYZ]+$/);
  });

  it("is monotonic for ascending timestamps", () => {
    const a = ulid(1_000_000_000_000);
    const b = ulid(1_000_000_000_001);
    expect(a < b).toBe(true);
  });

  it("returns unique values within a single millisecond", () => {
    const ids = new Set<string>();
    for (let i = 0; i < 256; i += 1) {
      ids.add(ulid(1_700_000_000_000));
    }
    expect(ids.size).toBe(256);
  });
});

describe("generateSentinelId", () => {
  it("prefixes ids with the kind tag", () => {
    expect(generateSentinelId("observation").startsWith("obs_")).toBe(true);
    expect(generateSentinelId("signal").startsWith("sig_")).toBe(true);
    expect(generateSentinelId("action").startsWith("act_")).toBe(true);
    expect(generateSentinelId("approval").startsWith("apr_")).toBe(true);
    expect(generateSentinelId("effect").startsWith("eff_")).toBe(true);
  });
});

describe("shortSentinelId", () => {
  it("returns the trailing 8 lowercase chars after the prefix", () => {
    const full = "obs_01HXY8ABCDEF0123456789ZZZZ";
    const short = shortSentinelId(full);
    expect(short).toHaveLength(8);
    expect(short).toBe(full.slice(-8).toLowerCase());
  });

  it("falls back to the whole string when no prefix is present", () => {
    expect(shortSentinelId("ABCDEFGH", 4)).toBe("efgh");
  });
});
