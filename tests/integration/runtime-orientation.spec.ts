import { describe, expect, it } from "vitest";
import { buildOrientationPack } from "../../src/application/runtime/build-orientation-pack.js";

describe("runtime orientation integration", () => {
  it("builds first-hop orientation payload", () => {
    const pack = buildOrientationPack("runtime-standard", 8000);
    expect(pack.maxFirstHopTokens).toBe(8000);
    expect(pack.loadOrder.length).toBeGreaterThanOrEqual(5);
  });
});
