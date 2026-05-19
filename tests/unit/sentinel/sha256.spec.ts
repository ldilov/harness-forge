import { describe, expect, it } from "vitest";

import {
  sha256Hex,
  sha256ContentHash,
  sha256OfCanonicalJson,
  shortHash,
} from "../../../src/shared/sha256.js";

describe("sha256Hex", () => {
  it("matches the well-known empty-string digest", () => {
    expect(sha256Hex("")).toBe("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855");
  });

  it("matches the well-known 'abc' digest", () => {
    expect(sha256Hex("abc")).toBe("ba7816bf8f01cfea414140de5dae2223b00361a396177a9cb410ff61f20015ad");
  });
});

describe("sha256ContentHash", () => {
  it("uses sha256-base64url envelope", () => {
    const value = sha256ContentHash("abc");
    expect(value.startsWith("sha256-")).toBe(true);
    expect(value).not.toContain("+");
    expect(value).not.toContain("/");
  });
});

describe("sha256OfCanonicalJson", () => {
  it("is invariant to key order", () => {
    const left = sha256OfCanonicalJson({ a: 1, b: 2 });
    const right = sha256OfCanonicalJson({ b: 2, a: 1 });
    expect(left).toBe(right);
  });
});

describe("shortHash", () => {
  it("returns the requested prefix length", () => {
    expect(shortHash("hello", 8)).toHaveLength(8);
    expect(shortHash("hello", 16)).toHaveLength(16);
  });

  it("is deterministic", () => {
    expect(shortHash("payload")).toBe(shortHash("payload"));
  });
});
