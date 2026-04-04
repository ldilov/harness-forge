import path from 'node:path';

import { writeJsonFile } from '../../../shared/fs.js';
import { nowISO } from '../../../shared/timestamps.js';
import { MemoryArchiveSchema } from '../../../domain/compaction/memory/memory-archive.js';
import type { MemorySessionSummary } from '../../../domain/compaction/memory/memory-session-summary.js';

export async function archiveMemory(
  data: MemorySessionSummary,
  basePath: string = '.hforge/runtime',
): Promise<string> {
  const archivedAt = nowISO();
  const archive = MemoryArchiveSchema.parse({ ...data, archivedAt });

  const timestamp = archivedAt.replace(/[:.]/g, '-');
  const destination = path.join(basePath, 'memory-history', `${timestamp}.json`);
  await writeJsonFile(destination, archive);

  return destination;
}
