import path from 'node:path';

import { writeJsonFile } from '../../../shared/index.js';
import {
  MemorySessionSummarySchema,
  type MemorySessionSummary,
} from '../../../domain/compaction/memory/memory-session-summary.js';

export async function writeSessionSummary(
  basePath: string,
  data: MemorySessionSummary,
): Promise<void> {
  const validated = MemorySessionSummarySchema.parse(data);
  const destination = path.join(basePath, 'memory-state.json');
  await writeJsonFile(destination, validated);
}
