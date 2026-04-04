import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { applyInstall } from "../../src/application/install/apply-install.js";
import { createInstallPlan } from "../../src/application/install/plan-install.js";
import { loadBundleManifests, loadProfileManifests } from "../../src/domain/manifests/index.js";
import { loadTargetAdapter } from "../../src/domain/targets/adapter.js";

const repoRoot = process.cwd();
const fixtureRoot = path.join(repoRoot, "tests", "fixtures", "runtime");
const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((tempRoot) => fs.rm(tempRoot, { recursive: true, force: true })));
});

describe("runtime pack install integration", () => {
  it("persists installed packs, selected profile, materialization index, provenance, and recommendation evidence during install", async () => {
    const tempRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-pack-install-"));
    tempRoots.push(tempRoot);
    await fs.copyFile(
      path.join(fixtureRoot, "contained-install", "package.json"),
      path.join(tempRoot, "package.json")
    );

    const [bundles, profiles, target] = await Promise.all([
      loadBundleManifests(repoRoot),
      loadProfileManifests(repoRoot),
      loadTargetAdapter(repoRoot, "codex")
    ]);

    const plan = createInstallPlan(
      repoRoot,
      {
        targetId: "codex",
        profileId: "core",
        bundleIds: [],
        languageIds: [],
        frameworkIds: [],
        capabilityIds: [],
        rootPath: tempRoot,
        mode: "apply"
      },
      bundles,
      profiles,
      target,
      { workspaceRoot: tempRoot }
    );

    await applyInstall(tempRoot, plan);

    const [installedPacks, selectedProfile, materializationIndex, provenanceIndex, updatePlan, recommendationEvidence] = await Promise.all([
      fs.readFile(path.join(tempRoot, ".hforge", "manifests", "installed-packs.json"), "utf8"),
      fs.readFile(path.join(tempRoot, ".hforge", "manifests", "selected-profile.json"), "utf8"),
      fs.readFile(path.join(tempRoot, ".hforge", "manifests", "materialization-index.json"), "utf8"),
      fs.readFile(path.join(tempRoot, ".hforge", "runtime", "provenance", "index.json"), "utf8"),
      fs.readFile(path.join(tempRoot, ".hforge", "runtime", "provenance", "update-action-plan.json"), "utf8"),
      fs.readFile(path.join(tempRoot, ".hforge", "runtime", "repo", "recommendation-evidence.json"), "utf8")
    ]);

    const parsedInstalledPacks = JSON.parse(installedPacks) as {
      profileId?: string;
      packs: Array<{ packId: string }>;
    };
    const parsedSelectedProfile = JSON.parse(selectedProfile) as { profileId: string; bundleIds: string[] };
    const parsedMaterializationIndex = JSON.parse(materializationIndex) as { entries: Array<{ destinationPath: string }> };
    const parsedProvenanceIndex = JSON.parse(provenanceIndex) as {
      records: Array<{ path: string; ownershipClass: string }>;
    };
    const parsedUpdatePlan = JSON.parse(updatePlan) as {
      items: Array<{ path: string; proposedAction: string }>;
    };
    const parsedRecommendationEvidence = JSON.parse(recommendationEvidence) as {
      records: Array<{ subjectType: string; subjectId: string; evidence: string[] }>;
    };

    expect(parsedInstalledPacks.profileId).toBe("core");
    expect(parsedInstalledPacks.packs.length).toBeGreaterThan(0);
    expect(parsedInstalledPacks.packs.some((pack) => pack.packId === "baseline:agents")).toBe(true);

    expect(parsedSelectedProfile.profileId).toBe("core");
    expect(parsedSelectedProfile.bundleIds).toContain("baseline:agents");

    expect(parsedMaterializationIndex.entries.length).toBeGreaterThan(0);
    expect(parsedMaterializationIndex.entries.some((entry) => entry.destinationPath.endsWith("AGENTS.md"))).toBe(true);

    expect(parsedProvenanceIndex.records.some((record) => record.path === "AGENTS.md" && record.ownershipClass === "managed-bridge")).toBe(
      true
    );
    expect(parsedUpdatePlan.items.some((item) => item.path === "AGENTS.md" && item.proposedAction === "preserve")).toBe(true);
    expect(parsedRecommendationEvidence.records.some((record) => record.subjectType === "profile" && record.subjectId === "core")).toBe(true);
    expect(parsedRecommendationEvidence.records.some((record) => record.subjectType === "pack" && record.subjectId === "baseline:agents")).toBe(true);
  });

  it("creates progressively larger installed pack footprints for the minimal, recommended, and full tiers", async () => {
    const minimalRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-pack-minimal-"));
    const recommendedRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-pack-recommended-"));
    const fullRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-pack-full-"));
    tempRoots.push(minimalRoot, recommendedRoot, fullRoot);

    await Promise.all([
      fs.copyFile(path.join(fixtureRoot, "contained-install", "package.json"), path.join(minimalRoot, "package.json")),
      fs.copyFile(path.join(fixtureRoot, "contained-install", "package.json"), path.join(recommendedRoot, "package.json")),
      fs.copyFile(path.join(fixtureRoot, "contained-install", "package.json"), path.join(fullRoot, "package.json"))
    ]);

    const [bundles, profiles, target] = await Promise.all([
      loadBundleManifests(repoRoot),
      loadProfileManifests(repoRoot),
      loadTargetAdapter(repoRoot, "codex")
    ]);

    const minimalPlan = createInstallPlan(
      repoRoot,
      {
        targetId: "codex",
        profileId: "minimal",
        bundleIds: [],
        languageIds: [],
        frameworkIds: [],
        capabilityIds: [],
        rootPath: minimalRoot,
        mode: "apply"
      },
      bundles,
      profiles,
      target,
      { workspaceRoot: minimalRoot }
    );
    const fullPlan = createInstallPlan(
      repoRoot,
      {
        targetId: "codex",
        profileId: "full",
        bundleIds: [],
        languageIds: [],
        frameworkIds: [],
        capabilityIds: [],
        rootPath: fullRoot,
        mode: "apply"
      },
      bundles,
      profiles,
      target,
      { workspaceRoot: fullRoot }
    );
    const recommendedPlan = createInstallPlan(
      repoRoot,
      {
        targetId: "codex",
        profileId: "recommended",
        bundleIds: [],
        languageIds: [],
        frameworkIds: [],
        capabilityIds: [],
        rootPath: recommendedRoot,
        mode: "apply"
      },
      bundles,
      profiles,
      target,
      { workspaceRoot: recommendedRoot }
    );

    await Promise.all([
      applyInstall(minimalRoot, minimalPlan),
      applyInstall(recommendedRoot, recommendedPlan),
      applyInstall(fullRoot, fullPlan)
    ]);

    const [minimalInstalled, recommendedInstalled, fullInstalled] = await Promise.all([
      fs.readFile(path.join(minimalRoot, ".hforge", "manifests", "installed-packs.json"), "utf8"),
      fs.readFile(path.join(recommendedRoot, ".hforge", "manifests", "installed-packs.json"), "utf8"),
      fs.readFile(path.join(fullRoot, ".hforge", "manifests", "installed-packs.json"), "utf8")
    ]);

    const minimalDoc = JSON.parse(minimalInstalled) as { packs: Array<{ packId: string }> };
    const recommendedDoc = JSON.parse(recommendedInstalled) as { packs: Array<{ packId: string }> };
    const fullDoc = JSON.parse(fullInstalled) as { packs: Array<{ packId: string }> };

    expect(minimalDoc.packs.map((pack) => pack.packId)).toEqual(expect.arrayContaining(["baseline:agents", "baseline:commands"]));
    expect(recommendedDoc.packs.length).toBeGreaterThan(minimalDoc.packs.length);
    expect(fullDoc.packs.length).toBeGreaterThan(recommendedDoc.packs.length);
    expect(recommendedDoc.packs.some((pack) => pack.packId === "capability:repo-intelligence")).toBe(true);
    expect(fullDoc.packs.some((pack) => pack.packId === "capability:lifecycle-governance")).toBe(true);
  });
});
