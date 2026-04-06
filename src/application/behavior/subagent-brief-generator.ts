import { z } from 'zod';
import { type SubagentBrief, BriefDecisionSchema } from '@domain/behavior/subagent-brief.js';

type BriefDecision = z.infer<typeof BriefDecisionSchema>;
import { type SubagentBriefPolicy } from '@domain/behavior/subagent-brief-policy.js';
import { SUBAGENT_FORBIDDEN_FIELDS } from '@domain/compaction/memory/memory-content-rules.js';
import { generateId } from '@shared/id-generator.js';
import { nowISO } from '@shared/timestamps.js';
import type { BehaviorEventEmitter } from './behavior-event-emitter.js';

export interface BriefGenerationParams {
  readonly taskObjective: string;
  readonly taskScope: string;
  readonly allDecisions: readonly BriefDecision[];
  readonly allConstraints: readonly string[];
  readonly latestDelta: readonly string[];
  readonly allReferences: readonly string[];
  readonly policy: SubagentBriefPolicy;
  readonly maxInputTokens: number;
  readonly maxOutputTokens: number;
}

const CHARS_PER_TOKEN = 4;

export class SubagentBriefGenerator {
  private readonly emitter?: BehaviorEventEmitter;

  constructor(emitter?: BehaviorEventEmitter) {
    this.emitter = emitter;
  }

  generate(params: BriefGenerationParams): SubagentBrief {
    const objectiveKeywords = extractKeywords(params.taskObjective);

    const relevantDecisions = params.allDecisions.filter((d) =>
      hasKeywordOverlap(objectiveKeywords, extractKeywords(d.title)),
    );

    const relevantConstraints = params.allConstraints.filter((c) =>
      hasKeywordOverlap(objectiveKeywords, extractKeywords(c)),
    );

    const filteredDecisions = excludeForbiddenContent(relevantDecisions);

    const responseProfile = params.policy.defaultResponseProfile;

    const brief: SubagentBrief = {
      briefId: generateId('brief'),
      generatedAt: nowISO(),
      objective: params.taskObjective,
      scope: params.taskScope,
      relevantDecisions: filteredDecisions,
      constraints: relevantConstraints,
      latestDelta: [...params.latestDelta],
      references: [...params.allReferences],
      responseProfile,
      budget: {
        maxInputTokens: params.maxInputTokens,
        maxOutputTokens: params.maxOutputTokens,
      },
      estimatedTokens: 0,
      sourceStateType: 'compacted',
    };

    const finalBrief = {
      ...brief,
      estimatedTokens: estimateTokens(brief),
    };

    this.emitter?.emitSubagentBrief({
      objective: finalBrief.objective,
      estimatedTokens: finalBrief.estimatedTokens,
      responseProfile: finalBrief.responseProfile,
      sourceStateType: finalBrief.sourceStateType,
      decisionsIncluded: finalBrief.relevantDecisions.length,
    });

    return finalBrief;
  }
}

function extractKeywords(text: string): readonly string[] {
  return text
    .toLowerCase()
    .split(/\W+/)
    .filter((w) => w.length > 2);
}

function hasKeywordOverlap(
  a: readonly string[],
  b: readonly string[],
): boolean {
  const setB = new Set(b);
  return a.some((word) => setB.has(word));
}

function excludeForbiddenContent(
  decisions: readonly BriefDecision[],
): BriefDecision[] {
  const forbidden = new Set<string>(SUBAGENT_FORBIDDEN_FIELDS);
  return decisions.filter(
    (d) => !forbidden.has(d.title) && !forbidden.has(d.id),
  );
}

function estimateTokens(brief: SubagentBrief): number {
  const json = JSON.stringify(brief);
  return Math.ceil(json.length / CHARS_PER_TOKEN);
}
