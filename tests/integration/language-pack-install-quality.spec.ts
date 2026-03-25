import path from "node:path";

import { describe, expect, it } from "vitest";

import { createInstallPlan } from "../../src/application/install/plan-install.js";
import { loadBundleManifests } from "../../src/domain/manifests/index.js";
import { loadTargetAdapter } from "../../src/domain/targets/adapter.js";

const root = process.cwd();

describe("language pack install quality", () => {
  it("plans docs, rules, skills, workflows, and examples for a structured language pack", async () => {
    const bundles = await loadBundleManifests(root);
    const target = await loadTargetAdapter(root, "codex");

    const plan = createInstallPlan(
      root,
      {
        targetId: "codex",
        profileId: undefined,
        bundleIds: [],
        languageIds: ["python"],
        frameworkIds: [],
        capabilityIds: [],
        rootPath: path.join(root, "tests", "fixtures", "tmp-install-quality"),
        mode: "dry-run"
      },
      bundles,
      [],
      target,
      { workspaceRoot: path.join(root, "tests", "fixtures", "tmp-install-quality") }
    );

    const plannedSources = plan.operations.map((operation) => operation.sourcePath.replaceAll("\\", "/"));
    expect(plannedSources.some((value) => value.endsWith("/docs/catalog/languages/python.md"))).toBe(true);
    expect(plannedSources.some((value) => value.endsWith("/rules/python") || value.includes("/rules/python/"))).toBe(true);
    expect(plannedSources.some((value) => value.includes("/skills/python-engineering"))).toBe(true);
    expect(plannedSources.some((value) => value.endsWith("/templates/workflows/implement-python-change.md"))).toBe(true);
    expect(
      plannedSources.some(
        (value) => value.endsWith("/knowledge-bases/structured/python") || value.includes("/knowledge-bases/structured/python/")
      )
    ).toBe(true);
  });
});
