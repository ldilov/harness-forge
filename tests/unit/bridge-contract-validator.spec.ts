import { describe, expect, it } from 'vitest';

import { BridgeContractSchema } from '@domain/behavior/bridge-contract.js';
import { BridgeContractValidator } from '@app/behavior/bridge-contract-validator.js';

describe('BridgeContractValidator', () => {
  const validator = new BridgeContractValidator();

  it('passes when all contracts match', () => {
    const contract = BridgeContractSchema.parse({});
    const result = validator.validate([
      { target: 'agentA', contract },
      { target: 'agentB', contract },
      { target: 'agentC', contract },
    ]);
    expect(result.valid).toBe(true);
    expect(result.diffs).toHaveLength(0);
  });

  it('passes with a single contract', () => {
    const contract = BridgeContractSchema.parse({});
    const result = validator.validate([{ target: 'solo', contract }]);
    expect(result.valid).toBe(true);
    expect(result.diffs).toHaveLength(0);
  });

  it('passes with empty array', () => {
    const result = validator.validate([]);
    expect(result.valid).toBe(true);
    expect(result.diffs).toHaveLength(0);
  });

  it('detects conflictRule divergence', () => {
    const base = BridgeContractSchema.parse({});
    const altered = BridgeContractSchema.parse({ conflictRule: 'Always trust memory.md.' });
    const result = validator.validate([
      { target: 'agentA', contract: base },
      { target: 'agentB', contract: altered },
    ]);
    expect(result.valid).toBe(false);
    expect(result.diffs.some(d => d.includes('conflictRule'))).toBe(true);
    expect(result.diffs.some(d => d.includes('agentA'))).toBe(true);
    expect(result.diffs.some(d => d.includes('agentB'))).toBe(true);
  });

  it('detects historyRule divergence', () => {
    const base = BridgeContractSchema.parse({});
    const altered = BridgeContractSchema.parse({ historyRule: 'Always expand full history.' });
    const result = validator.validate([
      { target: 'x', contract: base },
      { target: 'y', contract: altered },
    ]);
    expect(result.valid).toBe(false);
    expect(result.diffs.some(d => d.includes('historyRule'))).toBe(true);
  });

  it('detects subagentRule divergence', () => {
    const base = BridgeContractSchema.parse({});
    const altered = BridgeContractSchema.parse({ subagentRule: 'Give full context to subagents.' });
    const result = validator.validate([
      { target: 'x', contract: base },
      { target: 'y', contract: altered },
    ]);
    expect(result.valid).toBe(false);
    expect(result.diffs.some(d => d.includes('subagentRule'))).toBe(true);
  });

  it('detects outputRule divergence', () => {
    const base = BridgeContractSchema.parse({});
    const altered = BridgeContractSchema.parse({ outputRule: 'Always use deep output.' });
    const result = validator.validate([
      { target: 'x', contract: base },
      { target: 'y', contract: altered },
    ]);
    expect(result.valid).toBe(false);
    expect(result.diffs.some(d => d.includes('outputRule'))).toBe(true);
  });

  it('detects resumeOrder divergence', () => {
    const base = BridgeContractSchema.parse({});
    const altered = BridgeContractSchema.parse({ resumeOrder: ['only-one-file.md'] });
    const result = validator.validate([
      { target: 'x', contract: base },
      { target: 'y', contract: altered },
    ]);
    expect(result.valid).toBe(false);
    expect(result.diffs.some(d => d.includes('resumeOrder'))).toBe(true);
  });

  it('reports multiple diffs when several rules diverge', () => {
    const base = BridgeContractSchema.parse({});
    const altered = BridgeContractSchema.parse({
      conflictRule: 'different',
      historyRule: 'different',
    });
    const result = validator.validate([
      { target: 'a', contract: base },
      { target: 'b', contract: altered },
    ]);
    expect(result.valid).toBe(false);
    expect(result.diffs.length).toBeGreaterThanOrEqual(2);
  });
});
