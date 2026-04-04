import { describe, expect, it } from 'vitest';
import { MemoryPolicySchema } from '../../src/domain/behavior/memory-policy.js';
import { ALLOWED_SECTIONS, FORBIDDEN_PATTERNS, SIZE_BUDGET } from '../../src/domain/compaction/memory/memory-content-rules.js';

describe('memory-policy contract', () => {
  it('parses with all defaults', () => {
    const result = MemoryPolicySchema.parse({});
    expect(result.schemaVersion).toBe('1.0.0');
    expect(result.targetWords.min).toBe(SIZE_BUDGET.targetMinWords);
    expect(result.targetWords.max).toBe(SIZE_BUDGET.targetMaxWords);
    expect(result.hardCapTokens).toBe(SIZE_BUDGET.hardCapTokens);
  });

  it('defaults allowed sections to ALLOWED_SECTIONS constant', () => {
    const result = MemoryPolicySchema.parse({});
    for (const section of ALLOWED_SECTIONS) {
      expect(result.allowedSections).toContain(section);
    }
  });

  it('defaults forbidden content to FORBIDDEN_PATTERNS constant', () => {
    const result = MemoryPolicySchema.parse({});
    for (const pattern of FORBIDDEN_PATTERNS) {
      expect(result.forbiddenContent).toContain(pattern);
    }
  });

  it('defaults rotation policy to rotate on hard cap', () => {
    const result = MemoryPolicySchema.parse({});
    expect(result.rotationPolicy.onHardCap).toBe('rotate');
    expect(result.rotationPolicy.onMilestone).toBe('summarize');
  });

  it('accepts custom target words', () => {
    const result = MemoryPolicySchema.parse({ targetWords: { min: 100, max: 500 } });
    expect(result.targetWords.min).toBe(100);
    expect(result.targetWords.max).toBe(500);
  });
});
