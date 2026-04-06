export const CONTEXT_LOAD_STARTED = 'context.load.started' as const;
export const CONTEXT_LOAD_COMPLETED = 'context.load.completed' as const;
export const CONTEXT_COMPACTION_TRIGGERED = 'context.compaction.triggered' as const;
export const CONTEXT_COMPACTION_COMPLETED = 'context.compaction.completed' as const;
export const CONTEXT_SUMMARY_PROMOTED = 'context.summary.promoted' as const;
export const CONTEXT_DELTA_EMITTED = 'context.delta.emitted' as const;
export const MEMORY_ROTATION_STARTED = 'memory.rotation.started' as const;
export const MEMORY_ROTATION_COMPLETED = 'memory.rotation.completed' as const;

export const CONTEXT_BUDGET_WARNING = 'context.budget.warning' as const;
export const CONTEXT_BUDGET_EXCEEDED = 'context.budget.exceeded' as const;
export const HISTORY_EXPANSION_REQUESTED = 'history.expansion.requested' as const;
export const HISTORY_EXPANSION_DENIED = 'history.expansion.denied' as const;
export const CONTEXT_DUPLICATE_SUPPRESSED = 'context.duplicate.suppressed' as const;

export const SUBAGENT_BRIEF_GENERATED = 'subagent.brief.generated' as const;
export const SUBAGENT_BRIEF_REWRITTEN = 'subagent.brief.rewritten' as const;
export const SUBAGENT_BRIEF_REJECTED = 'subagent.brief.rejected' as const;
export const SUBAGENT_RUN_STARTED = 'subagent.run.started' as const;
export const SUBAGENT_RUN_COMPLETED = 'subagent.run.completed' as const;

export const ARTIFACT_POINTER_PROMOTED = 'artifact.pointer.promoted' as const;

export const RUNTIME_STARTUP_FILES_GENERATED = 'runtime.startup.files.generated' as const;

export const RESPONSE_PROFILE_SELECTED = 'response.profile.selected' as const;
export const RESPONSE_PROFILE_OVERRIDDEN = 'response.profile.overridden' as const;

export const WORKSPACE_DISCOVERY_COMPLETED = 'workspace.discovery.completed' as const;
export const WORKSPACE_DIAGNOSIS_COMPLETED = 'workspace.diagnosis.completed' as const;
export const RECOMMENDATION_GENERATED = 'recommendation.generated' as const;

export const INSTALL_PLAN_CREATED = 'install.plan.created' as const;
export const INSTALL_OPERATION_APPLIED = 'install.operation.applied' as const;
export const INSTALL_COMPLETED = 'install.completed' as const;
export const INSTALL_VALIDATION_COMPLETED = 'install.validation.completed' as const;

export const COMPACTION_STRATEGY_SELECTED = 'compaction.strategy.selected' as const;
export const COMPACTION_VALIDATION_COMPLETED = 'compaction.validation.completed' as const;
export const MEMORY_ROTATION_FAILED = 'memory.rotation.failed' as const;

export const COMMAND_STARTED = 'command.started' as const;
export const COMMAND_COMPLETED = 'command.completed' as const;
export const COMMAND_FAILED = 'command.failed' as const;

export const SESSION_STARTED = 'session.started' as const;
export const SESSION_ENDED = 'session.ended' as const;

export const BEHAVIOR_EVENT_TYPES = {
  CONTEXT_LOAD_STARTED,
  CONTEXT_LOAD_COMPLETED,
  CONTEXT_COMPACTION_TRIGGERED,
  CONTEXT_COMPACTION_COMPLETED,
  CONTEXT_SUMMARY_PROMOTED,
  CONTEXT_DELTA_EMITTED,
  MEMORY_ROTATION_STARTED,
  MEMORY_ROTATION_COMPLETED,
  CONTEXT_BUDGET_WARNING,
  CONTEXT_BUDGET_EXCEEDED,
  HISTORY_EXPANSION_REQUESTED,
  HISTORY_EXPANSION_DENIED,
  CONTEXT_DUPLICATE_SUPPRESSED,
  SUBAGENT_BRIEF_GENERATED,
  SUBAGENT_BRIEF_REWRITTEN,
  SUBAGENT_BRIEF_REJECTED,
  SUBAGENT_RUN_STARTED,
  SUBAGENT_RUN_COMPLETED,
  ARTIFACT_POINTER_PROMOTED,
  RUNTIME_STARTUP_FILES_GENERATED,
  RESPONSE_PROFILE_SELECTED,
  RESPONSE_PROFILE_OVERRIDDEN,
  WORKSPACE_DISCOVERY_COMPLETED,
  WORKSPACE_DIAGNOSIS_COMPLETED,
  RECOMMENDATION_GENERATED,
  INSTALL_PLAN_CREATED,
  INSTALL_OPERATION_APPLIED,
  INSTALL_COMPLETED,
  INSTALL_VALIDATION_COMPLETED,
  COMPACTION_STRATEGY_SELECTED,
  COMPACTION_VALIDATION_COMPLETED,
  MEMORY_ROTATION_FAILED,
  COMMAND_STARTED,
  COMMAND_COMPLETED,
  COMMAND_FAILED,
  SESSION_STARTED,
  SESSION_ENDED,
} as const;

export type BehaviorEventType = typeof BEHAVIOR_EVENT_TYPES[keyof typeof BEHAVIOR_EVENT_TYPES];
