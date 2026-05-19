import { describe, expect, it } from "vitest";

import { AbortRegistry } from "../../../src/application/sentinel/runtime/abort-registry.js";

describe("AbortRegistry", () => {
  it("register returns a fresh handle whose signal is unaborted", () => {
    const registry = new AbortRegistry();
    const handle = registry.register("act_a", "test");
    expect(handle.controller.signal.aborted).toBe(false);
    expect(registry.size()).toBe(1);
  });

  it("register is idempotent on the same id", () => {
    const registry = new AbortRegistry();
    const a = registry.register("act_a", "test");
    const b = registry.register("act_a", "test");
    expect(a).toBe(b);
    expect(registry.size()).toBe(1);
  });

  it("unregister removes the handle", () => {
    const registry = new AbortRegistry();
    registry.register("act_a", "test");
    registry.unregister("act_a");
    expect(registry.size()).toBe(0);
  });

  it("abortAll fires every registered controller and returns those it aborted", () => {
    const registry = new AbortRegistry();
    const a = registry.register("act_a", "test");
    const b = registry.register("act_b", "test");
    const aborted = registry.abortAll("panic_stop");
    expect(aborted.map((h) => h.id).sort()).toEqual(["act_a", "act_b"]);
    expect(a.controller.signal.aborted).toBe(true);
    expect(b.controller.signal.aborted).toBe(true);
  });

  it("abortAll skips already-aborted controllers", () => {
    const registry = new AbortRegistry();
    const handle = registry.register("act_a", "test");
    handle.controller.abort("test-abort");
    const aborted = registry.abortAll("panic_stop");
    expect(aborted).toEqual([]);
  });
});
