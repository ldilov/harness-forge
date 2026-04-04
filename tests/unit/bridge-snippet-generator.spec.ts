import { describe, expect, it } from 'vitest';

import { BridgeContractSchema } from '@domain/behavior/bridge-contract.js';
import { BridgeSnippetGenerator } from '@app/behavior/bridge-snippet-generator.js';

describe('BridgeSnippetGenerator', () => {
  const generator = new BridgeSnippetGenerator();
  const contract = BridgeContractSchema.parse({});

  it('contains all 5 rules', () => {
    const snippet = generator.generateMarkdownSnippet(contract);
    expect(snippet).toContain('**Conflict**');
    expect(snippet).toContain('**History**');
    expect(snippet).toContain('**Subagent**');
    expect(snippet).toContain('**Output**');
    expect(snippet).toContain('### Resume Order');
  });

  it('renders proper markdown format', () => {
    const snippet = generator.generateMarkdownSnippet(contract);
    expect(snippet).toContain('## Behavior Contract');
    expect(snippet).toContain('### Rules');
    expect(snippet).toContain('### Canonical Runtime');
  });

  it('includes numbered resume order items', () => {
    const snippet = generator.generateMarkdownSnippet(contract);
    for (let i = 0; i < contract.resumeOrder.length; i++) {
      expect(snippet).toContain(`${i + 1}. \`${contract.resumeOrder[i]}\``);
    }
  });

  it('includes all canonical runtime pointers', () => {
    const snippet = generator.generateMarkdownSnippet(contract);
    for (const pointer of contract.canonicalRuntimePointers) {
      expect(snippet).toContain(`- \`${pointer}\``);
    }
  });

  it('renders rule content from the contract', () => {
    const snippet = generator.generateMarkdownSnippet(contract);
    expect(snippet).toContain(contract.conflictRule);
    expect(snippet).toContain(contract.historyRule);
    expect(snippet).toContain(contract.subagentRule);
    expect(snippet).toContain(contract.outputRule);
  });
});
