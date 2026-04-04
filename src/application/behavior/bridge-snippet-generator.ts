import { type BridgeContract } from '@domain/behavior/bridge-contract.js';

export class BridgeSnippetGenerator {
  generateMarkdownSnippet(contract: BridgeContract): string {
    const lines: string[] = [
      '## Behavior Contract',
      '',
      '### Resume Order',
      ...contract.resumeOrder.map((item, i) => `${i + 1}. \`${item}\``),
      '',
      '### Rules',
      `- **Conflict**: ${contract.conflictRule}`,
      `- **History**: ${contract.historyRule}`,
      `- **Subagent**: ${contract.subagentRule}`,
      `- **Output**: ${contract.outputRule}`,
      '',
      '### Canonical Runtime',
      ...contract.canonicalRuntimePointers.map(p => `- \`${p}\``),
      '',
    ];
    return lines.join('\n');
  }
}
