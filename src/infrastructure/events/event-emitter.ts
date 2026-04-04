import { join } from 'node:path';
import { generateId } from '@shared/id-generator.js';
import { nowISO } from '@shared/timestamps.js';
import {
  EventEnvelopeSchema,
  type EventEnvelope,
} from '@domain/observability/events/event-envelope.js';
import { appendNdjson } from './ndjson-writer.js';

const moduleSessionId = generateId('session');

export class EventEmitter {
  private readonly basePath: string;

  constructor(basePath: string = '.hforge/runtime/events') {
    this.basePath = basePath;
  }

  async emit(
    eventData: Partial<EventEnvelope> & Pick<EventEnvelope, 'eventType' | 'payload'>,
  ): Promise<EventEnvelope> {
    const envelope: EventEnvelope = EventEnvelopeSchema.parse({
      eventId: generateId('event'),
      occurredAt: nowISO(),
      schemaVersion: '1.0.0',
      runtimeSessionId: moduleSessionId,
      ...eventData,
    });

    const filePath = join(this.basePath, 'current.ndjson');
    await appendNdjson(filePath, envelope);

    return envelope;
  }
}
