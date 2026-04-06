import { createHash } from 'node:crypto';

import { type DuplicateSuppressionResult } from '@domain/behavior/duplicate-suppression.js';
import type { BehaviorEventEmitter } from './behavior-event-emitter.js';

export interface ContextSource {
  readonly path: string;
  readonly type: 'bridge' | 'wrapper' | 'runtime';
  readonly content: string;
}

export class DuplicateSuppressor {
  private readonly emitter?: BehaviorEventEmitter;

  constructor(emitter?: BehaviorEventEmitter) {
    this.emitter = emitter;
  }

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
        suppressed.push({
          path: existing.path,
          type: existing.type,
          reason: `Duplicate of runtime source ${source.path}`,
        });
        const idx = surviving.findIndex((s) => s.path === existing.path);
        if (idx >= 0) {
          surviving[idx] = { path: source.path, type: source.type };
        }
        hashMap.set(hash, source);
      } else {
        suppressed.push({
          path: source.path,
          type: source.type,
          reason: `Duplicate of ${existing.type} source ${existing.path}`,
        });
      }
    }

    if (suppressed.length > 0) {
      this.emitter?.emitDuplicateSuppressed({
        suppressionCounts: { total: sources.length, suppressed: suppressed.length },
        suppressedSources: suppressed,
      });
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
