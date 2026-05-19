import { describe, expect, it } from "vitest";

import {
  NetworkBlockedError,
  ResponseTooLargeError,
  policyFetch,
} from "../../../src/infrastructure/sentinel/world/policy-fetch.js";

describe("policyFetch network policy enforcement", () => {
  it("blocks all requests under mode 'none'", async () => {
    await expect(
      policyFetch({
        url: "https://registry.npmjs.org/typescript",
        userAgent: "test/0",
        mode: "none",
      }),
    ).rejects.toBeInstanceOf(NetworkBlockedError);
  });

  it("blocks non-npm hosts under 'package-registry-only'", async () => {
    await expect(
      policyFetch({
        url: "https://api.github.com/repos/x/y",
        userAgent: "test/0",
        mode: "package-registry-only",
      }),
    ).rejects.toBeInstanceOf(NetworkBlockedError);
  });

  it("blocks non-github hosts under 'github-only'", async () => {
    await expect(
      policyFetch({
        url: "https://registry.npmjs.org/typescript",
        userAgent: "test/0",
        mode: "github-only",
      }),
    ).rejects.toBeInstanceOf(NetworkBlockedError);
  });

  it("rejects with ResponseTooLargeError when content-length exceeds maxBytes", async () => {
    const original = globalThis.fetch;
    const stub: typeof fetch = async () =>
      new Response("x", {
        status: 200,
        headers: new Headers({ "content-length": "999999" }),
      });
    globalThis.fetch = stub;
    try {
      await expect(
        policyFetch({
          url: "https://registry.npmjs.org/typescript",
          userAgent: "test/0",
          mode: "package-registry-only",
          maxBytes: 1024,
        }),
      ).rejects.toBeInstanceOf(ResponseTooLargeError);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("rejects when streamed body exceeds maxBytes (no content-length)", async () => {
    const original = globalThis.fetch;
    const big = new Uint8Array(2048);
    big.fill(65);
    const stub: typeof fetch = async () => new Response(big, { status: 200 });
    globalThis.fetch = stub;
    try {
      await expect(
        policyFetch({
          url: "https://registry.npmjs.org/typescript",
          userAgent: "test/0",
          mode: "package-registry-only",
          maxBytes: 1024,
        }),
      ).rejects.toBeInstanceOf(ResponseTooLargeError);
    } finally {
      globalThis.fetch = original;
    }
  });

  it("allows hosts that match the allowlist suffix", async () => {
    let blocked = false;
    try {
      await policyFetch({
        url: "https://example.invalid-host-for-test/x",
        userAgent: "test/0",
        mode: "allowlist",
        allowlist: ["other.example"],
        timeoutMs: 1,
      });
    } catch (error: unknown) {
      blocked = error instanceof NetworkBlockedError;
    }
    expect(blocked).toBe(true);
  });
});
