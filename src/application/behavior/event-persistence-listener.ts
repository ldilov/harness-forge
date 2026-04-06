import fs from 'node:fs/promises';
import path from 'node:path';
import type { BehaviorEvent, BehaviorEventListener } from './behavior-event-emitter.js';

/**
 * Creates a listener that appends each BehaviorEvent to a JSON array file.
 * Uses a serial write queue to prevent concurrent file corruption.
 *
 * Accepts either a static path string or a zero-arg function that resolves
 * the path lazily on each write — so the listener tracks `--root` changes.
 */
export function createPersistenceListener(getEventsJsonPath: string | (() => string)): BehaviorEventListener {
  const resolvePath = typeof getEventsJsonPath === 'function' ? getEventsJsonPath : () => getEventsJsonPath;
  let writeQueue: Promise<void> = Promise.resolve();

  return (event: BehaviorEvent): void => {
    writeQueue = writeQueue.then(async () => {
      const eventsJsonPath = resolvePath();
      await fs.mkdir(path.dirname(eventsJsonPath), { recursive: true });
      let events: unknown[] = [];
      try {
        const content = await fs.readFile(eventsJsonPath, 'utf8');
        events = JSON.parse(content) as unknown[];
      } catch {
      }
      const updated = [...events, event];
      await fs.writeFile(eventsJsonPath, JSON.stringify(updated, null, 2), 'utf8');
    }).catch(() => {
    });
  };
}

export function createNdjsonPersistenceListener(ndjsonPath: string | (() => string)): BehaviorEventListener {
  const resolvePath = typeof ndjsonPath === 'function' ? ndjsonPath : () => ndjsonPath;
  let writeQueue: Promise<void> = Promise.resolve();

  return (event: BehaviorEvent): void => {
    writeQueue = writeQueue.then(async () => {
      const filePath = resolvePath();
      await fs.mkdir(path.dirname(filePath), { recursive: true });
      await fs.appendFile(filePath, JSON.stringify(event) + '\n', 'utf8');
    }).catch(() => {
    });
  };
}

export async function readNdjsonEvents(ndjsonPath: string): Promise<readonly BehaviorEvent[]> {
  try {
    const content = await fs.readFile(ndjsonPath, 'utf8');
    return content
      .split('\n')
      .filter((line) => line.trim().length > 0)
      .map((line) => JSON.parse(line) as BehaviorEvent);
  } catch {
    return [];
  }
}
