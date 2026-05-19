import { z } from "zod";

export const WorldSourceKindSchema = z.enum(["npm", "github", "security", "runtime", "custom"]);
export type WorldSourceKind = z.infer<typeof WorldSourceKindSchema>;

export const WorldEventSchema = z
  .object({
    source: z.string().min(1),
    kind: z.string().min(1),
    subject: z.string().min(1),
    version: z.string().optional(),
    url: z.string().optional(),
    publishedAt: z.string().optional(),
    raw: z.unknown(),
  })
  .strict();
export type WorldEvent = z.infer<typeof WorldEventSchema>;

export const WorldWatchRefSchema = z
  .object({
    kind: WorldSourceKindSchema,
    name: z.string().min(1),
  })
  .strict();
export type WorldWatchRef = z.infer<typeof WorldWatchRefSchema>;

export const WorldSourcesFileSchema = z
  .object({
    enabled: z.boolean().default(true),
    intervalSeconds: z.number().int().positive().default(6 * 60 * 60),
    watch: z
      .object({
        npm: z.array(z.string()).default([]),
        github: z.array(z.string()).default([]),
        runtime: z.array(z.string()).default([]),
      })
      .default({}),
    policies: z
      .object({
        maxSignalsPerRun: z.number().int().positive().default(20),
        suppressMajorReleaseNoiseFor: z.string().default("7d"),
        npmPerHour: z.number().int().positive().default(30),
        githubPerHour: z.number().int().positive().default(60),
        relevanceFloor: z.number().min(0).max(1).default(0.4),
      })
      .default({}),
  })
  .strict();
export type WorldSourcesFile = z.infer<typeof WorldSourcesFileSchema>;

export const WorldCursorsFileSchema = z
  .object({
    cursors: z.record(z.string(), z.string().nullable()).default({}),
  })
  .strict();
export type WorldCursorsFile = z.infer<typeof WorldCursorsFileSchema>;

export function defaultWorldSources(): WorldSourcesFile {
  return WorldSourcesFileSchema.parse({});
}

export function watchKey(ref: WorldWatchRef): string {
  return `${ref.kind}:${ref.name}`;
}

export function parseWatchRef(value: string): WorldWatchRef | null {
  const colon = value.indexOf(":");
  if (colon <= 0 || colon === value.length - 1) {
    return null;
  }
  const kind = value.slice(0, colon);
  const name = value.slice(colon + 1).trim();
  if (name.length === 0) {
    return null;
  }
  const parsed = WorldSourceKindSchema.safeParse(kind);
  if (!parsed.success) {
    return null;
  }
  return { kind: parsed.data, name };
}
