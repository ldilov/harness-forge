import { canonicalJson } from "../../../shared/canonical-json.js";
import { sha256Hex } from "../../../shared/sha256.js";
import {
  ApprovalChainSchema,
  ApprovalEntrySchema,
  type ApprovalEntry,
} from "../../../domain/sentinel/policy/approval.js";

export class ApprovalChainTamperedError extends Error {
  constructor(readonly atIndex: number, readonly entryId: string) {
    super(`approval chain tampered at index ${atIndex} (entry ${entryId})`);
    this.name = "ApprovalChainTamperedError";
  }
}

function entryHash(payload: Omit<ApprovalEntry, "hash">): string {
  return sha256Hex(canonicalJson(payload));
}

export function appendApprovalEntry(
  chain: readonly ApprovalEntry[],
  draft: Omit<ApprovalEntry, "prevHash" | "hash">,
): ApprovalEntry {
  const prev = chain.length === 0 ? null : chain[chain.length - 1] ?? null;
  const prevHash = prev === null ? null : prev.hash;
  const withPrev: Omit<ApprovalEntry, "hash"> = { ...draft, prevHash };
  const hash = entryHash(withPrev);
  return ApprovalEntrySchema.parse({ ...withPrev, hash });
}

export function verifyApprovalChain(chain: readonly ApprovalEntry[]): void {
  const validated = ApprovalChainSchema.parse(chain);
  let expectedPrev: string | null = null;
  for (let i = 0; i < validated.length; i += 1) {
    const entry = validated[i]!;
    if (entry.prevHash !== expectedPrev) {
      throw new ApprovalChainTamperedError(i, entry.id);
    }
    const recomputed = entryHash({
      id: entry.id,
      actionPlanId: entry.actionPlanId,
      approvedBy: entry.approvedBy,
      approvedAt: entry.approvedAt,
      authorityGranted: entry.authorityGranted,
      expiresAt: entry.expiresAt,
      scope: entry.scope,
      revokedAt: entry.revokedAt,
      prevHash: entry.prevHash,
    });
    if (recomputed !== entry.hash) {
      throw new ApprovalChainTamperedError(i, entry.id);
    }
    expectedPrev = entry.hash;
  }
}
