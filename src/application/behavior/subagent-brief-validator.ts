import { type SubagentBrief } from '@domain/behavior/subagent-brief.js';
import { type SubagentBriefPolicy } from '@domain/behavior/subagent-brief-policy.js';

export interface BriefValidationResult {
  readonly valid: boolean;
  readonly violations: readonly string[];
}

const BRIEF_CONTENT_FIELDS = [
  'objective',
  'scope',
  'relevantDecisions',
  'constraints',
  'latestDelta',
  'references',
  'responseProfile',
  'budget',
] as const;

export class SubagentBriefValidator {
  validate(
    brief: SubagentBrief,
    policy: SubagentBriefPolicy,
  ): BriefValidationResult {
    const violations: string[] = [];
    const allowSet = new Set(policy.allow);
    const denySet = new Set(policy.denyByDefault);

    for (const field of BRIEF_CONTENT_FIELDS) {
      if (!allowSet.has(field)) {
        violations.push(`Field "${field}" is not in the policy allow list`);
      }
    }

    for (const field of BRIEF_CONTENT_FIELDS) {
      if (denySet.has(field)) {
        violations.push(
          `Field "${field}" appears in the policy denyByDefault list`,
        );
      }
    }

    if (brief.estimatedTokens > brief.budget.maxInputTokens) {
      violations.push(
        `Estimated tokens (${brief.estimatedTokens}) exceed budget maxInputTokens (${brief.budget.maxInputTokens})`,
      );
    }

    return {
      valid: violations.length === 0,
      violations,
    };
  }
}
