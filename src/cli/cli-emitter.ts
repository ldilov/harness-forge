import path from 'node:path';
import { randomBytes } from 'node:crypto';
import { BehaviorEventEmitter } from '../application/behavior/behavior-event-emitter.js';
import { createPersistenceListener, createNdjsonPersistenceListener } from '../application/behavior/event-persistence-listener.js';
import { OBSERVABILITY_DIR, OBSERVABILITY_EVENTS_FILE } from '../shared/index.js';

export const cliSessionId = `cli_${randomBytes(8).toString('hex')}`;
export const cliEmitter = new BehaviorEventEmitter(cliSessionId);

let resolvedWorkspaceRoot = process.cwd();

export function setWorkspaceRoot(root: string): void {
  resolvedWorkspaceRoot = path.resolve(root);
}

function getEventsJsonPath(): string {
  return path.join(resolvedWorkspaceRoot, OBSERVABILITY_DIR, OBSERVABILITY_EVENTS_FILE);
}

function getEventsNdjsonPath(): string {
  return path.join(resolvedWorkspaceRoot, OBSERVABILITY_DIR, 'events.ndjson');
}

cliEmitter.onEvent(createPersistenceListener(getEventsJsonPath));
cliEmitter.onEvent(createNdjsonPersistenceListener(getEventsNdjsonPath));
