// Memory and context events
export const CONTEXT_LOAD_STARTED = 'context.load.started' as const;
export const CONTEXT_LOAD_COMPLETED = 'context.load.completed' as const;
export const CONTEXT_COMPACTION_TRIGGERED = 'context.compaction.triggered' as const;
export const CONTEXT_COMPACTION_COMPLETED = 'context.compaction.completed' as const;
export const CONTEXT_SUMMARY_PROMOTED = 'context.summary.promoted' as const;
export const CONTEXT_DELTA_EMITTED = 'context.delta.emitted' as const;
export const MEMORY_ROTATION_STARTED = 'memory.rotation.started' as const;
export const MEMORY_ROTATION_COMPLETED = 'memory.rotation.completed' as const;

// Budget and policy events
export const CONTEXT_BUDGET_WARNING = 'context.budget.warning' as const;
export const CONTEXT_BUDGET_EXCEEDED = 'context.budget.exceeded' as const;
export const HISTORY_EXPANSION_REQUESTED = 'history.expansion.requested' as const;
export const HISTORY_EXPANSION_DENIED = 'history.expansion.denied' as const;
export const CONTEXT_DUPLICATE_SUPPRESSED = 'context.duplicate.suppressed' as const;

// Subagent events
export const SUBAGENT_BRIEF_GENERATED = 'subagent.brief.generated' as const;
export const SUBAGENT_BRIEF_REWRITTEN = 'subagent.brief.rewritten' as const;
export const SUBAGENT_BRIEF_REJECTED = 'subagent.brief.rejected' as const;
export const SUBAGENT_RUN_STARTED = 'subagent.run.started' as const;
export const SUBAGENT_RUN_COMPLETED = 'subagent.run.completed' as const;

// Artifact promotion events
export const ARTIFACT_POINTER_PROMOTED = 'artifact.pointer.promoted' as const;

// Startup events
export const RUNTIME_STARTUP_FILES_GENERATED = 'runtime.startup.files.generated' as const;

// Output posture events
export const RESPONSE_PROFILE_SELECTED = 'response.profile.selected' as const;
export const RESPONSE_PROFILE_OVERRIDDEN = 'response.profile.overridden' as const;

export const BEHAVIOR_EVENT_TYPES = {
  // Memory and context
  CONTEXT_LOAD_STARTED,
  CONTEXT_LOAD_COMPLETED,
  CONTEXT_COMPACTION_TRIGGERED,
  CONTEXT_COMPACTION_COMPLETED,
  CONTEXT_SUMMARY_PROMOTED,
  CONTEXT_DELTA_EMITTED,
  MEMORY_ROTATION_STARTED,
  MEMORY_ROTATION_COMPLETED,
  // Budget and policy
  CONTEXT_BUDGET_WARNING,
  CONTEXT_BUDGET_EXCEEDED,
  HISTORY_EXPANSION_REQUESTED,
  HISTORY_EXPANSION_DENIED,
  CONTEXT_DUPLICATE_SUPPRESSED,
  // Subagent
  SUBAGENT_BRIEF_GENERATED,
  SUBAGENT_BRIEF_REWRITTEN,
  SUBAGENT_BRIEF_REJECTED,
  SUBAGENT_RUN_STARTED,
  SUBAGENT_RUN_COMPLETED,
  // Artifact promotion
  ARTIFACT_POINTER_PROMOTED,
  // Startup
  RUNTIME_STARTUP_FILES_GENERATED,
  // Output posture
  RESPONSE_PROFILE_SELECTED,
  RESPONSE_PROFILE_OVERRIDDEN,
} as const;

export type BehaviorEventType = typeof BEHAVIOR_EVENT_TYPES[keyof typeof BEHAVIOR_EVENT_TYPES];
