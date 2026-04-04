import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { StartupFileGenerator } from '../../src/application/behavior/startup-file-generator.js';
import { LoadOrderSchema } from '../../src/domain/behavior/load-order.js';
import { MemoryPolicySchema } from '../../src/domain/behavior/memory-policy.js';
import { SubagentBriefPolicySchema } from '../../src/domain/behavior/subagent-brief-policy.js';
import { ContextBudgetSchema } from '../../src/domain/compaction/context-budget.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-test-'));
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('StartupFileGenerator', () => {
  it('generates all 7 required files', async () => {
    const gen = new StartupFileGenerator(tmpDir);
    const files = await gen.generate();
    expect(files.length).toBe(7);

    for (const f of files) {
      const stat = await fs.stat(f.absolutePath);
      expect(stat.isFile()).toBe(true);
    }
  });

  it('generates memory.md with correct sections', async () => {
    const gen = new StartupFileGenerator(tmpDir);
    await gen.generate();

    const content = await fs.readFile(path.join(tmpDir, 'memory.md'), 'utf8');
    expect(content).toContain('## Current Objective');
    expect(content).toContain('## Accepted Decisions');
    expect(content).toContain('## Canonical References');
  });

  it('generates load-order.json that parses against schema', async () => {
    const gen = new StartupFileGenerator(tmpDir);
    await gen.generate();

    const raw = await fs.readFile(path.join(tmpDir, '.hforge/runtime/load-order.json'), 'utf8');
    const parsed = LoadOrderSchema.parse(JSON.parse(raw));
    expect(parsed.conflictPolicy).toBe('runtime_wins');
    expect(parsed.historyPolicy).toBe('deny_by_default');
  });

  it('generates memory-policy.json that parses against schema', async () => {
    const gen = new StartupFileGenerator(tmpDir);
    await gen.generate();

    const raw = await fs.readFile(path.join(tmpDir, '.hforge/runtime/memory-policy.json'), 'utf8');
    const parsed = MemoryPolicySchema.parse(JSON.parse(raw));
    expect(parsed.hardCapTokens).toBe(4000);
  });

  it('generates context-budget.json that parses against schema', async () => {
    const gen = new StartupFileGenerator(tmpDir);
    await gen.generate();

    const raw = await fs.readFile(path.join(tmpDir, '.hforge/runtime/context-budget.json'), 'utf8');
    const parsed = ContextBudgetSchema.parse(JSON.parse(raw));
    expect(parsed.thresholds.trimAt).toBe(0.80);
  });

  it('generates default-brief-policy.json that parses against schema', async () => {
    const gen = new StartupFileGenerator(tmpDir);
    await gen.generate();

    const raw = await fs.readFile(
      path.join(tmpDir, '.hforge/runtime/subagents/default-brief-policy.json'),
      'utf8',
    );
    const parsed = SubagentBriefPolicySchema.parse(JSON.parse(raw));
    expect(parsed.defaultResponseProfile).toBe('brief');
  });

  it('is idempotent on re-run', async () => {
    const gen = new StartupFileGenerator(tmpDir);
    const first = await gen.generate();
    const second = await gen.generate();
    expect(first.length).toBe(second.length);
  });
});
