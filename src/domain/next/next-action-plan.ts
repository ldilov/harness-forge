import { z } from "zod";
import { evidenceItemSchema } from "../shared/evidence-item.js";

export const followUpActionSchema = z.object({
  actionId: z.string().min(1),
  title: z.string().min(1),
  command: z.string().min(1),
  reason: z.string().min(1),
});

export type FollowUpAction = z.infer<typeof followUpActionSchema>;

export const actionClassificationSchema = z.enum([
  "safe-auto",
  "safe-manual",
  "review-required",
  "unsafe-for-auto",
]);

export type ActionClassification = z.infer<typeof actionClassificationSchema>;

export const workspacePhaseSchema = z.enum([
  "setup",
  "operate",
  "maintain",
  "recover",
  "unknown",
]);

export type WorkspacePhase = z.infer<typeof workspacePhaseSchema>;

export const nextActionPlanSchema = z.object({
  generatedAt: z.string().min(1),
  root: z.string().min(1),
  phase: workspacePhaseSchema,
  actionId: z.string().min(1),
  title: z.string().min(1),
  command: z.string().min(1),
  summary: z.string().min(1),
  confidence: z.number().min(0).max(1),
  safeToAutoApply: z.boolean(),
  classification: actionClassificationSchema,
  evidence: z.array(evidenceItemSchema),
  blockingConditions: z.array(z.string()),
  followUps: z.array(followUpActionSchema),
  alternatives: z.array(followUpActionSchema),
}).refine(
  (data) => data.safeToAutoApply === (data.classification === "safe-auto"),
  { message: "safeToAutoApply must be true only when classification is safe-auto" }
);

export type NextActionPlan = z.infer<typeof nextActionPlanSchema>;

export function parseNextActionPlan(value: unknown): NextActionPlan {
  return nextActionPlanSchema.parse(value);
}
