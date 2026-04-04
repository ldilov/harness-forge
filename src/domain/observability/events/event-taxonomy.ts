import type { Importance } from './event-importance.js';

export const EventCategories = {
  LIFECYCLE: 'lifecycle',
  COMMAND: 'command',
  ERROR: 'error',
  DECISION: 'decision',
  FILE: 'file',
  METRIC: 'metric',
} as const;

export type EventCategory = (typeof EventCategories)[keyof typeof EventCategories];

export const EventTypes = {
  TASK_STARTED: 'task.started',
  TASK_COMPLETED: 'task.completed',
  TASK_FAILED: 'task.failed',
  SESSION_STARTED: 'session.started',
  SESSION_ENDED: 'session.ended',
  COMMAND_INVOKED: 'command.invoked',
  COMMAND_COMPLETED: 'command.completed',
  ERROR_OCCURRED: 'error.occurred',
  DECISION_MADE: 'decision.made',
  FILE_CHANGED: 'file.changed',
  METRIC_RECORDED: 'metric.recorded',
} as const;

export type EventType = (typeof EventTypes)[keyof typeof EventTypes];

export const DEFAULT_IMPORTANCE: Record<string, Importance> = {
  [EventTypes.TASK_STARTED]: 'medium',
  [EventTypes.TASK_COMPLETED]: 'medium',
  [EventTypes.TASK_FAILED]: 'high',
  [EventTypes.SESSION_STARTED]: 'low',
  [EventTypes.SESSION_ENDED]: 'low',
  [EventTypes.COMMAND_INVOKED]: 'low',
  [EventTypes.COMMAND_COMPLETED]: 'low',
  [EventTypes.ERROR_OCCURRED]: 'high',
  [EventTypes.DECISION_MADE]: 'medium',
  [EventTypes.FILE_CHANGED]: 'trace',
  [EventTypes.METRIC_RECORDED]: 'trace',
};
