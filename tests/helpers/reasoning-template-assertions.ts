import fs from "node:fs/promises";
import path from "node:path";

import { expect } from "vitest";

export const rootDir = process.cwd();

export async function readText(relativePath: string): Promise<string> {
  return fs.readFile(path.join(rootDir, relativePath), "utf8");
}

export async function expectContainsAll(relativePath: string, fragments: string[]): Promise<void> {
  const content = await readText(relativePath);
  for (const fragment of fragments) {
    expect(content).toContain(fragment);
  }
}

export async function exists(relativePath: string): Promise<boolean> {
  try {
    await fs.access(path.join(rootDir, relativePath));
    return true;
  } catch {
    return false;
  }
}

export function normalizeLineEndings(value: string): string {
  return value.replace(/\r\n/g, "\n");
}
