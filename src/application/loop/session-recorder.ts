import type { SessionTrace } from '../../domain/loop/session-trace.js';
import type { BehaviorEvent } from '../behavior/behavior-event-emitter.js';
import { generateId } from '../../shared/id-generator.js';

export class SessionRecorder {
  private readonly sessionId: string;
  private readonly target: string;
  private readonly repo: string;

  private compactionsTriggered = 0;
  private tokensSaved = 0;
  private compactionStrategies: string[] = [];
  private tokensUsed = 0;
  private tokenBudget = 200_000;
  private subagentsSpawned = 0;
  private duplicatesSuppressed = 0;
  private skillsInvoked: string[] = [];
  private commandsRun: string[] = [];
  private errorsEncountered = 0;
  private taskCompleted = false;
  private retries = 0;
  private userCorrections = 0;
  private budgetExceeded = false;
  private startedAt = '';
  private endedAt = '';

  constructor(sessionId: string, target: string, repo: string) {
    this.sessionId = sessionId;
    this.target = target;
    this.repo = repo;
  }

  recordEvent(event: BehaviorEvent): void {
    const eventType = event.eventType as string;
    const payload = event.payload as Record<string, unknown>;

    if (eventType === 'context.compaction.completed') {
      this.compactionsTriggered += 1;
      const tokensBeforeAfter = payload.tokensBeforeAfter as
        { before: number; after: number } | undefined;
      if (tokensBeforeAfter) {
        this.tokensSaved += tokensBeforeAfter.before - tokensBeforeAfter.after;
      }
      const strategy = payload.strategy as string | undefined;
      if (strategy) {
        this.compactionStrategies = [...this.compactionStrategies, strategy];
      }
    }

    if (eventType === 'context.budget.exceeded') {
      this.budgetExceeded = true;
    }

    if (eventType === 'context.budget.warning') {
      const budgetState = payload.budgetState as
        { estimatedTokens: number; hardCap: number } | undefined;
      if (budgetState) {
        this.tokensUsed = budgetState.estimatedTokens;
        this.tokenBudget = budgetState.hardCap;
      }
    }

    if (eventType === 'subagent.run.started') {
      this.subagentsSpawned += 1;
    }

    if (eventType === 'context.duplicate.suppressed') {
      this.duplicatesSuppressed += 1;
    }

    if (eventType === 'command.completed' || eventType === 'command.failed') {
      const commandName = payload.commandName as string | undefined;
      if (commandName) {
        this.commandsRun = [...this.commandsRun, commandName];
      }
    }

    if (eventType === 'session.started') {
      this.startedAt = event.occurredAt;
    }

    if (eventType === 'session.ended') {
      this.endedAt = event.occurredAt;
    }

    if (
      eventType.endsWith('.failed') ||
      eventType.endsWith('.rejected') ||
      eventType.endsWith('.denied')
    ) {
      this.errorsEncountered += 1;
    }
  }

  buildTrace(): SessionTrace {
    const durationSeconds =
      this.startedAt && this.endedAt
        ? (new Date(this.endedAt).getTime() - new Date(this.startedAt).getTime()) / 1000
        : 0;

    return {
      traceId: generateId('trace'),
      sessionId: this.sessionId,
      target: this.target,
      repo: this.repo,
      startedAt: this.startedAt,
      endedAt: this.endedAt,
      durationSeconds,
      metrics: {
        tokensUsed: this.tokensUsed,
        tokenBudget: this.tokenBudget,
        compactionsTriggered: this.compactionsTriggered,
        compactionStrategies: [...this.compactionStrategies],
        tokensSaved: this.tokensSaved,
        subagentsSpawned: this.subagentsSpawned,
        duplicatesSuppressed: this.duplicatesSuppressed,
        skillsInvoked: [...this.skillsInvoked],
        commandsRun: [...this.commandsRun],
        errorsEncountered: this.errorsEncountered,
      },
      outcome: {
        taskCompleted: this.taskCompleted,
        retries: this.retries,
        userCorrections: this.userCorrections,
        budgetExceeded: this.budgetExceeded,
      },
    };
  }
}
