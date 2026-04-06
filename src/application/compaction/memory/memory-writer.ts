import path from 'node:path';

import { writeTextFile } from '../../../shared/index.js';

interface MemoryWriterInput {
  readonly objective: string;
  readonly state: readonly string[];
  readonly decisions: readonly string[];
  readonly constraints: readonly string[];
  readonly blockers: readonly string[];
  readonly nextActions: readonly string[];
  readonly references: readonly string[];
  readonly previousSummary?: string;
}

function bulletList(items: readonly string[]): string {
  return items.map((item) => `- ${item}`).join('\n');
}

function renderMemoryMd(data: MemoryWriterInput): string {
  const sections: string[] = [
    '# Session Memory',
    '',
    '## Current Objective',
    data.objective,
    '',
    '## Current State',
    bulletList(data.state),
    '',
    '## Accepted Decisions',
    bulletList(data.decisions),
  ];

  if (data.constraints.length > 0) {
    sections.push('', '## Constraints', bulletList(data.constraints));
  }

  sections.push(
    '',
    '## Open Questions / Blockers',
    bulletList(data.blockers),
    '',
    '## Next Best Actions',
    bulletList(data.nextActions),
    '',
    '## Canonical References',
    bulletList(data.references),
  );

  if (data.previousSummary !== undefined) {
    sections.push('', '## Previous Summary', data.previousSummary);
  }

  return `${sections.join('\n')}\n`;
}

export async function writeMemoryMd(
  workspaceRoot: string,
  data: MemoryWriterInput,
): Promise<string> {
  const content = renderMemoryMd(data);
  const destination = path.join(workspaceRoot, 'MEMORY.md');
  await writeTextFile(destination, content);
  return content;
}
