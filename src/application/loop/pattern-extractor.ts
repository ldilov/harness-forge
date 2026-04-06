import path from "node:path";
import { readJsonFile, exists } from "../../shared/index.js";

/** A single extracted pattern from session history. */
export interface ExtractedPattern {
  readonly id: string;
  readonly type: "convention" | "anti-pattern" | "optimization" | "workflow";
  readonly finding: string;
  readonly confidence: number;
  readonly extractedAt: string;
}

/**
 * Extract patterns from session history in the workspace.
 *
 * Reads `.hforge/runtime/events` and applies heuristic extraction.
 * Returns an empty array when no events are available.
 */
export async function extractPatterns(workspaceRoot: string): Promise<readonly ExtractedPattern[]> {
  const eventsDir = path.join(workspaceRoot, ".hforge/runtime/events");
  if (!(await exists(eventsDir))) {
    return [];
  }

  // Stub: future implementation will analyse event streams.
  // Return empty for now so the CLI wiring is exercised end-to-end.
  return [];
}
