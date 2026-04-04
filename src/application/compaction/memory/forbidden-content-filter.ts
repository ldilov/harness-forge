import { FORBIDDEN_PATTERNS } from '../../../domain/compaction/memory/memory-content-rules.js';

const CODE_FENCE_REGEX = /```[\s\S]*?```/g;
const MAX_CODE_BLOCK_LINES = 50;

function hasLargeCodeBlock(content: string): boolean {
  const fences = content.match(CODE_FENCE_REGEX) ?? [];
  return fences.some((block) => {
    const lineCount = block.split('\n').length - 2;
    return lineCount > MAX_CODE_BLOCK_LINES;
  });
}

export function containsForbiddenContent(content: string): {
  hasForbidden: boolean;
  matches: string[];
} {
  const lower = content.toLowerCase();
  const matches: string[] = [];

  for (const pattern of FORBIDDEN_PATTERNS) {
    if (lower.includes(pattern)) {
      matches.push(pattern);
    }
  }

  if (hasLargeCodeBlock(content)) {
    matches.push('large code block');
  }

  return { hasForbidden: matches.length > 0, matches: Array.from(new Set(matches)) };
}
