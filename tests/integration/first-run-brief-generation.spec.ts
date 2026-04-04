import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { afterEach, describe, expect, it } from "vitest";

import { generateOnboardingBrief } from "../../src/application/runtime/generate-onboarding-brief.js";
import { writeOnboardingBriefMarkdown } from "../../src/application/runtime/render-onboarding-brief-md.js";
import { parseOnboardingBrief } from "../../src/domain/runtime/onboarding-brief.js";
import { RUNTIME_DIR, RUNTIME_REPO_DIR, ONBOARDING_BRIEF_FILE, ONBOARDING_BRIEF_MD_FILE } from "../../src/shared/index.js";

const tempRoots: string[] = [];

afterEach(async () => {
  await Promise.all(tempRoots.splice(0).map((root) => fs.rm(root, { recursive: true, force: true })));
});

describe("first-run brief generation integration", () => {
  it("generates a valid onboarding brief JSON file", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-brief-"));
    tempRoots.push(workspaceRoot);

    const brief = await generateOnboardingBrief({
      workspaceRoot,
      repoType: "monorepo",
      detectedLanguages: ["typescript"],
      detectedFrameworks: ["next.js"],
      keyBoundaries: ["src/api"],
      selectedTargets: ["claude-code"],
      selectedProfile: "recommended",
      recommendedBundles: ["lang:typescript"]
    });

    expect(brief.schemaVersion).toBe("1.0.0");
    expect(brief.headline).toContain("monorepo");
    expect(brief.nextBestCommand).toBeTruthy();

    const jsonPath = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_REPO_DIR, ONBOARDING_BRIEF_FILE);
    const written = JSON.parse(await fs.readFile(jsonPath, "utf8"));
    const parsed = parseOnboardingBrief(written);
    expect(parsed.repoType).toBe("monorepo");
    expect(parsed.detectedLanguages).toEqual(["typescript"]);
  });

  it("generates a valid onboarding brief Markdown file", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-brief-md-"));
    tempRoots.push(workspaceRoot);

    const brief = await generateOnboardingBrief({
      workspaceRoot,
      repoType: "library",
      detectedLanguages: ["python"],
      detectedFrameworks: [],
      keyBoundaries: [],
      selectedTargets: ["cursor"],
      selectedProfile: "quick",
      recommendedBundles: ["lang:python"]
    });

    const mdPath = await writeOnboardingBriefMarkdown(workspaceRoot, brief);
    const mdContent = await fs.readFile(mdPath, "utf8");

    expect(mdPath).toContain(ONBOARDING_BRIEF_MD_FILE);
    expect(mdContent).toContain("# library repo with python");
    expect(mdContent).toContain("## Detected Languages");
    expect(mdContent).toContain("- python");
    expect(mdContent).toContain("## Next Command");
    expect(mdContent).toContain("hforge recommend");
  });

  it("creates the repo directory if it does not exist", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-brief-dir-"));
    tempRoots.push(workspaceRoot);

    await generateOnboardingBrief({
      workspaceRoot,
      repoType: "service",
      detectedLanguages: ["go"],
      detectedFrameworks: [],
      keyBoundaries: [],
      selectedTargets: ["codex"],
      selectedProfile: "recommended",
      recommendedBundles: []
    });

    const repoDir = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_REPO_DIR);
    const stat = await fs.stat(repoDir);
    expect(stat.isDirectory()).toBe(true);
  });
});
