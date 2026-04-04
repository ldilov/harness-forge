import { appendFile, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

export async function appendNdjson(filePath: string, data: unknown): Promise<void> {
  await mkdir(dirname(filePath), { recursive: true });
  const line = JSON.stringify(data) + '\n';
  await appendFile(filePath, line, 'utf-8');
}
