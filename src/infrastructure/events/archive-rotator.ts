import { mkdir, readFile, rename, stat, writeFile } from 'node:fs/promises';
import { join } from 'node:path';
import { toDateStamp } from '@shared/timestamps.js';

async function fileExists(filePath: string): Promise<boolean> {
  try {
    await stat(filePath);
    return true;
  } catch {
    return false;
  }
}

async function isNonEmpty(filePath: string): Promise<boolean> {
  try {
    const info = await stat(filePath);
    return info.size > 0;
  } catch {
    return false;
  }
}

export async function rotateArchive(
  basePath: string = '.hforge/runtime/events',
): Promise<string | null> {
  const currentPath = join(basePath, 'current.ndjson');

  if (!(await isNonEmpty(currentPath))) {
    return null;
  }

  const archiveDir = join(basePath, 'archive');
  await mkdir(archiveDir, { recursive: true });

  const dateStamp = toDateStamp();
  let archiveName = `${dateStamp}.ndjson`;
  let archivePath = join(archiveDir, archiveName);

  let counter = 1;
  while (await fileExists(archivePath)) {
    archiveName = `${dateStamp}-${counter}.ndjson`;
    archivePath = join(archiveDir, archiveName);
    counter += 1;
  }

  await rename(currentPath, archivePath);
  await writeFile(currentPath, '', 'utf-8');

  return archivePath;
}
