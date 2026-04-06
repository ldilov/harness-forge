export interface SessionTrace {
  readonly traceId: string;
  readonly sessionId: string;
  readonly target: string;
  readonly repo: string;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly durationMs: number;
  readonly compactionsTriggered: number;
  readonly tokensSaved: number;
  readonly compactionStrategies: readonly string[];
  readonly budgetExceeded: boolean;
  readonly tokensUsed: number;
  readonly subagentsSpawned: number;
  readonly duplicatesSuppressed: number;
  readonly commandsRun: readonly string[];
  readonly errorsEncountered: number;
}
