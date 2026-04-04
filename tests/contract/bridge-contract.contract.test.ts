import { describe, expect, it } from 'vitest';

import { BridgeContractSchema } from '@domain/behavior/bridge-contract.js';

describe('BridgeContract contract', () => {
  it('parses defaults from an empty object', () => {
    const result = BridgeContractSchema.parse({});
    expect(result.schemaVersion).toBe('1.0.0');
    expect(result.resumeOrder).toBeInstanceOf(Array);
    expect(result.resumeOrder.length).toBeGreaterThan(0);
  });

  it('has non-empty string rules', () => {
    const contract = BridgeContractSchema.parse({});
    expect(contract.conflictRule.length).toBeGreaterThan(0);
    expect(contract.historyRule.length).toBeGreaterThan(0);
    expect(contract.subagentRule.length).toBeGreaterThan(0);
    expect(contract.outputRule.length).toBeGreaterThan(0);
  });

  it('has non-empty canonicalRuntimePointers', () => {
    const contract = BridgeContractSchema.parse({});
    expect(contract.canonicalRuntimePointers).toBeInstanceOf(Array);
    expect(contract.canonicalRuntimePointers.length).toBeGreaterThan(0);
    for (const pointer of contract.canonicalRuntimePointers) {
      expect(pointer.length).toBeGreaterThan(0);
    }
  });

  it('rejects empty strings in resumeOrder', () => {
    expect(() => BridgeContractSchema.parse({ resumeOrder: [''] })).toThrow();
  });

  it('rejects empty strings in canonicalRuntimePointers', () => {
    expect(() => BridgeContractSchema.parse({ canonicalRuntimePointers: [''] })).toThrow();
  });
});
