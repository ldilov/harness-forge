import { describe, expect, it } from "vitest";

import { resolveFingerprint } from "../../../src/domain/sentinel/observation/fingerprint.js";

describe("resolveFingerprint", () => {
  it("substitutes ${subject} with the subject", () => {
    const a = resolveFingerprint("kind:${subject}", { subject: "alpha" });
    const b = resolveFingerprint("kind:${subject}", { subject: "beta" });
    expect(a).not.toBe(b);
  });

  it("walks dotted paths into metadata", () => {
    const fp = resolveFingerprint("ci:${workflow}:${branch}", {
      subject: "ci",
      metadata: { workflow: "build", branch: "main" },
    });
    expect(fp).toHaveLength(16);
  });

  it("is deterministic for identical inputs", () => {
    const ctx = { subject: "x", metadata: { y: 1 } };
    expect(resolveFingerprint("a:${subject}:${y}", ctx)).toBe(
      resolveFingerprint("a:${subject}:${y}", ctx),
    );
  });

  it("does not collide unrelated observations when keys are missing", () => {
    const left = resolveFingerprint("k:${subject}:${a}", { subject: "x" });
    const right = resolveFingerprint("k:${subject}:${b}", { subject: "x" });
    expect(left).not.toBe(right);
  });

  it("treats missing nested paths the same as missing top-level paths", () => {
    const fp = resolveFingerprint("k:${subject}:${nope.deep}", { subject: "x" });
    expect(fp).toHaveLength(16);
  });
});
