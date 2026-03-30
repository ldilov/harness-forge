import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();
const workloadSkills = [
  "incident-triage",
  "dependency-upgrade-safety",
  "impact-analysis",
  "performance-profiling",
  "test-strategy-and-coverage",
  "api-contract-review",
  "db-migration-review",
  "pr-triage-and-summary",
  "observability-setup",
  "repo-modernization"
];

describe("workload skills integration", () => {
  it("publishes workload skills through the core capability bundle and skill catalog", async () => {
    const coreBundleManifest = JSON.parse(
      await fs.readFile(path.join(root, "manifests", "bundles", "core.json"), "utf8")
    ) as {
      bundles: Array<{ id: string; paths: string[] }>;
    };
    const skillsReadme = await fs.readFile(path.join(root, "skills", "README.md"), "utf8");
    const workloadBundle = coreBundleManifest.bundles.find((bundle) => bundle.id === "capability:workload-skills");

    expect(workloadBundle).toBeDefined();
    for (const skillId of workloadSkills) {
      expect(workloadBundle?.paths).toContain(`skills/${skillId}`);
      expect(skillsReadme).toContain(`skills/${skillId}/`);
      await expect(fs.readFile(path.join(root, "skills", skillId, "SKILL.md"), "utf8")).resolves.toBeTruthy();
    }
  });
});
