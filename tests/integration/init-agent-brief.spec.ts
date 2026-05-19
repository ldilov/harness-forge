import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { initializeWorkspace } from "../../src/application/install/initialize-workspace.js";
import { parseAgentStartBrief } from "../../src/domain/runtime/agent-brief.js";

describe("init agent brief integration", () => {
  it("writes compact agent brief artifacts during init", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-init-agent-brief-"));
    await fs.writeFile(
      path.join(workspaceRoot, "package.json"),
      JSON.stringify({ name: "brief-app", scripts: { build: "tsc" }, devDependencies: { typescript: "^5.8.2" } }),
      "utf8"
    );

    const result = await initializeWorkspace(workspaceRoot);
    const jsonPath = path.join(workspaceRoot, ".hforge", "runtime", "agent-brief.json");
    const markdownPath = path.join(workspaceRoot, ".hforge", "runtime", "agent-brief.md");
    const brief = parseAgentStartBrief(JSON.parse(await fs.readFile(jsonPath, "utf8")));
    const markdown = await fs.readFile(markdownPath, "utf8");

    expect(result.changedFiles).toEqual(expect.arrayContaining([jsonPath, markdownPath]));
    expect(brief.workspace.label).toBe("brief-app");
    expect(brief.detectedStack).toContain("TypeScript");
    expect(markdown).toContain("Harness Forge Agent Brief");
    expect(markdown.trim().split(/\s+/u).length).toBeLessThanOrEqual(600);
  });

  it("preserves user-owned visible bridge content during init reruns", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-init-agent-bridge-"));
    const agentsPath = path.join(workspaceRoot, "AGENTS.md");
    await fs.writeFile(agentsPath, "# User guidance\n\nDo not overwrite me.\n", "utf8");

    await initializeWorkspace(workspaceRoot);
    await initializeWorkspace(workspaceRoot);

    await expect(fs.readFile(agentsPath, "utf8")).resolves.toContain("Do not overwrite me.");
  });

  it("gives older or partial workspaces a fallback posture when command catalog is missing", async () => {
    const workspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "hforge-init-agent-partial-"));

    await initializeWorkspace(workspaceRoot);
    const brief = parseAgentStartBrief(
      JSON.parse(await fs.readFile(path.join(workspaceRoot, ".hforge", "runtime", "agent-brief.json"), "utf8"))
    );

    expect(brief.freshness.status).toBe("partial");
    expect(brief.freshness.recommendedAction).toContain("hforge refresh");
  });
});
