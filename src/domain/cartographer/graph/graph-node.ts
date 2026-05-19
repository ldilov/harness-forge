import { z } from "zod";

export const graphNodeKindSchema = z.enum([
  "file",
  "directory",
  "module",
  "command",
  "test",
  "doc",
  "decision",
  "package",
  "agent-instruction",
  "runtime-artifact",
  "feature",
]);

export const architectureLayerSchema = z.enum([
  "cli",
  "application",
  "domain",
  "infrastructure",
  "shared",
  "dashboard",
  "unknown",
]);

const baseNodeSchema = z.object({
  id: z.string().min(1),
  label: z.string().min(1),
  tags: z.array(z.string().min(1)).default([]),
});

export const fileNodeSchema = baseNodeSchema.extend({
  kind: z.literal("file"),
  path: z.string().min(1),
  language: z.string().optional(),
  sizeBytes: z.number().int().nonnegative(),
  hash: z.string().min(1),
  layer: architectureLayerSchema.default("unknown"),
  exports: z.array(z.string().min(1)).default([]),
  imports: z.array(z.string().min(1)).default([]),
  cyclic: z.boolean().default(false),
});

export const directoryNodeSchema = baseNodeSchema.extend({
  kind: z.literal("directory"),
  path: z.string().min(1),
});

export const moduleNodeSchema = baseNodeSchema.extend({
  kind: z.literal("module"),
  rootPath: z.string().min(1),
  layer: architectureLayerSchema.default("unknown"),
});

export const commandNodeSchema = baseNodeSchema.extend({
  kind: z.literal("command"),
  name: z.string().min(1),
  command: z.string().min(1),
  source: z.enum(["package-json", "makefile", "hforge", "config", "detected"]),
  cost: z.enum(["cheap", "medium", "expensive", "unknown"]).default("unknown"),
});

export const testNodeSchema = baseNodeSchema.extend({
  kind: z.literal("test"),
  path: z.string().min(1),
  framework: z.string().optional(),
});

export const docNodeSchema = baseNodeSchema.extend({
  kind: z.literal("doc"),
  path: z.string().min(1),
});

export const decisionNodeSchema = baseNodeSchema.extend({
  kind: z.literal("decision"),
  title: z.string().min(1),
  status: z.enum(["proposed", "accepted", "rejected", "deferred", "superseded", "unknown"]),
  sourcePath: z.string().min(1),
  recordType: z.enum(["asr", "adr", "external"]).default("external"),
});

export const packageNodeSchema = baseNodeSchema.extend({
  kind: z.literal("package"),
  name: z.string().min(1),
  version: z.string().optional(),
  dependencyKind: z.enum(["direct", "dev", "peer", "optional"]).default("direct"),
});

export const agentInstructionNodeSchema = baseNodeSchema.extend({
  kind: z.literal("agent-instruction"),
  path: z.string().min(1),
});

export const runtimeArtifactNodeSchema = baseNodeSchema.extend({
  kind: z.literal("runtime-artifact"),
  path: z.string().min(1),
});

export const featureNodeSchema = baseNodeSchema.extend({
  kind: z.literal("feature"),
  name: z.string().min(1),
  specPath: z.string().optional(),
});

export const graphNodeSchema = z.discriminatedUnion("kind", [
  fileNodeSchema,
  directoryNodeSchema,
  moduleNodeSchema,
  commandNodeSchema,
  testNodeSchema,
  docNodeSchema,
  decisionNodeSchema,
  packageNodeSchema,
  agentInstructionNodeSchema,
  runtimeArtifactNodeSchema,
  featureNodeSchema,
]);

export type GraphNodeKind = z.infer<typeof graphNodeKindSchema>;
export type ArchitectureLayer = z.infer<typeof architectureLayerSchema>;
export type FileNode = z.infer<typeof fileNodeSchema>;
export type CommandNode = z.infer<typeof commandNodeSchema>;
export type DecisionNode = z.infer<typeof decisionNodeSchema>;
export type GraphNode = z.infer<typeof graphNodeSchema>;

export function parseGraphNode(value: unknown): GraphNode {
  return graphNodeSchema.parse(value);
}

export function layerForPath(relativePath: string): ArchitectureLayer {
  const normalized = relativePath.replace(/\\/g, "/");
  const match = /^src\/([^/]+)\//.exec(normalized);
  if (match === null) {
    return "unknown";
  }
  const segment = match[1];
  if (
    segment === "cli" ||
    segment === "application" ||
    segment === "domain" ||
    segment === "infrastructure" ||
    segment === "shared" ||
    segment === "dashboard"
  ) {
    return segment;
  }
  return "unknown";
}
