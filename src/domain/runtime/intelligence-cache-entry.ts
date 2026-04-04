import { z } from "zod";

export const intelligenceCacheEntrySchema = z.object({
  cacheKey: z.string().min(1),
  artifactType: z.string().min(1),
  fingerprint: z.string().min(1),
  freshnessState: z.string().min(1),
  artifactRef: z.string().min(1),
  lastComputedAt: z.string().min(1)
});

export type IntelligenceCacheEntry = z.infer<typeof intelligenceCacheEntrySchema>;

export function parseIntelligenceCacheEntry(value: unknown): IntelligenceCacheEntry {
  return intelligenceCacheEntrySchema.parse(value);
}
