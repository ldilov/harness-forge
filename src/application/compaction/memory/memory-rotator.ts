import path from 'node:path';

import { readTextFile, writeTextFile, exists } from '../../../shared/fs.js';
import type { MemorySessionSummary } from '../../../domain/compaction/memory/memory-session-summary.js';
import type { BehaviorEventEmitter } from '../../behavior/behavior-event-emitter.js';
import { shouldRotateMemory } from './memory-rotation-trigger.js';
import { archiveMemory } from './memory-archiver.js';

interface RotationResult {
  readonly archived: boolean;
  readonly archivePath?: string;
}

function parseSection(content: string, heading: string): string[] {
  const regex = new RegExp(`## ${heading}\\s*\\n([\\s\\S]*?)(?=\\n## |$)`, 'g');
  const match = regex.exec(content);
  if (!match?.[1]) return [];
  return match[1]
    .split('\n')
    .map((line) => line.replace(/^- /, '').trim())
    .filter(Boolean);
}

function parseObjective(content: string): string {
  const regex = /## Current Objective\s*\n([\s\S]*?)(?=\n## |$)/;
  const match = regex.exec(content);
  return match?.[1]?.trim() ?? '';
}

function extractSummary(content: string): MemorySessionSummary {
  return {
    objective: parseObjective(content),
    state: parseSection(content, 'Current State'),
    decisions: parseSection(content, 'Accepted Decisions'),
    constraints: parseSection(content, 'Constraints'),
    blockers: parseSection(content, 'Open Questions / Blockers'),
    nextActions: parseSection(content, 'Next Best Actions'),
    references: parseSection(content, 'Canonical References'),
  };
}

function buildRotatedContent(summary: MemorySessionSummary, previousText: string): string {
  const sections: string[] = [
    '# Session Memory',
    '',
    '## Current Objective',
    summary.objective,
    '',
    '## Current State',
    ...summary.state.slice(-3).map((s) => `- ${s}`),
    '',
    '## Accepted Decisions',
    ...summary.decisions.slice(-5).map((d) => `- ${d}`),
    '',
    '## Open Questions / Blockers',
    ...summary.blockers.map((b) => `- ${b}`),
    '',
    '## Next Best Actions',
    ...summary.nextActions.map((a) => `- ${a}`),
    '',
    '## Canonical References',
    ...summary.references.map((r) => `- ${r}`),
    '',
    '## Previous Summary',
    previousText,
  ];

  return `${sections.join('\n')}\n`;
}

function condenseSummary(summary: MemorySessionSummary): string {
  const parts: string[] = [];
  parts.push(`Objective: ${summary.objective}`);
  if (summary.decisions.length > 0) {
    parts.push(`Key decisions: ${summary.decisions.slice(-3).join('; ')}`);
  }
  if (summary.state.length > 0) {
    parts.push(`Final state: ${summary.state.slice(-2).join('; ')}`);
  }
  return parts.join('\n');
}

export async function rotateMemory(
  workspaceRoot: string,
  basePath: string = '.hforge/runtime',
  emitter?: BehaviorEventEmitter,
): Promise<RotationResult> {
  const memoryPath = path.join(workspaceRoot, 'memory.md');

  if (!(await exists(memoryPath))) {
    return { archived: false };
  }

  const content = await readTextFile(memoryPath);

  if (!shouldRotateMemory(content)) {
    return { archived: false };
  }

  const startTime = Date.now();
  const tokensBefore = Math.ceil(content.length / 4);
  emitter?.emitMemoryRotationStarted({
    tokensBefore,
    memoryPath,
  });

  const summary = extractSummary(content);
  const archivePath = await archiveMemory(summary, basePath);

  const previousText = condenseSummary(summary);
  const rotatedContent = buildRotatedContent(summary, previousText);
  await writeTextFile(memoryPath, rotatedContent);

  const tokensAfter = Math.ceil(rotatedContent.length / 4);
  emitter?.emitMemoryRotation({
    automatic: true,
    tokensBefore,
    tokensAfter,
    archivedSections: summary.decisions.length + summary.state.length,
    durationMs: Date.now() - startTime,
  });

  return { archived: true, archivePath };
}
