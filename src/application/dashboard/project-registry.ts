import fs from 'node:fs/promises';
import path from 'node:path';
import os from 'node:os';

const GLOBAL_HFORGE_DIR = path.join(os.homedir(), '.hforge');
const KNOWN_PROJECTS_FILE = path.join(GLOBAL_HFORGE_DIR, 'known-projects.json');

export interface RegisteredProject {
  readonly rootPath: string;
  readonly name: string;
  readonly lastSeen: string;
  readonly harnessVersion?: string;
}

export async function registerProject(
  rootPath: string,
  harnessVersion?: string,
): Promise<void> {
  const projects = await loadRegistry();
  const absPath = path.resolve(rootPath);
  const name = path.basename(absPath);

  const updated = projects.filter((p) => p.rootPath !== absPath);
  updated.push({
    rootPath: absPath,
    name,
    lastSeen: new Date().toISOString(),
    harnessVersion,
  });

  await saveRegistry(updated);
}

export async function listProjects(): Promise<readonly RegisteredProject[]> {
  const projects = await loadRegistry();
  const validated: RegisteredProject[] = [];

  for (const project of projects) {
    const hforgeDir = path.join(project.rootPath, '.hforge');
    try {
      const stat = await fs.stat(hforgeDir);
      if (stat.isDirectory()) {
        validated.push(project);
      }
    } catch {
      // Project no longer exists or .hforge removed — skip it
    }
  }

  // Sort by lastSeen descending (most recent first)
  validated.sort((a, b) => b.lastSeen.localeCompare(a.lastSeen));
  return validated;
}

export async function unregisterProject(rootPath: string): Promise<void> {
  const projects = await loadRegistry();
  const absPath = path.resolve(rootPath);
  const filtered = projects.filter((p) => p.rootPath !== absPath);
  await saveRegistry(filtered);
}

async function loadRegistry(): Promise<RegisteredProject[]> {
  try {
    const content = await fs.readFile(KNOWN_PROJECTS_FILE, 'utf8');
    return JSON.parse(content) as RegisteredProject[];
  } catch {
    return [];
  }
}

async function saveRegistry(projects: readonly RegisteredProject[]): Promise<void> {
  await fs.mkdir(GLOBAL_HFORGE_DIR, { recursive: true });
  await fs.writeFile(KNOWN_PROJECTS_FILE, JSON.stringify(projects, null, 2), 'utf8');
}
