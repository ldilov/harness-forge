import { describe, expect, it } from "vitest";

import {
  authorityAtLeast,
  authorityRank,
  maxAuthority,
} from "../../../src/domain/sentinel/policy/authority-level.js";

describe("authority-level helpers", () => {
  it("ranks A0 < A1 < ... < A5", () => {
    expect(authorityRank("A0")).toBe(0);
    expect(authorityRank("A5")).toBe(5);
    expect(authorityRank("A2")).toBeLessThan(authorityRank("A3"));
  });

  it("authorityAtLeast is reflexive and transitive", () => {
    expect(authorityAtLeast("A2", "A2")).toBe(true);
    expect(authorityAtLeast("A3", "A1")).toBe(true);
    expect(authorityAtLeast("A0", "A1")).toBe(false);
  });

  it("maxAuthority picks the higher of two", () => {
    expect(maxAuthority("A1", "A3")).toBe("A3");
    expect(maxAuthority("A4", "A2")).toBe("A4");
    expect(maxAuthority("A1", "A1")).toBe("A1");
  });
});
