export interface SessionTrace {
  readonly sessionId: string;
  readonly tokensUsed: number;
  readonly tokenBudget: number;
  readonly completed: boolean;
  readonly retries: number;
  readonly userCorrections: number;
  readonly budgetExceeded: boolean;
  readonly compactionsTriggered: number;
  readonly tokensSaved: number;
  readonly subagentsSpawned: number;
  readonly commandsRun: readonly string[];
  readonly errorsEncountered: number;
}
