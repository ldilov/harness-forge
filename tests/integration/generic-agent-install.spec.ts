import { describe, expect, it } from "vitest";
import { loadTargetAdapter, loadTargetAdapters } from "../../src/domain/targets/adapter.js";
import { PACKAGE_ROOT } from "../../src/shared/index.js";

describe("generic-agent install integration", () => {
  it("loads generic-agent alongside other adapters", async () => {
    const adapters = await loadTargetAdapters(PACKAGE_ROOT);
    const genericAdapter = adapters.find((a) => a.id === "generic-agent");
    expect(genericAdapter).toBeDefined();
    expect(genericAdapter!.supportLevel).toBe("contract");
  });

  it("generic-agent adapter has shared runtime bridge metadata", async () => {
    const adapter = await loadTargetAdapter(PACKAGE_ROOT, "generic-agent");
    expect(adapter.sharedRuntimeBridge).toBeDefined();
    expect(adapter.sharedRuntimeBridge?.supportMode).toBe("contract");
  });

  it("generic-agent has empty or minimal path mappings", async () => {
    const adapter = await loadTargetAdapter(PACKAGE_ROOT, "generic-agent");
    const mappingCount = Object.keys(adapter.pathMappings).length;
    expect(mappingCount).toBeLessThanOrEqual(2);
  });

  it("generic-agent does not require vendor-specific directories in bridge paths", async () => {
    const adapter = await loadTargetAdapter(PACKAGE_ROOT, "generic-agent");
    const visiblePaths = adapter.sharedRuntimeBridge?.visibleBridgePaths ?? [];
    for (const bridgePath of visiblePaths) {
      expect(bridgePath).not.toMatch(/\.codex|\.claude/);
    }
  });
});
