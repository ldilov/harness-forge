import { z } from "zod";
import { AuthorityLevelSchema } from "../action/action-plan.js";
import type { AuthorityLevel } from "../action/action-plan.js";

export const ProfileNameSchema = z.enum(["observe", "cautious", "assisted", "active", "maintainer"]);
export type ProfileName = z.infer<typeof ProfileNameSchema>;

export const ProfileSchema = z
  .object({
    name: ProfileNameSchema,
    defaultLevel: AuthorityLevelSchema,
    requireApproval: z.array(AuthorityLevelSchema).default([]),
    deny: z.array(z.string()).default([]),
  })
  .strict();
export type Profile = z.infer<typeof ProfileSchema>;

export const ActiveProfileSchema = z
  .object({
    name: ProfileNameSchema,
    defaultLevel: AuthorityLevelSchema,
    selectedAt: z.string().min(1),
    selectedBy: z.string().min(1),
  })
  .strict();
export type ActiveProfile = z.infer<typeof ActiveProfileSchema>;

const PROFILES: Readonly<Record<ProfileName, Profile>> = {
  observe: ProfileSchema.parse({
    name: "observe",
    defaultLevel: "A0",
    requireApproval: ["A1", "A2", "A3", "A4", "A5"],
    deny: [],
  }),
  cautious: ProfileSchema.parse({
    name: "cautious",
    defaultLevel: "A1",
    requireApproval: ["A2", "A3", "A4", "A5"],
    deny: ["merge", "deploy.production", "delete.remote_branch", "modify.secrets", "run.destructive_command"],
  }),
  assisted: ProfileSchema.parse({
    name: "assisted",
    defaultLevel: "A2",
    requireApproval: ["A3", "A4", "A5"],
    deny: ["merge", "deploy.production", "delete.remote_branch", "modify.secrets"],
  }),
  active: ProfileSchema.parse({
    name: "active",
    defaultLevel: "A3",
    requireApproval: ["A4", "A5"],
    deny: ["merge", "deploy.production", "delete.remote_branch", "modify.secrets"],
  }),
  maintainer: ProfileSchema.parse({
    name: "maintainer",
    defaultLevel: "A4",
    requireApproval: ["A5"],
    deny: ["merge", "deploy.production", "delete.remote_branch", "modify.secrets"],
  }),
};

export function builtInProfile(name: ProfileName): Profile {
  return PROFILES[name];
}

export function profileNames(): readonly ProfileName[] {
  return Object.keys(PROFILES) as ProfileName[];
}

export function defaultActiveProfile(): ActiveProfile {
  return ActiveProfileSchema.parse({
    name: "cautious",
    defaultLevel: "A1",
    selectedAt: "1970-01-01T00:00:00.000Z",
    selectedBy: "default",
  });
}

export function requiresApproval(profile: Profile, requested: AuthorityLevel): boolean {
  return profile.requireApproval.includes(requested);
}
