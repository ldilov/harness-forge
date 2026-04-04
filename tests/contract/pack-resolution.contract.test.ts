import { describe, expect, it } from "vitest";

import type { BundleManifest } from "../../src/domain/manifests/index.js";
import type { PackManifest } from "../../src/domain/runtime/pack-manifest.js";
import { buildRecommendationEvidence } from "../../src/application/install/resolve-profile.js";
import { resolvePackSet } from "../../src/application/install/resolve-pack-set.js";

const bundleFixtures: BundleManifest[] = [
  {
    id: "baseline:agents",
    family: "baseline",
    version: 1,
    description: "Agents",
    paths: ["AGENTS.md"],
    targets: ["codex"],
    dependencies: [],
    conflicts: [],
    optional: false,
    defaultInstall: true,
    stability: "stable",
    tags: [],
    owner: "core"
  },
  {
    id: "capability:workflow-quality",
    family: "capability",
    version: 1,
    description: "Workflow quality",
    paths: [".specify"],
    targets: ["codex"],
    dependencies: ["baseline:agents"],
    conflicts: ["capability:legacy-flow"],
    optional: true,
    defaultInstall: false,
    stability: "stable",
    tags: [],
    owner: "core"
  }
];

const packFixtures: PackManifest[] = [
  {
    packId: "baseline:agents",
    title: "Baseline Agents",
    description: "Agents",
    kind: "core",
    sourceBundleIds: ["baseline:agents"],
    dependsOn: [],
    conflictsWith: [],
    managedRoots: ["AGENTS.md"],
    selectionMode: "default",
    optional: false,
    defaultEnabled: true,
    targetPosture: { codex: "full" }
  },
  {
    packId: "capability:workflow-quality",
    title: "Workflow Quality",
    description: "Workflow quality",
    kind: "capability",
    sourceBundleIds: ["capability:workflow-quality"],
    dependsOn: ["baseline:agents"],
    conflictsWith: ["capability:legacy-flow"],
    managedRoots: [".specify"],
    selectionMode: "explicit",
    optional: true,
    defaultEnabled: false,
    targetPosture: { codex: "full" }
  }
];

describe("pack resolution contract", () => {
  it("includes default bundles when no explicit selection is provided", () => {
    const result = resolvePackSet(packFixtures, [], bundleFixtures);

    expect(result.packs.map((pack) => pack.packId)).toEqual(["baseline:agents"]);
    expect(result.conflicts).toEqual([]);
    expect(result.missingDependencies).toEqual([]);
  });

  it("expands dependencies and surfaces missing dependencies and conflicts", () => {
    const result = resolvePackSet(
      [
        ...packFixtures,
        {
          packId: "capability:legacy-flow",
          title: "Legacy Flow",
          description: "Legacy flow",
          kind: "capability",
          sourceBundleIds: ["capability:legacy-flow"],
          dependsOn: ["capability:missing"],
          conflictsWith: ["capability:workflow-quality"],
          managedRoots: ["commands"],
          selectionMode: "explicit",
          optional: true,
          defaultEnabled: false,
          targetPosture: { codex: "partial" }
        }
      ],
      ["capability:workflow-quality", "capability:legacy-flow"],
      bundleFixtures
    );

    expect(result.packs.map((pack) => pack.packId)).toEqual([
      "baseline:agents",
      "capability:legacy-flow",
      "capability:workflow-quality"
    ]);
    expect(result.conflicts).toContain("capability:legacy-flow conflicts with capability:workflow-quality");
    expect(result.conflicts).toContain("capability:workflow-quality conflicts with capability:legacy-flow");
    expect(result.missingDependencies).toContain("capability:legacy-flow requires missing dependency capability:missing");
  });

  it("builds recommendation evidence for selected profiles and packs", () => {
    const document = buildRecommendationEvidence("recommended", ["baseline:agents", "capability:workflow-quality"], {
      generatedAt: "2026-04-03T00:00:00.000Z",
      root: "D:/workspace/demo",
      repoType: "application",
      dominantLanguages: [],
      frameworkMatches: [],
      buildSignals: [],
      testSignals: [],
      deploymentSignals: [],
      riskSignals: [],
      missingValidationSurfaces: [],
      recommendations: {
        bundles: [
          {
            id: "capability:workflow-quality",
            kind: "bundle",
            confidence: 0.85,
            evidence: ["package.json"],
            why: "Workflow templates fit this repo."
          }
        ],
        profiles: [
          {
            id: "recommended",
            kind: "profile",
            confidence: 0.9,
            evidence: ["package.json", "src/main.ts"],
            why: "Repo signals match the recommended tier."
          }
        ],
        skills: [],
        validations: []
      }
    });

    expect(document.records.find((record) => record.subjectType === "profile")?.matchedRecommendation).toBe(true);
    expect(document.records.find((record) => record.subjectId === "baseline:agents")?.matchedRecommendation).toBe(false);
    expect(document.records.find((record) => record.subjectId === "capability:workflow-quality")?.why).toContain("Workflow templates");
  });
});
