import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { parseInstalledPacksDocument } from "../../src/domain/runtime/installed-packs.js";
import { parseMaterializationIndexDocument } from "../../src/domain/runtime/materialization-index.js";
import { parsePackManifest } from "../../src/domain/runtime/pack-manifest.js";
import { parseProvenanceIndexDocument } from "../../src/domain/runtime/provenance.js";
import { parseRecommendationEvidenceDocument } from "../../src/domain/runtime/recommendation-evidence.js";
import { parseSelectedProfileDocument } from "../../src/domain/runtime/selected-profile.js";
import { parseUpdateActionPlanDocument } from "../../src/domain/runtime/update-action-plan.js";

const root = process.cwd();

describe("runtime platform schema contracts", () => {
  it("ships the schema files for pack, provenance, policy, and coherence runtime truth", async () => {
    const requiredSchemas = [
      "schemas/runtime/pack-manifest.schema.json",
      "schemas/runtime/installed-packs.schema.json",
      "schemas/runtime/selected-profile.schema.json",
      "schemas/runtime/materialization-index.schema.json",
      "schemas/runtime/provenance-index.schema.json",
      "schemas/runtime/update-action-plan.schema.json",
      "schemas/runtime/extension-manifest.schema.json",
      "schemas/runtime/intelligence-cache-entry.schema.json",
      "schemas/runtime/execution-policy.schema.json",
      "schemas/runtime/coherence-report.schema.json",
      "schemas/runtime/recommendation-evidence.schema.json"
    ];

    await Promise.all(
      requiredSchemas.map(async (relativePath) => {
        const fullPath = path.join(root, relativePath);
        const contents = await fs.readFile(fullPath, "utf8");
        expect(contents.length).toBeGreaterThan(0);
      })
    );
  });

  it("accepts representative runtime truth documents through domain validators", () => {
    expect(
      parsePackManifest({
        packId: "baseline:agents",
        title: "Baseline Agents",
        description: "Core bridge and skill surfaces.",
        kind: "core",
        sourceBundleIds: ["baseline:agents"],
        dependsOn: [],
        conflictsWith: [],
        managedRoots: [".hforge/library/skills"],
        selectionMode: "default",
        optional: false,
        defaultEnabled: true,
        targetPosture: { codex: "full" }
      }).packId
    ).toBe("baseline:agents");

    expect(
      parseInstalledPacksDocument({
        runtimeSchemaVersion: 2,
        packageVersion: "1.3.0",
        profileId: "core",
        packs: [
          {
            packId: "baseline:agents",
            selectedBy: "profile",
            sourceBundleIds: ["baseline:agents"]
          }
        ]
      }).packs
    ).toHaveLength(1);

    expect(
      parseSelectedProfileDocument({
        profileId: "core",
        displayName: "Core",
        bundleIds: ["baseline:agents"],
        generatedAt: new Date().toISOString()
      }).profileId
    ).toBe("core");

    expect(
      parseMaterializationIndexDocument({
        generatedAt: new Date().toISOString(),
        entries: [
          {
            bundleId: "baseline:agents",
            destinationPath: "AGENTS.md",
            operationType: "copy",
            sourcePath: "AGENTS.md"
          }
        ]
      }).entries
    ).toHaveLength(1);

    expect(
      parseProvenanceIndexDocument({
        generatedAt: new Date().toISOString(),
        records: [
          {
            path: "AGENTS.md",
            ownershipClass: "managed-bridge",
            editPolicy: "preserve-user-modifications",
            sourceKind: "canonical-authored-source",
            selectedBy: "profile"
          }
        ]
      }).records
    ).toHaveLength(1);

    expect(
      parseUpdateActionPlanDocument({
        operationType: "install",
        generatedAt: new Date().toISOString(),
        workspaceState: "mixed",
        items: [
          {
            path: "AGENTS.md",
            proposedAction: "preserve",
            reason: "baseline:agents requires AGENTS.md",
            ownershipClass: "managed-bridge",
            recommendedAlternative: ".hforge/overrides/bridges/"
          }
        ]
      }).items
    ).toHaveLength(1);

    expect(
      parseRecommendationEvidenceDocument({
        generatedAt: new Date().toISOString(),
        records: [
          {
            subjectType: "profile",
            subjectId: "recommended",
            selectedBy: "recommendation",
            matchedRecommendation: true,
            confidence: 0.92,
            why: "Repo signals match the recommended tier.",
            evidence: ["package.json", "vite.config.ts"],
            source: "repo-intelligence"
          }
        ]
      }).records
    ).toHaveLength(1);
  });
});
