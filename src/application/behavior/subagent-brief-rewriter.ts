import { type SubagentBrief } from '@domain/behavior/subagent-brief.js';
import type { BehaviorEventEmitter } from './behavior-event-emitter.js';

export type RewriteResult =
  | { readonly rewritten: SubagentBrief; readonly truncatedDecisions: number }
  | { readonly rejected: true; readonly reason: string };

const CHARS_PER_TOKEN = 4;

export class SubagentBriefRewriter {
  private readonly emitter?: BehaviorEventEmitter;

  constructor(emitter?: BehaviorEventEmitter) {
    this.emitter = emitter;
  }

  rewrite(brief: SubagentBrief, maxTokens: number): RewriteResult {
    let current = brief;
    let truncatedCount = 0;

    while (
      estimateTokens(current) > maxTokens &&
      current.relevantDecisions.length > 0
    ) {
      current = {
        ...current,
        relevantDecisions: current.relevantDecisions.slice(0, -1),
      };
      truncatedCount++;
    }

    // Try removing optional arrays if still over budget
    if (estimateTokens(current) > maxTokens) {
      current = { ...current, references: [] };
    }
    if (estimateTokens(current) > maxTokens) {
      current = { ...current, latestDelta: [] };
    }
    if (estimateTokens(current) > maxTokens) {
      current = { ...current, constraints: [] };
    }

    const finalTokens = estimateTokens(current);

    if (finalTokens > maxTokens) {
      this.emitter?.emitSubagentBriefRejected({
        reason: `Brief still exceeds ${maxTokens} tokens (${finalTokens}) after removing all optional content`,
        estimatedTokens: finalTokens,
        maxTokens,
      });
      return {
        rejected: true,
        reason: `Brief still exceeds ${maxTokens} tokens (${finalTokens}) after removing all optional content`,
      };
    }

    this.emitter?.emitSubagentBriefRewritten({
      truncatedDecisions: truncatedCount,
      tokensBefore: estimateTokens(brief),
      tokensAfter: finalTokens,
      maxTokens,
    });

    return {
      rewritten: {
        ...current,
        estimatedTokens: finalTokens,
      },
      truncatedDecisions: truncatedCount,
    };
  }
}

function estimateTokens(brief: SubagentBrief): number {
  const json = JSON.stringify(brief);
  return Math.ceil(json.length / CHARS_PER_TOKEN);
}
