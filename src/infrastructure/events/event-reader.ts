import { readFile } from 'node:fs/promises';
import { join } from 'node:path';
import type { EventEnvelope } from '@domain/observability/events/event-envelope.js';

export class EventReader {
  private readonly basePath: string;

  constructor(basePath: string = '.hforge/runtime/events') {
    this.basePath = basePath;
  }

  async readAll(filePath?: string): Promise<EventEnvelope[]> {
    const target = filePath ?? join(this.basePath, 'current.ndjson');
    let content: string;

    try {
      content = await readFile(target, 'utf-8');
    } catch {
      return [];
    }

    const lines = content.split('\n');
    const events: EventEnvelope[] = [];

    for (const line of lines) {
      const trimmed = line.trim();
      if (trimmed.length === 0) {
        continue;
      }
      events.push(JSON.parse(trimmed) as EventEnvelope);
    }

    return events;
  }

  filterEvents(
    events: readonly EventEnvelope[],
    filters: {
      readonly eventType?: string;
      readonly category?: string;
      readonly taskId?: string;
      readonly correlationId?: string;
      readonly importance?: string;
    },
  ): EventEnvelope[] {
    return events.filter((event) => {
      if (filters.eventType !== undefined && event.eventType !== filters.eventType) {
        return false;
      }
      if (filters.category !== undefined && event.category !== filters.category) {
        return false;
      }
      if (filters.taskId !== undefined && event.taskId !== filters.taskId) {
        return false;
      }
      if (filters.correlationId !== undefined && event.correlationId !== filters.correlationId) {
        return false;
      }
      if (filters.importance !== undefined && event.importance !== filters.importance) {
        return false;
      }
      return true;
    });
  }
}
