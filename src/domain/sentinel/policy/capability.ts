import { z } from "zod";

export const CAPABILITY_TOKENS = [
  "repo.read",
  "repo.local_write",
  "repo.branch_create",
  "repo.pr_create",
  "github.issue_create",
  "command.run",
  "command.test",
  "network.npm_registry",
  "network.github_api",
  "hforge.runtime_write",
] as const;

export const CapabilityTokenSchema = z.enum(CAPABILITY_TOKENS);
export type CapabilityToken = z.infer<typeof CapabilityTokenSchema>;
