import { createHash } from 'node:crypto';

import { type DuplicateSuppressionResult } from '@domain/behavior/duplicate-suppression.js';

export interface ContextSource {
  readonly path: string;
  readonly type: 'bridge' | 'wrapper' | 'runtime';
  readonly content: string;
}

/**
 * Deduplicates context sources by content hash.
 * Canonical "runtime" type always wins when duplicates are detected.
 */
export class DuplicateSuppressor {
  suppress(sources: readonly ContextSource[]): DuplicateSuppressionResult {
    const hashMap = new Map<string, ContextSource>();
    const surviving: Array<{ path: string; type: 'bridge' | 'wrapper' | 'runtime' }> = [];
    const suppressed: Array<{ path: string; type: string; reason: string }> = [];

    for (const source of sources) {
      const hash = this.hashContent(source.content);
      const existing = hashMap.get(hash);

      if (!existing) {
        hashMap.set(hash, source);
        surviving.push({ path: source.path, type: source.type });
      } else if (source.type === 'runtime' && existing.type !== 'runtime') {
        // Runtime wins — replace the existing non-runtime source
        suppressed.push({
          path: existing.path,
          type: existing.type,
          reason: `Duplicate of runtime source ${source.path}`,
        });
        // Replace surviving entry
        const idx = surviving.findIndex((s) => s.path === existing.path);
        if (idx >= 0) {
          surviving[idx] = { path: source.path, type: source.type };
        }
        hashMap.set(hash, source);
      } else {
        // Existing wins (either both same type, or existing is runtime)
        suppressed.push({
          path: source.path,
          type: source.type,
          reason: `Duplicate of ${existing.type} source ${existing.path}`,
        });
      }
    }

    return {
      totalSources: sources.length,
      suppressedCount: suppressed.length,
      survivingSources: surviving,
      suppressedSources: suppressed,
    };
  }

  private hashContent(content: string): string {
    return createHash('sha256').update(content).digest('hex');
  }
}
