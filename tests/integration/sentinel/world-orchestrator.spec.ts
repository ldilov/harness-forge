import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

import { WorldOrchestrator } from "../../../src/application/sentinel/world/orchestrator.js";
import { WorldSourcesStore } from "../../../src/infrastructure/sentinel/stores/world-store.js";
import type { PolicyFetchOptions, PolicyFetchResult } from "../../../src/infrastructure/sentinel/world/policy-fetch.js";

let workspace: string;

async function seedRepo(): Promise<void> {
  await fs.writeFile(
    path.join(workspace, "package.json"),
    JSON.stringify(
      {
        name: "demo",
        version: "0.0.0",
        dependencies: { typescript: "5" },
        devDependencies: { vitest: "3" },
      },
      null,
      2,
    ) + "\n",
    "utf8",
  );
}

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-world-it-"));
  await seedRepo();
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("WorldOrchestrator.sync (integration)", () => {
  it("emits drafts only for allowlisted sources and applies relevance scoring", async () => {
    const sources = new WorldSourcesStore(workspace);
    await sources.write({
      enabled: true,
      intervalSeconds: 600,
      watch: { npm: ["react", "typescript"], github: [], runtime: [] },
      policies: {
        maxSignalsPerRun: 20,
        suppressMajorReleaseNoiseFor: "7d",
        npmPerHour: 30,
        githubPerHour: 60,
        relevanceFloor: 0,
      },
    });

    const fakeFetch = vi.fn(async (options: PolicyFetchOptions): Promise<PolicyFetchResult> => {
      const pkg = options.url.includes("typescript") ? "typescript" : "react";
      const version = pkg === "typescript" ? "5.4.0" : "19.0.0";
      return {
        status: 200,
        notModified: false,
        body: JSON.stringify({
          name: pkg,
          "dist-tags": { latest: version },
          time: { [version]: "2026-05-06T00:00:00.000Z" },
        }),
        etag: '"v1"',
        lastModified: null,
      };
    });

    const orchestrator = new WorldOrchestrator(fakeFetch);
    const result = await orchestrator.sync({ workspaceRoot: workspace });

    expect(fakeFetch).toHaveBeenCalledTimes(2);
    expect(result.drafts).toHaveLength(2);
    const tsDraft = result.drafts.find((d) => d.subject === "typescript");
    const reactDraft = result.drafts.find((d) => d.subject === "react");
    expect(tsDraft).toBeDefined();
    expect(reactDraft?.severity).toBe("info");
    expect(
      (tsDraft?.metadata as { relevance: { score: number } } | undefined)?.relevance.score,
    ).toBe(1);
    expect(
      (reactDraft?.metadata as { relevance: { score: number } } | undefined)?.relevance.score,
    ).toBe(0.1);
  });

  it("drops drafts that score below the relevance floor", async () => {
    const sources = new WorldSourcesStore(workspace);
    await sources.addWatch({ kind: "npm", name: "react" });

    const fakeFetch = vi.fn(async (): Promise<PolicyFetchResult> => ({
      status: 200,
      notModified: false,
      body: JSON.stringify({
        name: "react",
        "dist-tags": { latest: "19.0.0" },
        time: { "19.0.0": "2026-05-06T00:00:00.000Z" },
      }),
      etag: null,
      lastModified: null,
    }));

    const orchestrator = new WorldOrchestrator(fakeFetch);
    const result = await orchestrator.sync({ workspaceRoot: workspace });
    expect(fakeFetch).toHaveBeenCalledTimes(1);
    expect(result.drafts).toHaveLength(0);
    expect(result.outcomes[0]?.skipped).toBe(1);
  });

  it("respects maxSignalsPerRun by short-circuiting after the limit", async () => {
    const sources = new WorldSourcesStore(workspace);
    await sources.write({
      enabled: true,
      intervalSeconds: 600,
      watch: { npm: ["typescript", "react"], github: [], runtime: [] },
      policies: {
        maxSignalsPerRun: 1,
        suppressMajorReleaseNoiseFor: "7d",
        npmPerHour: 30,
        githubPerHour: 60,
        relevanceFloor: 0,
      },
    });

    const fakeFetch = vi.fn(async (options: PolicyFetchOptions): Promise<PolicyFetchResult> => {
      const pkg = options.url.includes("typescript") ? "typescript" : "react";
      return {
        status: 200,
        notModified: false,
        body: JSON.stringify({
          name: pkg,
          "dist-tags": { latest: "1.0.0" },
          time: { "1.0.0": "2026-05-06T00:00:00.000Z" },
        }),
        etag: null,
        lastModified: null,
      };
    });

    const orchestrator = new WorldOrchestrator(fakeFetch);
    const result = await orchestrator.sync({ workspaceRoot: workspace });
    expect(result.drafts.length).toBeLessThanOrEqual(1);
    const skippedOutcomes = result.outcomes.filter((o) => o.skipped > 0);
    expect(skippedOutcomes.length).toBeGreaterThanOrEqual(1);
  });

  it("returns an empty result when the watchlist is empty", async () => {
    const orchestrator = new WorldOrchestrator(async () => ({
      status: 200,
      notModified: false,
      body: "",
      etag: null,
      lastModified: null,
    }));
    const result = await orchestrator.sync({ workspaceRoot: workspace });
    expect(result.drafts).toEqual([]);
    expect(result.outcomes).toEqual([]);
  });
});
