import path from 'node:path';

import {
  RUNTIME_DIR,
  RUNTIME_CONTEXT_DIR,
  RUNTIME_MEMORY_FILE,
} from '@shared/constants.js';
import { exists, readTextFile, writeJsonFile } from '@shared/fs.js';
import type { BehaviorEventEmitter } from './behavior-event-emitter.js';

/**
 * Updates behavior promotion artifacts after compaction triggers fire.
 * Implements AC-8 wiring: connects ThresholdTrigger/WorkflowTrigger outputs
 * to behavior promotion runtime files.
 */

export interface CompactionArtifactUpdate {
  readonly updatedFiles: readonly string[];
  readonly memoryWordCount: number;
  readonly estimatedTokens: number;
}

export class CompactionArtifactUpdater {
  private readonly workspaceRoot: string;
  private readonly emitter?: BehaviorEventEmitter;

  constructor(workspaceRoot: string, emitter?: BehaviorEventEmitter) {
    this.workspaceRoot = workspaceRoot;
    this.emitter = emitter;
  }

  /**
   * After a compaction event, update the delta-summary and compaction-manifest
   * in the runtime context directory.
   */
  async updateAfterCompaction(params: {
    readonly compactionLevel: string;
    readonly tokensBefore: number;
    readonly tokensAfter: number;
    readonly removedSections: readonly string[];
  }): Promise<CompactionArtifactUpdate> {
    const contextDir = path.join(this.workspaceRoot, RUNTIME_DIR, RUNTIME_CONTEXT_DIR);
    const updatedFiles: string[] = [];

    // Update delta-summary.json
    const deltaSummaryPath = path.join(contextDir, 'delta-summary.json');
    const deltaSummary = {
      schemaVersion: '1.0.0',
      lastCompactionLevel: params.compactionLevel,
      tokensBefore: params.tokensBefore,
      tokensAfter: params.tokensAfter,
      timestamp: new Date().toISOString(),
    };
    await writeJsonFile(deltaSummaryPath, deltaSummary);
    updatedFiles.push(deltaSummaryPath);

    // Update compaction-manifest.json
    const manifestPath = path.join(contextDir, 'compaction-manifest.json');
    const manifest = {
      schemaVersion: '1.0.0',
      lastCompaction: {
        level: params.compactionLevel,
        tokensBefore: params.tokensBefore,
        tokensAfter: params.tokensAfter,
        removedSections: [...params.removedSections],
        timestamp: new Date().toISOString(),
      },
    };
    await writeJsonFile(manifestPath, manifest);
    updatedFiles.push(manifestPath);

    // Read current MEMORY.md size for reporting
    const memoryPath = path.join(this.workspaceRoot, RUNTIME_MEMORY_FILE);
    let memoryWordCount = 0;
    let estimatedTokens = 0;
    if (await exists(memoryPath)) {
      const content = await readTextFile(memoryPath);
      memoryWordCount = content.split(/\s+/).filter(Boolean).length;
      estimatedTokens = Math.ceil(content.length / 4);
    }

    this.emitter?.emitContextDelta({
      compactionLevel: params.compactionLevel,
      tokensBefore: params.tokensBefore,
      tokensAfter: params.tokensAfter,
      updatedFiles: updatedFiles.length,
      memoryWordCount,
      estimatedTokens,
    });

    return { updatedFiles, memoryWordCount, estimatedTokens };
  }
}
