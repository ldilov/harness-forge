import { describe, expect, it } from "vitest";

import {
  WorldSourcesFileSchema,
  defaultWorldSources,
  parseWatchRef,
  watchKey,
} from "../../../src/domain/sentinel/world/world-event.js";

describe("parseWatchRef", () => {
  it("parses npm:typescript", () => {
    const ref = parseWatchRef("npm:typescript");
    expect(ref).toEqual({ kind: "npm", name: "typescript" });
  });

  it("parses runtime:nodejs:lts (preserving the rest after the first colon)", () => {
    const ref = parseWatchRef("runtime:nodejs:lts");
    expect(ref).toEqual({ kind: "runtime", name: "nodejs:lts" });
  });

  it("returns null for invalid kinds", () => {
    expect(parseWatchRef("foo:bar")).toBeNull();
  });

  it("returns null when missing the kind:name separator", () => {
    expect(parseWatchRef("typescript")).toBeNull();
    expect(parseWatchRef(":typescript")).toBeNull();
    expect(parseWatchRef("npm:")).toBeNull();
  });
});

describe("watchKey", () => {
  it("composes kind:name", () => {
    expect(watchKey({ kind: "npm", name: "vitest" })).toBe("npm:vitest");
  });
});

describe("defaultWorldSources", () => {
  it("starts with npm/github/runtime watches all empty", () => {
    const value = defaultWorldSources();
    expect(value.watch.npm).toEqual([]);
    expect(value.watch.github).toEqual([]);
    expect(value.watch.runtime).toEqual([]);
    expect(value.policies.relevanceFloor).toBeGreaterThanOrEqual(0);
    expect(value.policies.relevanceFloor).toBeLessThanOrEqual(1);
  });

  it("validates a populated file", () => {
    const value = WorldSourcesFileSchema.parse({
      enabled: true,
      intervalSeconds: 600,
      watch: { npm: ["typescript"], github: [], runtime: ["nodejs:lts"] },
      policies: { maxSignalsPerRun: 5 },
    });
    expect(value.policies.maxSignalsPerRun).toBe(5);
    expect(value.policies.npmPerHour).toBeGreaterThan(0);
  });
});
