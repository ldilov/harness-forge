import { ValidationError } from "../../shared/index.js";
import type { RecursiveActionBundle } from "../../domain/recursive/action-bundle.js";
import { parseRecursiveActionBundle } from "../../domain/recursive/action-bundle.js";

export interface ParseActionBundleInput {
  sessionId: string;
  iterationId: string;
  sourceText: string;
}

export function parseActionBundle(input: ParseActionBundleInput): RecursiveActionBundle {
  let parsed: unknown;
  try {
    parsed = JSON.parse(input.sourceText);
  } catch (error) {
    throw new ValidationError(`Recursive action bundle must be valid JSON: ${error instanceof Error ? error.message : String(error)}`);
  }

  if (!parsed || typeof parsed !== "object") {
    throw new ValidationError("Recursive action bundle must decode to an object.");
  }

  const record = parsed as Record<string, unknown>;
  return parseRecursiveActionBundle({
    bundleId: typeof record.bundleId === "string" ? record.bundleId : `BUNDLE-${Date.now()}`,
    sessionId: input.sessionId,
    iterationId: input.iterationId,
    intent: typeof record.intent === "string" ? record.intent : "Execute typed recursive actions",
    actions: record.actions,
    stopDirective: record.stopDirective,
    modelTier: typeof record.modelTier === "string" ? record.modelTier : "root",
    createdAt: typeof record.createdAt === "string" ? record.createdAt : new Date().toISOString()
  });
}
