import { z } from "zod";
import { AuthorityLevelSchema } from "../action/action-plan.js";

export const ApprovalEntrySchema = z
  .object({
    id: z.string().min(1),
    actionPlanId: z.string().min(1),
    approvedBy: z.string().min(1),
    approvedAt: z.string().min(1),
    authorityGranted: AuthorityLevelSchema,
    expiresAt: z.string().nullable(),
    scope: z.array(z.string()).default([]),
    revokedAt: z.string().nullable().default(null),
    prevHash: z.string().nullable(),
    hash: z.string().min(1),
  })
  .strict();
export type ApprovalEntry = z.infer<typeof ApprovalEntrySchema>;

export const ApprovalChainSchema = z.array(ApprovalEntrySchema);
export type ApprovalChain = z.infer<typeof ApprovalChainSchema>;

export function isApprovalActive(entry: ApprovalEntry, now: number = Date.now()): boolean {
  if (entry.revokedAt !== null) {
    return false;
  }
  if (entry.expiresAt === null) {
    return true;
  }
  const expires = Date.parse(entry.expiresAt);
  if (Number.isNaN(expires)) {
    return false;
  }
  return expires > now;
}
