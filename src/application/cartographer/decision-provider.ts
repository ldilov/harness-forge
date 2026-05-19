import { loadDecisionIndex } from "../runtime/decision-runtime-store.js";
import type { RankedRef } from "../../domain/cartographer/context/context-bundle.js";

export interface DecisionProvider {
  readonly id: string;
  relevantDecisions(goal: string, seedFiles: readonly string[]): Promise<readonly RankedRef[]>;
}

function tokenize(value: string): readonly string[] {
  return value
    .toLowerCase()
    .split(/[^a-z0-9]+/)
    .filter((token) => token.length > 2);
}

export class HarnessDecisionProvider implements DecisionProvider {
  readonly id = "harness-decision-index";

  constructor(private readonly workspaceRoot: string) {}

  async relevantDecisions(goal: string, seedFiles: readonly string[]): Promise<readonly RankedRef[]> {
    const index = await loadDecisionIndex(this.workspaceRoot);
    if (index.entries.length === 0) {
      return [];
    }
    const goalTokens = new Set(tokenize(goal));
    const seedTokens = new Set(seedFiles.flatMap((file) => tokenize(file)));
    const refs: RankedRef[] = [];
    for (const entry of index.entries) {
      const titleTokens = tokenize(entry.title);
      const matched = titleTokens.filter((token) => goalTokens.has(token) || seedTokens.has(token));
      const accepted = entry.status === "accepted";
      const baseScore = accepted ? 2 : 1;
      const score = baseScore + matched.length;
      if (matched.length === 0) {
        continue;
      }
      const stale = entry.status === "superseded" || entry.status === "rejected";
      refs.push({
        id: entry.id,
        path: entry.path,
        title: `${entry.title}${stale ? " (stale)" : ""}`,
        score,
        reason: accepted
          ? `accepted ${entry.recordType.toUpperCase()} relevant to goal/seed`
          : `${entry.status} ${entry.recordType.toUpperCase()} mentioned by goal/seed`,
        evidence: [{ kind: "decision", ref: entry.path }],
      });
    }
    return refs.sort((a, b) => b.score - a.score || a.id.localeCompare(b.id));
  }
}
