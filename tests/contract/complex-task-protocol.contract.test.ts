import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

async function readProtocol(): Promise<string> {
  return fs.readFile(path.join(root, "skills", "complex-task-protocol", "SKILL.md"), "utf8");
}

describe("complex task protocol contract", () => {
  it("defines automatic activation by two ordinary signals or one high-signal condition", async () => {
    const protocol = await readProtocol();

    expect(protocol).toContain("at least two ordinary complexity signals");
    expect(protocol).toContain("at least one high-signal condition");
    expect(protocol).toContain("cross-target agent behavior");
    expect(protocol).toContain("recursive, runtime, orchestration, or subagent behavior");
    expect(protocol).toContain("persistent bug after one direct fix attempt");
  });

  it("keeps simple tasks lightweight without default subagent spawning", async () => {
    const protocol = await readProtocol();

    expect(protocol).toContain("Keep simple work lightweight");
    expect(protocol).toContain("Do not announce this protocol or spawn subagents by default");
    expect(protocol).toContain("direct questions that do not require code changes");
    expect(protocol).toContain("obvious one-file edits");
  });

  it("caps bounded subagent use and keeps the critical path with the main agent", async () => {
    const protocol = await readProtocol();

    expect(protocol).toContain("Default limit: zero to two subagents");
    expect(protocol).toContain("Use three only when the user explicitly asks");
    expect(protocol).toContain("the main agent's immediate blocking decision");
    expect(protocol).toContain("Keep critical-path decisions and the next blocking task with the main agent");
  });

  it("requires structured subagent results", async () => {
    const protocol = await readProtocol();

    expect(protocol).toContain("evidence inspected");
    expect(protocol).toContain("files inspected");
    expect(protocol).toContain("files changed, if any");
    expect(protocol).toContain("risks");
    expect(protocol).toContain("confidence");
    expect(protocol).toContain("verification performed, if any");
    expect(protocol).toContain("behavior changed and known gaps");
  });

  it("defines durable learning categories, exclusions, and destinations", async () => {
    const protocol = await readProtocol();

    expect(protocol).toContain("repository convention");
    expect(protocol).toContain("command or verification recipe");
    expect(protocol).toContain("recurring failure mode");
    expect(protocol).toContain("agent tactic that improved outcomes");
    expect(protocol).toContain("temporary task state");
    expect(protocol).toContain("duplicate guidance");
    expect(protocol).toContain("project docs");
    expect(protocol).toContain("runtime task artifacts");
    expect(protocol).toContain("decision records");
    expect(protocol).toContain("observability summaries");
    expect(protocol).toContain("Ask before creating a new top-level document");
  });

  it("requires verification outcomes and recovery thresholds", async () => {
    const protocol = await readProtocol();

    expect(protocol).toContain("checks run");
    expect(protocol).toContain("checks not run");
    expect(protocol).toContain("residual risk");
    expect(protocol).toContain("Stop unbounded exploration");
    expect(protocol).toContain("repeated failed attempts");
    expect(protocol).toContain("recursive investigation flow");
    expect(protocol).toContain("token-budget optimizer");
  });
});
