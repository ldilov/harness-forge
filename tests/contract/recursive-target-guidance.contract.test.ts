import fs from "node:fs/promises";
import path from "node:path";

import { describe, expect, it } from "vitest";

const root = process.cwd();

describe("recursive target guidance contract", () => {
  it("keeps target runtime guidance aligned for recursive structured analysis", async () => {
    const [codexAdapter, claudeAdapter, cursorAdapter, opencodeAdapter, targetManifest] = await Promise.all([
      fs.readFile(path.join(root, "targets", "codex", "adapter.json"), "utf8"),
      fs.readFile(path.join(root, "targets", "claude-code", "adapter.json"), "utf8"),
      fs.readFile(path.join(root, "targets", "cursor", "adapter.json"), "utf8"),
      fs.readFile(path.join(root, "targets", "opencode", "adapter.json"), "utf8"),
      fs.readFile(path.join(root, "manifests", "targets", "core.json"), "utf8")
    ]);

    const parsedCodex = JSON.parse(codexAdapter) as { sharedRuntimeBridge?: { runtimeSurfaces?: string[]; notes?: string } };
    const parsedClaude = JSON.parse(claudeAdapter) as { sharedRuntimeBridge?: { runtimeSurfaces?: string[]; notes?: string } };
    const parsedCursor = JSON.parse(cursorAdapter) as { sharedRuntimeBridge?: { runtimeSurfaces?: string[]; notes?: string } };
    const parsedOpenCode = JSON.parse(opencodeAdapter) as { sharedRuntimeBridge?: { runtimeSurfaces?: string[]; notes?: string } };
    const parsedTargets = JSON.parse(targetManifest) as { targets: Array<{ id: string; supportNotes?: string[] }> };

    expect(parsedCodex.sharedRuntimeBridge?.runtimeSurfaces).toContain(".hforge/runtime/recursive/language-capabilities.json");
    expect(parsedClaude.sharedRuntimeBridge?.runtimeSurfaces).toContain(".hforge/runtime/recursive/language-capabilities.json");
    expect(parsedCursor.sharedRuntimeBridge?.runtimeSurfaces).toContain(".hforge/runtime/recursive/language-capabilities.json");
    expect(parsedOpenCode.sharedRuntimeBridge?.runtimeSurfaces).toContain(".hforge/runtime/recursive/language-capabilities.json");
    expect(parsedCodex.sharedRuntimeBridge?.notes).toContain("recursive structured-analysis");
    expect(parsedClaude.sharedRuntimeBridge?.notes).toContain("recursive structured-analysis");
    expect(parsedCursor.sharedRuntimeBridge?.notes).toContain("recursive structured-analysis");
    expect(parsedOpenCode.sharedRuntimeBridge?.notes).toContain("recursive structured-analysis");
    expect(parsedTargets.targets.find((entry) => entry.id === "codex")?.supportNotes?.join(" ")).toContain(
      "recursive structured-analysis"
    );
    expect(parsedTargets.targets.find((entry) => entry.id === "claude-code")?.supportNotes?.join(" ")).toContain(
      "recursive structured-analysis"
    );
    expect(parsedTargets.targets.find((entry) => entry.id === "cursor")?.supportNotes?.join(" ")).toContain(
      "recursive structured-analysis"
    );
    expect(parsedTargets.targets.find((entry) => entry.id === "opencode")?.supportNotes?.join(" ")).toContain(
      "recursive structured-analysis"
    );
  });
});
