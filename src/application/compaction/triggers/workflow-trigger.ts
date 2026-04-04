const COMPACTION_ELIGIBLE_EVENT_TYPES: ReadonlySet<string> = new Set([
  'task.completed',
  'review.completed',
  'export.completed',
  'recursive.run.completed',
  'bridge.generated',
]);

export function shouldTriggerAfterWorkflow(completedEventType: string): boolean {
  return COMPACTION_ELIGIBLE_EVENT_TYPES.has(completedEventType);
}
