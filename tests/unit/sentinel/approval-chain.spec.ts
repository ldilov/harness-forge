import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { ApprovalStore } from "../../../src/infrastructure/sentinel/stores/approval-store.js";
import {
  ApprovalChainTamperedError,
  appendApprovalEntry,
  verifyApprovalChain,
} from "../../../src/infrastructure/sentinel/policy/approval-chain.js";
import { sentinelApprovalsPath } from "../../../src/domain/sentinel/paths.js";
import { isApprovalActive } from "../../../src/domain/sentinel/policy/approval.js";

let workspace: string;

const baseDraft = {
  actionPlanId: "act_test",
  approvedBy: "tester",
  approvedAt: "2026-05-06T00:00:00.000Z",
  authorityGranted: "A2" as const,
  expiresAt: null,
  scope: [".hforge/**"],
  revokedAt: null,
};

beforeEach(async () => {
  workspace = await fs.mkdtemp(path.join(os.tmpdir(), "sentinel-approval-"));
});

afterEach(async () => {
  await fs.rm(workspace, { recursive: true, force: true });
});

describe("appendApprovalEntry", () => {
  it("computes prevHash=null for the first entry and a hash chain afterwards", () => {
    const first = appendApprovalEntry([], { id: "apr_a", ...baseDraft });
    expect(first.prevHash).toBeNull();
    const second = appendApprovalEntry([first], { id: "apr_b", ...baseDraft });
    expect(second.prevHash).toBe(first.hash);
    expect(second.hash).not.toBe(first.hash);
  });
});

describe("verifyApprovalChain", () => {
  it("accepts a clean two-entry chain", () => {
    const a = appendApprovalEntry([], { id: "apr_a", ...baseDraft });
    const b = appendApprovalEntry([a], { id: "apr_b", ...baseDraft });
    expect(() => verifyApprovalChain([a, b])).not.toThrow();
  });

  it("throws when a record's hash does not match its content", () => {
    const a = appendApprovalEntry([], { id: "apr_a", ...baseDraft });
    const tampered = { ...a, approvedBy: "attacker" };
    expect(() => verifyApprovalChain([tampered])).toThrow(ApprovalChainTamperedError);
  });

  it("throws when the prevHash link is broken", () => {
    const a = appendApprovalEntry([], { id: "apr_a", ...baseDraft });
    const b = appendApprovalEntry([a], { id: "apr_b", ...baseDraft });
    const tamperedB = { ...b, prevHash: "deadbeef" };
    expect(() => verifyApprovalChain([a, tamperedB])).toThrow(ApprovalChainTamperedError);
  });
});

describe("ApprovalStore", () => {
  it("appends entries and reads them back as a verified chain", async () => {
    const store = new ApprovalStore(workspace);
    const a = await store.append({ id: "apr_a", ...baseDraft });
    const b = await store.append({ id: "apr_b", ...baseDraft });
    const chain = await store.readChain();
    expect(chain).toHaveLength(2);
    expect(chain[1]?.prevHash).toBe(a.hash);
    expect(chain[1]?.hash).toBe(b.hash);
  });

  it("surfaces tampering detected on disk", async () => {
    const store = new ApprovalStore(workspace);
    const a = await store.append({ id: "apr_a", ...baseDraft });
    const filePath = sentinelApprovalsPath(workspace);
    const raw = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(raw);
    parsed.chain[0].approvedBy = "attacker";
    await fs.writeFile(filePath, JSON.stringify(parsed, null, 2), "utf8");
    await expect(store.readChain()).rejects.toBeInstanceOf(ApprovalChainTamperedError);
    expect(a.id).toBe("apr_a");
  });

  it("filters by action plan id", async () => {
    const store = new ApprovalStore(workspace);
    await store.append({ id: "apr_a", ...baseDraft, actionPlanId: "act_x" });
    await store.append({ id: "apr_b", ...baseDraft, actionPlanId: "act_y" });
    const x = await store.forAction("act_x");
    expect(x).toHaveLength(1);
    expect(x[0]?.id).toBe("apr_a");
  });
});

describe("isApprovalActive", () => {
  it("treats expired entries as inactive", () => {
    const past = "2020-01-01T00:00:00.000Z";
    const entry = appendApprovalEntry([], { id: "apr_x", ...baseDraft, expiresAt: past });
    expect(isApprovalActive(entry, Date.now())).toBe(false);
  });

  it("treats forever (null expiry) as active", () => {
    const entry = appendApprovalEntry([], { id: "apr_y", ...baseDraft });
    expect(isApprovalActive(entry)).toBe(true);
  });

  it("treats revoked entries as inactive", () => {
    const entry = appendApprovalEntry([], {
      id: "apr_z",
      ...baseDraft,
      revokedAt: "2026-05-06T00:00:00.000Z",
    });
    expect(isApprovalActive(entry)).toBe(false);
  });
});
