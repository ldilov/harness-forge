import { z } from "zod";

export const DEFAULT_DENIED_PATHS: readonly string[] = [
  ".env",
  ".env.*",
  "**/secrets/**",
  "**/*.pem",
  "**/*.key",
  "**/id_rsa",
  "**/credentials.json",
];

export const DEFAULT_DENIED_COMMANDS: readonly string[] = [
  "rm -rf /",
  "git push --force",
  "npm publish",
  "pnpm publish",
  "yarn publish",
  "docker system prune",
  "kubectl delete",
  "terraform apply",
  "terraform destroy",
];

export const DeniedPathsSchema = z
  .object({
    deniedPaths: z.array(z.string()).default([]),
  })
  .strict();
export type DeniedPathsConfig = z.infer<typeof DeniedPathsSchema>;

export const DeniedCommandsSchema = z
  .object({
    deniedCommands: z.array(z.string()).default([]),
  })
  .strict();
export type DeniedCommandsConfig = z.infer<typeof DeniedCommandsSchema>;
