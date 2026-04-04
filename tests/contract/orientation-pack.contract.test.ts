import { describe, expect, it } from "vitest";
import { buildOrientationPack } from "../../src/application/runtime/build-orientation-pack.js";

describe("orientation pack contract", () => {
  it("returns required first-hop surfaces", () => {
    const pack = buildOrientationPack("runtime-standard");
    expect(pack.requiredSurfaces).toContain("AGENTS.md");
    expect(pack.requiredSurfaces).toContain(".hforge/agent-manifest.json");
  });
});
