import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

import { verifyTargetSupportMode } from "../../src/application/runtime/verify-target-support-mode.js";

describe("target support honesty integration", () => {
  it("flags invalid native posture", () => {
    const verdict = verifyTargetSupportMode({
      targetId: "x",
      declaredMode: "native",
      observedSupportsHooks: false,
      observedSupportsCommands: false
    });
    expect(verdict.consistent).toBe(false);
  });

  it("keeps Cursor agent brief wording partial", async () => {
    const cursor = JSON.parse(await fs.readFile(path.join(process.cwd(), "targets", "cursor", "adapter.json"), "utf8"));

    expect(cursor.supportLevel).toBe("partial");
    expect(cursor.sharedRuntimeBridge.notes).toContain("partial support");
    expect(cursor.sharedRuntimeBridge.runtimeSurfaces).toContain(".hforge/runtime/agent-brief.md");
    expect(cursor.sharedRuntimeBridge.notes).toContain("translated guidance");
    expect(cursor.sharedRuntimeBridge.notes).toContain("do not claim native parallel subagent execution");
  });

  it("keeps OpenCode complex-task protocol wording translated and partial", async () => {
    const opencode = JSON.parse(await fs.readFile(path.join(process.cwd(), "targets", "opencode", "adapter.json"), "utf8"));

    expect(opencode.supportLevel).toBe("partial");
    expect(opencode.sharedRuntimeBridge.supportMode).toBe("translated");
    expect(opencode.sharedRuntimeBridge.runtimeSurfaces).toContain(".hforge/runtime/agent-brief.md");
    expect(opencode.sharedRuntimeBridge.runtimeSurfaces).toContain(".hforge/library/skills/complex-task-protocol/SKILL.md");
    expect(opencode.sharedRuntimeBridge.notes).toContain("partial support rather than full runtime-native parity");
    expect(opencode.sharedRuntimeBridge.notes).toContain("translated guidance");
    expect(opencode.sharedRuntimeBridge.notes).toContain("do not claim native parallel subagent execution for OpenCode");
  });
});
