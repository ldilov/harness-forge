import { describe, expect, it } from 'vitest';
import { SubagentBriefPolicySchema, SUBAGENT_ALLOWED_FIELDS, SUBAGENT_DENIED_FIELDS } from '../../src/domain/behavior/subagent-brief-policy.js';

describe('subagent-brief-policy contract', () => {
  it('parses with all defaults', () => {
    const result = SubagentBriefPolicySchema.parse({});
    expect(result.schemaVersion).toBe('1.0.0');
    expect(result.defaultResponseProfile).toBe('brief');
  });

  it('defaults allow list to SUBAGENT_ALLOWED_FIELDS', () => {
    const result = SubagentBriefPolicySchema.parse({});
    for (const field of SUBAGENT_ALLOWED_FIELDS) {
      expect(result.allow).toContain(field);
    }
  });

  it('defaults deny list to SUBAGENT_DENIED_FIELDS', () => {
    const result = SubagentBriefPolicySchema.parse({});
    for (const field of SUBAGENT_DENIED_FIELDS) {
      expect(result.denyByDefault).toContain(field);
    }
  });

  it('accepts custom response profile', () => {
    const result = SubagentBriefPolicySchema.parse({ defaultResponseProfile: 'standard' });
    expect(result.defaultResponseProfile).toBe('standard');
  });

  it('rejects invalid response profile', () => {
    expect(() => SubagentBriefPolicySchema.parse({ defaultResponseProfile: 'invalid' })).toThrow();
  });
});
