import { describe, expect, it } from "vitest";

import { canonicalJson } from "../../../src/shared/canonical-json.js";

describe("canonicalJson", () => {
  it("sorts object keys alphabetically", () => {
    expect(canonicalJson({ b: 1, a: 2 })).toBe('{"a":2,"b":1}');
  });

  it("sorts nested object keys recursively", () => {
    const value = { z: { y: 1, x: 2 }, a: { c: 3, b: 4 } };
    expect(canonicalJson(value)).toBe('{"a":{"b":4,"c":3},"z":{"x":2,"y":1}}');
  });

  it("preserves array order", () => {
    expect(canonicalJson([3, 1, 2])).toBe("[3,1,2]");
  });

  it("produces identical output for semantically equal inputs", () => {
    const a = { name: "x", tags: ["a", "b"], nested: { p: 1, q: 2 } };
    const b = { tags: ["a", "b"], nested: { q: 2, p: 1 }, name: "x" };
    expect(canonicalJson(a)).toBe(canonicalJson(b));
  });

  it("handles primitives", () => {
    expect(canonicalJson(null)).toBe("null");
    expect(canonicalJson(42)).toBe("42");
    expect(canonicalJson("hello")).toBe('"hello"');
  });
});
