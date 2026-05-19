import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("agent start bridge contract", () => {
  it("points Codex and Claude Code bridges at the shared agent brief", async () => {
    const [codex, claude, generic] = await Promise.all([
      fs.readFile(path.join(root, "targets", "codex", "runtime", ".codex", "README.md"), "utf8"),
      fs.readFile(path.join(root, "targets", "claude-code", "runtime", ".claude", "CLAUDE.md"), "utf8"),
      fs.readFile(path.join(root, "targets", "generic-agent", "runtime", "AGENTS-bridge.md"), "utf8")
    ]);

    expect(codex).toContain(".hforge/runtime/agent-brief.md");
    expect(claude).toContain(".hforge/runtime/agent-brief.md");
    expect(generic).toContain(".hforge/runtime/agent-brief.md");
    expect(codex).toContain(".hforge/library/skills/complex-task-protocol/SKILL.md");
    expect(claude).toContain(".hforge/library/skills/complex-task-protocol/SKILL.md");
    expect(generic).toContain(".hforge/library/skills/complex-task-protocol/SKILL.md");
    expect(codex).toContain("at most two bounded subagents");
    expect(claude).toContain("no more than two bounded sidecar agents");
  });

  it("keeps Cursor wording compatible and partial", async () => {
    const cursor = JSON.parse(await fs.readFile(path.join(root, "targets", "cursor", "adapter.json"), "utf8"));

    expect(cursor.supportLevel).toBe("partial");
    expect(cursor.sharedRuntimeBridge.runtimeSurfaces).toContain(".hforge/runtime/agent-brief.md");
    expect(cursor.sharedRuntimeBridge.notes).toContain("partial support");
    expect(cursor.sharedRuntimeBridge.notes).toContain("rather than full runtime-native parity");
    expect(cursor.sharedRuntimeBridge.notes).toContain("complex-task-protocol");
    expect(cursor.sharedRuntimeBridge.notes).toContain("do not claim native parallel subagent execution");
  });
});
