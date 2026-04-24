import { z } from "zod";

import { decisionHealthFindingSchema } from "./decision-health.js";

export const decisionChainStatusSchema = z.enum(["complete", "broken", "circular", "branching", "conflicting"]);

export const decisionChainSchema = z.object({
  chainId: z.string().min(1),
  decisionIds: z.array(z.string().min(1)),
  currentDecisionId: z.string().min(1).optional(),
  status: decisionChainStatusSchema,
  findings: z.array(decisionHealthFindingSchema).default([])
});

export type DecisionChainStatus = z.infer<typeof decisionChainStatusSchema>;
export type DecisionChain = z.infer<typeof decisionChainSchema>;

export function parseDecisionChain(value: unknown): DecisionChain {
  return decisionChainSchema.parse(value);
}
