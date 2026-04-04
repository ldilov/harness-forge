import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { StartupFileGenerator } from '../../src/application/behavior/startup-file-generator.js';
import { SubagentBriefPolicySchema } from '../../src/domain/behavior/subagent-brief-policy.js';

let tmpDir: string;

beforeEach(async () => {
  tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), 'hforge-cli-sub-'));
  const gen = new StartupFileGenerator(tmpDir);
  await gen.generate();
});

afterEach(async () => {
  await fs.rm(tmpDir, { recursive: true, force: true });
});

describe('subagents CLI integration', () => {
  it('default-brief-policy.json is readable and valid', async () => {
    const policyPath = path.join(tmpDir, '.hforge/runtime/subagents/default-brief-policy.json');
    const raw = await fs.readFile(policyPath, 'utf8');
    const parsed = SubagentBriefPolicySchema.parse(JSON.parse(raw));
    expect(parsed.defaultResponseProfile).toBe('brief');
    expect(parsed.allow).toContain('objective');
    expect(parsed.denyByDefault).toContain('fullMemory');
  });

  it('policy contains all expected allowed fields', async () => {
    const policyPath = path.join(tmpDir, '.hforge/runtime/subagents/default-brief-policy.json');
    const raw = await fs.readFile(policyPath, 'utf8');
    const parsed = SubagentBriefPolicySchema.parse(JSON.parse(raw));
    const expectedAllowed = ['objective', 'scope', 'relevantDecisions', 'constraints', 'latestDelta', 'references', 'responseProfile', 'budget'];
    for (const field of expectedAllowed) {
      expect(parsed.allow).toContain(field);
    }
  });

  it('policy contains all expected denied fields', async () => {
    const policyPath = path.join(tmpDir, '.hforge/runtime/subagents/default-brief-policy.json');
    const raw = await fs.readFile(policyPath, 'utf8');
    const parsed = SubagentBriefPolicySchema.parse(JSON.parse(raw));
    const expectedDenied = ['fullMemory', 'fullSessionSummary', 'fullEventHistory', 'unrelatedArtifacts'];
    for (const field of expectedDenied) {
      expect(parsed.denyByDefault).toContain(field);
    }
  });
});
