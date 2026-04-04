import { readFile, rename, unlink, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

export async function applyRollover(
  basePath: string,
  activeContextPath: string,
): Promise<void> {
  const sourcePath = join(basePath, activeContextPath);
  const tempPath = `${sourcePath}.tmp`;

  const content = await readFile(sourcePath, 'utf-8');

  await writeFile(tempPath, content, 'utf-8');

  try {
    JSON.parse(await readFile(tempPath, 'utf-8'));
  } catch (error: unknown) {
    await unlink(tempPath).catch(() => undefined);
    const message = error instanceof Error ? error.message : 'Unknown validation error';
    throw new Error(`Rollover validation failed: ${message}`);
  }

  await rename(tempPath, sourcePath);
}
