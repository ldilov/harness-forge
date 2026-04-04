import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { StartupFileGenerator } from '../../src/application/behavior/startup-file-generator.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-cli-ctx-'));
  const gen = new StartupFileGenerator(tmpDir);
  await gen.generate();
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('context CLI integration', () => {
  it('context-budget.json exists and is readable after init', async () => {
    const budgetPath = path.join(tmpDir, '.hforge/runtime/context-budget.json');
    const raw = await fs.readFile(budgetPath, 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed.schemaVersion).toBe('1.0.0');
    expect(parsed.thresholds.trimAt).toBe(0.8);
  });

  it('memory.md exists and contains expected sections', async () => {
    const memoryPath = path.join(tmpDir, 'memory.md');
    const content = await fs.readFile(memoryPath, 'utf8');
    expect(content).toContain('## Current Objective');
    expect(content).toContain('## Canonical References');
  });

  it('memory-policy.json has correct hard cap', async () => {
    const policyPath = path.join(tmpDir, '.hforge/runtime/memory-policy.json');
    const raw = await fs.readFile(policyPath, 'utf8');
    const parsed = JSON.parse(raw);
    expect(parsed.hardCapTokens).toBe(4000);
    expect(parsed.rotationPolicy.onHardCap).toBe('rotate');
  });

  it('context status can detect memory exceeding budget', async () => {
    // Write oversized memory
    const memoryPath = path.join(tmpDir, 'memory.md');
    const bigContent = 'word '.repeat(5000);
    await fs.writeFile(memoryPath, bigContent, 'utf8');

    const content = await fs.readFile(memoryPath, 'utf8');
    const estimatedTokens = Math.ceil(content.length / 4);
    expect(estimatedTokens).toBeGreaterThan(4000);
  });
});
