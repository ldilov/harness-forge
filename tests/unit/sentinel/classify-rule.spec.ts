import { describe, expect, it } from "vitest";

import {
  applyClassifyRule,
  type MonitorClassify,
  type Severity,
} from "../../../src/domain/sentinel/monitor/monitor.js";

describe("applyClassifyRule", () => {
  it("returns the fallback when no classify config is present", () => {
    expect(applyClassifyRule(undefined, undefined, "info")).toBe<Severity>("info");
  });

  it("returns the named rule when classifyKey matches", () => {
    const classify: MonitorClassify = { severity: { default: "notice", manifest_changed: "warning" } };
    expect(applyClassifyRule(classify, "manifest_changed", "info")).toBe<Severity>("warning");
  });

  it("falls back to the default rule when key does not match", () => {
    const classify: MonitorClassify = { severity: { default: "notice", other: "warning" } };
    expect(applyClassifyRule(classify, "manifest_changed", "info")).toBe<Severity>("notice");
  });

  it("falls back to the adapter severity when neither default nor key match", () => {
    const classify: MonitorClassify = { severity: { other: "warning" } };
    expect(applyClassifyRule(classify, "manifest_changed", "critical")).toBe<Severity>("critical");
  });
});
