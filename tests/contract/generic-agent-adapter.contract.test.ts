import { describe, expect, it } from "vitest";
import { loadTargetAdapter } from "../../src/domain/targets/adapter.js";
import { PACKAGE_ROOT } from "../../src/shared/index.js";

describe("generic-agent adapter contract", () => {
  it("loads the generic-agent adapter", async () => {
    const adapter = await loadTargetAdapter(PACKAGE_ROOT, "generic-agent");
    expect(adapter).toBeDefined();
    expect(adapter.id).toBe("generic-agent");
    expect(adapter.displayName).toBe("Generic Agent");
  });

  it("has contract-level support", async () => {
    const adapter = await loadTargetAdapter(PACKAGE_ROOT, "generic-agent");
    expect(adapter.supportLevel).toBe("contract");
  });

  it("does not claim native hooks support", async () => {
    const adapter = await loadTargetAdapter(PACKAGE_ROOT, "generic-agent");
    expect(adapter.supportsHooks).toBe(false);
  });

  it("does not claim plugin support", async () => {
    const adapter = await loadTargetAdapter(PACKAGE_ROOT, "generic-agent");
    expect(adapter.supportsPlugins).toBe(false);
  });

  it("declares required surfaces", async () => {
    const adapter = await loadTargetAdapter(PACKAGE_ROOT, "generic-agent");
    const raw = adapter as Record<string, unknown>;
    const requiredSurfaces = raw["requiredSurfaces"] as string[] | undefined;
    expect(requiredSurfaces).toBeDefined();
    expect(requiredSurfaces!.length).toBeGreaterThan(0);
    expect(requiredSurfaces).toContain("AGENTS.md");
  });

  it("declares recommended consumption order", async () => {
    const adapter = await loadTargetAdapter(PACKAGE_ROOT, "generic-agent");
    const raw = adapter as Record<string, unknown>;
    const order = raw["recommendedConsumptionOrder"] as string[] | undefined;
    expect(order).toBeDefined();
    expect(order!.length).toBeGreaterThan(0);
  });
});
