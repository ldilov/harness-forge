import fs from "node:fs/promises";
import path from "node:path";

import type { InstallOperation } from "../../domain/operations/install-plan.js";
import { ensureDir, exists } from "../../shared/index.js";

async function copyFile(sourcePath: string, destinationPath: string): Promise<void> {
  await ensureDir(path.dirname(destinationPath));
  await fs.copyFile(sourcePath, destinationPath);
}

async function copyDirectory(sourcePath: string, destinationPath: string): Promise<void> {
  await ensureDir(destinationPath);
  const entries = await fs.readdir(sourcePath, { withFileTypes: true });

  for (const entry of entries) {
    const nextSource = path.join(sourcePath, entry.name);
    const nextDestination = path.join(destinationPath, entry.name);

    if (entry.isDirectory()) {
      await copyDirectory(nextSource, nextDestination);
      continue;
    }

    await copyFile(nextSource, nextDestination);
  }
}

async function copyPath(sourcePath: string, destinationPath: string): Promise<void> {
  const stats = await fs.stat(sourcePath);
  if (stats.isDirectory()) {
    await copyDirectory(sourcePath, destinationPath);
    return;
  }

  await copyFile(sourcePath, destinationPath);
}

async function mergeJsonFile(sourcePath: string, destinationPath: string): Promise<void> {
  const source = JSON.parse(await fs.readFile(sourcePath, "utf8")) as Record<string, unknown>;
  const existing = (await exists(destinationPath))
    ? (JSON.parse(await fs.readFile(destinationPath, "utf8")) as Record<string, unknown>)
    : {};

  await ensureDir(path.dirname(destinationPath));
  await fs.writeFile(destinationPath, `${JSON.stringify({ ...existing, ...source }, null, 2)}\n`, "utf8");
}

export async function applyOperation(operation: InstallOperation): Promise<string> {
  if (operation.type === "skip") {
    return `Skipped ${operation.destinationPath}`;
  }

  if (operation.type === "remove") {
    if (await exists(operation.destinationPath)) {
      await fs.rm(operation.destinationPath, { force: true, recursive: true });
    }
    return `Removed ${operation.destinationPath}`;
  }

  if (operation.type === "append-once") {
    await ensureDir(path.dirname(operation.destinationPath));
    const marker = `<!-- hforge:${operation.bundleId}:${path.basename(operation.sourcePath)} -->`;
    const payload = await fs.readFile(operation.sourcePath, "utf8");
    const next = `${marker}\n${payload.trimEnd()}\n`;
    if (await exists(operation.destinationPath)) {
      const current = await fs.readFile(operation.destinationPath, "utf8");
      if (!current.includes(marker)) {
        const separator = current.endsWith("\n") ? "\n" : "\n\n";
        await fs.appendFile(operation.destinationPath, `${separator}${next}`, "utf8");
      }
    } else {
      await fs.writeFile(operation.destinationPath, next, "utf8");
    }
    return `Appended ${operation.destinationPath}`;
  }

  if (operation.type === "merge") {
    if (operation.destinationPath.endsWith(".json")) {
      await mergeJsonFile(operation.sourcePath, operation.destinationPath);
      return `Merged ${operation.destinationPath}`;
    }

    await copyPath(operation.sourcePath, operation.destinationPath);
    return `Merged ${operation.destinationPath}`;
  }

  await copyPath(operation.sourcePath, operation.destinationPath);
  return `Wrote ${operation.destinationPath}`;
}
