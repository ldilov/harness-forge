import { describe, expect, it } from "vitest";

import { evaluateTaskArtifactFreshness } from "../../src/application/runtime/select-files-of-interest.js";

describe("task runtime artifact freshness", () => {
  it("marks artifacts stale when repo intelligence is newer", () => {
    const freshness = evaluateTaskArtifactFreshness({
      artifactGeneratedAt: "2026-03-27T09:00:00.000Z",
      repoMapGeneratedAt: "2026-03-27T09:30:00.000Z"
    });

    expect(freshness.status).toBe("stale");
    expect(freshness.reasons).toContain("repo intelligence is newer than the task artifact");
  });

  it("keeps artifacts fresh when no invalidating signal exists", () => {
    const freshness = evaluateTaskArtifactFreshness({
      artifactGeneratedAt: "2026-03-27T09:30:00.000Z",
      repoMapGeneratedAt: "2026-03-27T09:00:00.000Z"
    });

    expect(freshness.status).toBe("fresh");
    expect(freshness.reasons).toEqual([]);
  });
});
