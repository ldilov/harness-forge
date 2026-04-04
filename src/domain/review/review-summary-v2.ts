import { z } from "zod";

export const reviewChangeItemSchema = z.object({
  path: z.string().min(1),
  kind: z.enum(["create", "update", "preserve", "delete", "unknown"]),
  description: z.string().min(1),
  layer: z.enum(["canonical-runtime", "target-bridge", "generated", "state", "unknown"]),
});

export type ReviewChangeItem = z.infer<typeof reviewChangeItemSchema>;

export const reviewSummaryV2Schema = z.object({
  generatedAt: z.string().min(1),
  workspaceRoot: z.string().min(1),
  recommendedInstall: z.object({
    targets: z.array(z.string().min(1)),
    profile: z.string().min(1),
    modules: z.array(z.string().min(1)),
  }),
  why: z.array(z.string().min(1)),
  targetDifferences: z.array(z.string().min(1)),
  topChanges: z.array(reviewChangeItemSchema),
  warnings: z.array(z.string().min(1)),
  fullWritePlan: z.array(reviewChangeItemSchema),
  directCommandPreview: z.string().min(1),
});

export type ReviewSummaryV2 = z.infer<typeof reviewSummaryV2Schema>;

export function parseReviewSummaryV2(value: unknown): ReviewSummaryV2 {
  return reviewSummaryV2Schema.parse(value);
}
