import type { SignalChannelDefinition } from './signal-types.js';
import {
  LOOP_TRACE_RECORDED,
  LOOP_PATTERN_EXTRACTED,
  LOOP_TUNING_APPLIED,
  LOOP_TUNING_REVERTED,
  LOOP_BUNDLE_EXPORTED,
  LOOP_BUNDLE_IMPORTED,
} from '../behavior/behavior-event-types.js';

export const SIGNAL_CHANNELS: readonly SignalChannelDefinition[] = [
  {
    name: 'memory.tokens',
    category: 'memory',
    sourceEventTypes: [
      'context.load.started',
      'context.load.completed',
      'memory.rotation.started',
      'memory.rotation.completed',
    ],
    aggregation: 'gauge',
  },
  {
    name: 'memory.rotation',
    category: 'memory',
    sourceEventTypes: ['memory.rotation.started', 'memory.rotation.completed'],
    aggregation: 'counter',
  },
  {
    name: 'budget.usage',
    category: 'budget',
    sourceEventTypes: ['context.budget.warning', 'context.budget.exceeded'],
    aggregation: 'gauge',
  },
  {
    name: 'budget.state',
    category: 'budget',
    sourceEventTypes: ['context.budget.warning', 'context.budget.exceeded'],
    aggregation: 'none',
  },
  {
    name: 'compaction.activity',
    category: 'compaction',
    sourceEventTypes: ['context.compaction.triggered', 'context.compaction.completed'],
    aggregation: 'counter',
  },
  {
    name: 'compaction.stats',
    category: 'compaction',
    sourceEventTypes: ['context.compaction.completed'],
    aggregation: 'none',
  },
  {
    name: 'subagent.lifecycle',
    category: 'subagent',
    sourceEventTypes: [
      'subagent.brief.generated',
      'subagent.brief.rewritten',
      'subagent.brief.rejected',
      'subagent.run.started',
      'subagent.run.completed',
    ],
    aggregation: 'counter',
  },
  {
    name: 'suppression.activity',
    category: 'suppression',
    sourceEventTypes: ['context.duplicate.suppressed'],
    aggregation: 'counter',
  },
  {
    name: 'expansion.gate',
    category: 'expansion',
    sourceEventTypes: ['history.expansion.requested', 'history.expansion.denied'],
    aggregation: 'counter',
  },
  {
    name: 'artifact.promotion',
    category: 'artifact',
    sourceEventTypes: ['artifact.pointer.promoted'],
    aggregation: 'counter',
  },
  {
    name: 'output.profile',
    category: 'output',
    sourceEventTypes: ['response.profile.selected', 'response.profile.overridden'],
    aggregation: 'counter',
  },
  {
    name: 'context.lifecycle',
    category: 'memory',
    sourceEventTypes: [
      'context.summary.promoted',
      'context.delta.emitted',
      'runtime.startup.files.generated',
    ],
    aggregation: 'counter',
  },
  {
    name: 'discovery.activity',
    category: 'discovery',
    sourceEventTypes: [
      'workspace.discovery.completed',
      'workspace.diagnosis.completed',
      'recommendation.generated',
    ],
    aggregation: 'counter',
  },
  {
    name: 'install.lifecycle',
    category: 'install',
    sourceEventTypes: [
      'install.plan.created',
      'install.operation.applied',
      'install.completed',
      'install.validation.completed',
    ],
    aggregation: 'counter',
  },
  {
    name: 'install.progress',
    category: 'install',
    sourceEventTypes: ['install.operation.applied'],
    aggregation: 'counter',
  },
  {
    name: 'compaction.strategy',
    category: 'compaction',
    sourceEventTypes: [
      'compaction.strategy.selected',
      'compaction.validation.completed',
    ],
    aggregation: 'none',
  },
  {
    name: 'command.lifecycle',
    category: 'command',
    sourceEventTypes: [
      'command.started',
      'command.completed',
      'command.failed',
    ],
    aggregation: 'counter',
  },
  {
    name: 'session.lifecycle',
    category: 'session',
    sourceEventTypes: [
      'session.started',
      'session.ended',
    ],
    aggregation: 'counter',
  },
  {
    name: 'errors.all',
    category: 'error',
    sourceEventTypes: [
      'command.failed',
      'memory.rotation.failed',
    ],
    aggregation: 'counter',
  },
  {
    name: 'events.all',
    category: 'system',
    sourceEventTypes: [],
    aggregation: 'none',
  },
  // Living Loop channels
  {
    name: 'loop.observe',
    category: 'loop',
    sourceEventTypes: [LOOP_TRACE_RECORDED],
    aggregation: 'counter',
  },
  {
    name: 'loop.learn',
    category: 'loop',
    sourceEventTypes: [LOOP_PATTERN_EXTRACTED],
    aggregation: 'counter',
  },
  {
    name: 'loop.adapt',
    category: 'loop',
    sourceEventTypes: [LOOP_TUNING_APPLIED, LOOP_TUNING_REVERTED],
    aggregation: 'counter',
  },
  {
    name: 'loop.share',
    category: 'loop',
    sourceEventTypes: [LOOP_BUNDLE_EXPORTED, LOOP_BUNDLE_IMPORTED],
    aggregation: 'counter',
  },
  {
    name: 'loop.health',
    category: 'loop',
    sourceEventTypes: [LOOP_TRACE_RECORDED, LOOP_PATTERN_EXTRACTED, LOOP_TUNING_APPLIED, LOOP_BUNDLE_EXPORTED, LOOP_BUNDLE_IMPORTED],
    aggregation: 'counter',
  },
] as const;

export function findChannelsForEventType(eventType: string): readonly SignalChannelDefinition[] {
  return SIGNAL_CHANNELS.filter(
    (ch) => ch.sourceEventTypes.length === 0 || ch.sourceEventTypes.includes(eventType),
  );
}
