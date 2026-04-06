export interface SessionTrace {
  readonly sessionId: string;
  readonly startedAt: string;
  readonly endedAt: string;
  readonly toolCalls: number;
  readonly filesChanged: readonly string[];
  readonly outcome: 'success' | 'partial' | 'failure' | 'abandoned';
  readonly summary: string;
}
