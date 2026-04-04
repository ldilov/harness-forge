import { describe, it, expect } from 'vitest';

import { containsForbiddenContent } from '../../src/application/compaction/memory/forbidden-content-filter.js';

describe('containsForbiddenContent', () => {
  it('detects forbidden pattern: full chat transcript', () => {
    const result = containsForbiddenContent('This includes a Full Chat Transcript of the session.');
    expect(result.hasForbidden).toBe(true);
    expect(result.matches).toContain('full chat transcript');
  });

  it('detects forbidden pattern: tool output dump', () => {
    const result = containsForbiddenContent('Here is the tool output dump from the run.');
    expect(result.hasForbidden).toBe(true);
    expect(result.matches).toContain('tool output dump');
  });

  it('detects large code blocks exceeding 50 lines', () => {
    const lines = Array.from({ length: 60 }, (_, i) => `line ${i}`).join('\n');
    const content = `Some text\n\`\`\`ts\n${lines}\n\`\`\`\nMore text`;
    const result = containsForbiddenContent(content);
    expect(result.hasForbidden).toBe(true);
    expect(result.matches).toContain('large code block');
  });

  it('returns no matches for clean content', () => {
    const result = containsForbiddenContent('This is a clean summary with no forbidden patterns.');
    expect(result.hasForbidden).toBe(false);
    expect(result.matches).toHaveLength(0);
  });
});
