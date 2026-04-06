export interface SignalMessage {
  readonly type: 'event' | 'metric' | 'state' | 'replay';
  readonly channel: string;
  readonly payload: Record<string, unknown>;
  readonly timestamp: string;
  readonly sequenceId: number;
}

export interface DashboardEvent {
  readonly eventId: string;
  readonly eventType: string;
  readonly occurredAt: string;
  readonly runtimeSessionId?: string;
  readonly payload: Record<string, unknown>;
  readonly isReplay?: boolean;
}

export type ConnectionState = 'connecting' | 'connected' | 'reconnecting' | 'disconnected';

export interface ProjectInfo {
  readonly rootPath: string;
  readonly name: string;
  readonly lastSeen: string;
  readonly harnessVersion?: string;
}

export type AppScreen = 'project-selector' | 'dashboard';

export interface LoopHealth {
  readonly observeCount: number;
  readonly learnCount: number;
  readonly adaptCount: number;
  readonly shareCount: number;
  readonly importCount: number;
  readonly healthScore: number;
  readonly lastCycleAt: string | null;
}

export interface PatternEntry {
  readonly id: string;
  readonly type: string;
  readonly confidence: number;
  readonly finding: string;
  readonly isNew: boolean;
}

export interface TuningEntry {
  readonly id: string;
  readonly param: string;
  readonly oldValue: unknown;
  readonly newValue: unknown;
  readonly status: 'applied' | 'reverted';
}

export interface DashboardState {
  readonly screen: AppScreen;
  readonly connected: boolean;
  readonly connectionState: ConnectionState;
  readonly events: readonly DashboardEvent[];
  readonly budgetSnapshot: Record<string, unknown> | null;
  readonly enforcementLevel: string;
  readonly compactionLevel: string;
  readonly memoryTokens: number;
  readonly eventCounts: Record<string, number>;
  readonly eventRate: number;
  readonly suppressionRatio: number;
  readonly tokensSaved: number;
  readonly sessionInfo: SessionInfo;
  readonly activeProject: ProjectInfo | null;
  readonly availableProjects: readonly ProjectInfo[];
  readonly loopHealth: LoopHealth;
  readonly effectivenessScores: readonly number[];
  readonly patterns: readonly PatternEntry[];
  readonly tunings: readonly TuningEntry[];
}

export interface SessionInfo {
  readonly sessionId: string;
  readonly startTime: string;
  readonly harnessVersion: string;
  readonly modelName: string;
  readonly contextWindowTokens: number;
}

export interface PersistedSessionData {
  readonly screen: AppScreen;
  readonly activeProject: ProjectInfo | null;
  readonly eventCounts: Record<string, number>;
  readonly enforcementLevel: string;
  readonly compactionLevel: string;
  readonly memoryTokens: number;
  readonly tokensSaved: number;
  readonly suppressionRatio: number;
  readonly lastSequenceId: number;
  readonly savedAt: string;
}

export type DashboardAction =
  | { type: 'SIGNAL_RECEIVED'; signal: SignalMessage }
  | { type: 'CONNECTION_STATE'; state: ConnectionState }
  | { type: 'EVENTS_BATCH'; events: readonly DashboardEvent[] }
  | { type: 'SET_PROJECTS'; projects: readonly ProjectInfo[]; active: string }
  | { type: 'SELECT_PROJECT'; project: ProjectInfo }
  | { type: 'SHOW_PROJECT_SELECTOR' }
  | { type: 'RESTORE_SESSION'; session: PersistedSessionData };

export interface TimeRange {
  readonly start: number;
  readonly end: number;
}
