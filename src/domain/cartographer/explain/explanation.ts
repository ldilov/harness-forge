import { z } from "zod";

export const EXPLANATION_SCHEMA_VERSION = 1;

export const explanationKindSchema = z.enum([
  "impact",
  "context",
  "diff",
  "pr-narrative",
  "pr-checklist",
]);

const SINGLE_LINE = /^[^\r\n]+$/;

export const explanationSectionSchema = z.object({
  heading: z.string().min(1).max(256).regex(SINGLE_LINE),
  body: z.array(z.string().min(1).max(2048).regex(SINGLE_LINE)).max(200).default([]),
});

export const explanationSchema = z.object({
  schemaVersion: z.literal(EXPLANATION_SCHEMA_VERSION),
  id: z.string().min(1),
  kind: explanationKindSchema,
  createdAt: z.string().min(1),
  subject: z.string().min(1).max(256).regex(SINGLE_LINE),
  summary: z.string().min(1).max(2048).regex(SINGLE_LINE),
  sections: z.array(explanationSectionSchema).max(50).default([]),
  sourceRefs: z.array(z.string().min(1).max(512).regex(SINGLE_LINE)).max(100).default([]),
});

export type ExplanationKind = z.infer<typeof explanationKindSchema>;
export type ExplanationSection = z.infer<typeof explanationSectionSchema>;
export type Explanation = z.infer<typeof explanationSchema>;

export function parseExplanation(value: unknown): Explanation {
  return explanationSchema.parse(value);
}

function oneLine(value: string): string {
  return value.replace(/[\r\n]+/g, " ");
}

export function renderExplanationMarkdown(explanation: Explanation): string {
  const lines: string[] = [];
  lines.push(`# ${oneLine(explanation.subject)}`, "");
  lines.push(`> ${oneLine(explanation.summary)}`, "");
  for (const section of explanation.sections) {
    lines.push(`## ${oneLine(section.heading)}`);
    for (const item of section.body) {
      lines.push(`- ${oneLine(item)}`);
    }
    lines.push("");
  }
  if (explanation.sourceRefs.length > 0) {
    lines.push("## Sources");
    for (const ref of explanation.sourceRefs) {
      lines.push(`- ${oneLine(ref)}`);
    }
  }
  return `${lines.join("\n").trimEnd()}\n`;
}
