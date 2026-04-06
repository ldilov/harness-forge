import type { DashboardState, DashboardAction, DashboardEvent, SignalMessage, PatternEntry, TuningEntry } from './types';

const MAX_EVENTS = 1000;

export const initialState: DashboardState = {
  screen: 'project-selector',
  connected: false,
  connectionState: 'connecting',
  events: [],
  budgetSnapshot: null,
  enforcementLevel: 'Guidance',
  compactionLevel: 'none',
  memoryTokens: 0,
  eventCounts: {},
  eventRate: 0,
  suppressionRatio: 0,
  tokensSaved: 0,
  sessionInfo: {
    sessionId: '',
    startTime: new Date().toISOString(),
    harnessVersion: '',
    modelName: '',
    contextWindowTokens: 0,
  },
  activeProject: null,
  availableProjects: [],
  loopHealth: {
    observeCount: 0,
    learnCount: 0,
    adaptCount: 0,
    shareCount: 0,
    importCount: 0,
    healthScore: 0,
    lastCycleAt: null,
  },
  effectivenessScores: [],
  patterns: [],
  tunings: [],
};

function handleSignal(state: DashboardState, signal: SignalMessage): DashboardState {
  if (signal.type === 'state' && signal.channel === 'system.project.switched') {
    const p = signal.payload;
    return {
      ...initialState,
      screen: 'dashboard',
      connected: true,
      connectionState: 'connected',
      activeProject: {
        rootPath: (p.rootPath as string) ?? '',
        name: (p.name as string) ?? '',
        lastSeen: new Date().toISOString(),
      },
      availableProjects: state.availableProjects,
    };
  }

  if (signal.type === 'state' && signal.channel === 'system.init') {
    const p = signal.payload;
    const loopData = p.loopHealth as Record<string, unknown> | undefined;
    return {
      ...state,
      connected: true,
      connectionState: 'connected',
      memoryTokens: (p.memoryTokens as number) ?? 0,
      enforcementLevel: (p.currentEnforcement as string) ?? 'Guidance',
      compactionLevel: (p.currentCompactionLevel as string) ?? 'none',
      budgetSnapshot: (p.currentBudget as Record<string, unknown>) ?? null,
      sessionInfo: {
        ...state.sessionInfo,
        sessionId: (p.sessionId as string) ?? '',
        harnessVersion: (p.version as string) ?? '',
        startTime: new Date().toISOString(),
      },
      ...(loopData ? {
        loopHealth: {
          ...state.loopHealth,
          healthScore: (loopData.healthScore as number) ?? state.loopHealth.healthScore,
        },
      } : {}),
    };
  }

  if (signal.type === 'state' && signal.channel === 'system.heartbeat') {
    const p = signal.payload;
    const runtimeState = p.state as Record<string, unknown> | undefined;
    const loopData = p.loopHealth as Record<string, unknown> | undefined;
    if (runtimeState) {
      // Deterministic: use server-authoritative state, no client inference
      return {
        ...state,
        enforcementLevel: (runtimeState.enforcement as string) ?? state.enforcementLevel,
        compactionLevel: (runtimeState.compaction as string) ?? state.compactionLevel,
        memoryTokens: (runtimeState.memoryTokens as number) ?? state.memoryTokens,
        ...(loopData ? {
          loopHealth: {
            ...state.loopHealth,
            healthScore: (loopData.healthScore as number) ?? state.loopHealth.healthScore,
          },
        } : {}),
      };
    }
    return { ...state, eventRate: (p.totalEvents as number) ?? state.eventRate };
  }

  if (signal.type === 'event' || signal.type === 'replay') {
    const p = signal.payload;
    const event: DashboardEvent = {
      eventId: (p.eventId as string) ?? `sig_${signal.sequenceId}`,
      eventType: (p.eventType as string) ?? signal.channel,
      occurredAt: (p.occurredAt as string) ?? signal.timestamp,
      runtimeSessionId: p.runtimeSessionId as string | undefined,
      payload: (p.payload as Record<string, unknown>) ?? {},
      isReplay: signal.type === 'replay',
    };

    const events = [...state.events, event].slice(-MAX_EVENTS);
    const eventType = event.eventType;
    const eventCounts = {
      ...state.eventCounts,
      [eventType]: (state.eventCounts[eventType] ?? 0) + 1,
    };

    // Note: enforcement/compaction state is set deterministically via
    // heartbeat state snapshots from the server. We do NOT infer these
    // from event types on the client side.

    return {
      ...state,
      events,
      eventCounts,
    };
  }

  if (signal.type === 'metric') {
    const p = signal.payload;
    const name = p.name as string;
    const value = p.value as number;

    if (name === 'budget.usage.tokens') return { ...state, memoryTokens: value };
    if (name === 'suppression.ratio') return { ...state, suppressionRatio: value };
    if (name === 'events.rate') return { ...state, eventRate: value };
    if (name === 'compaction.tokens.saved') return { ...state, tokensSaved: state.tokensSaved + value };
    // Enforcement level is set by heartbeat state snapshot, not inferred from budget %
  }

  // Living Loop signal channels
  if (signal.channel === 'loop.observe') {
    return {
      ...state,
      loopHealth: {
        ...state.loopHealth,
        observeCount: state.loopHealth.observeCount + 1,
        lastCycleAt: signal.timestamp,
      },
    };
  }

  if (signal.channel === 'loop.learn') {
    const p = signal.payload;
    const newPatterns = (p.patterns as PatternEntry[] | undefined) ?? [];
    return {
      ...state,
      loopHealth: {
        ...state.loopHealth,
        learnCount: state.loopHealth.learnCount + 1,
        lastCycleAt: signal.timestamp,
      },
      patterns: newPatterns.length > 0 ? newPatterns : state.patterns,
    };
  }

  if (signal.channel === 'loop.adapt') {
    const p = signal.payload;
    const newTunings = (p.tunings as TuningEntry[] | undefined) ?? [];
    const score = p.effectivenessScore as number | undefined;
    return {
      ...state,
      loopHealth: {
        ...state.loopHealth,
        adaptCount: state.loopHealth.adaptCount + 1,
        lastCycleAt: signal.timestamp,
      },
      tunings: newTunings.length > 0 ? newTunings : state.tunings,
      effectivenessScores: score !== undefined
        ? [...state.effectivenessScores, score].slice(-20)
        : state.effectivenessScores,
    };
  }

  if (signal.channel === 'loop.share') {
    return {
      ...state,
      loopHealth: {
        ...state.loopHealth,
        shareCount: state.loopHealth.shareCount + 1,
        lastCycleAt: signal.timestamp,
      },
    };
  }

  if (signal.channel === 'loop.import') {
    return {
      ...state,
      loopHealth: {
        ...state.loopHealth,
        importCount: state.loopHealth.importCount + 1,
        lastCycleAt: signal.timestamp,
      },
    };
  }

  if (signal.channel === 'loop.health') {
    const p = signal.payload;
    return {
      ...state,
      loopHealth: {
        ...state.loopHealth,
        healthScore: (p.healthScore as number) ?? state.loopHealth.healthScore,
      },
    };
  }

  return state;
}

export function dashboardReducer(state: DashboardState, action: DashboardAction): DashboardState {
  switch (action.type) {
    case 'SIGNAL_RECEIVED':
      return handleSignal(state, action.signal);
    case 'CONNECTION_STATE':
      return {
        ...state,
        connected: action.state === 'connected',
        connectionState: action.state,
      };
    case 'EVENTS_BATCH': {
      const events = [...state.events, ...action.events].slice(-MAX_EVENTS);
      return { ...state, events };
    }
    case 'SET_PROJECTS': {
      const active = action.projects.find((p) => p.rootPath === action.active) ?? null;
      return {
        ...state,
        availableProjects: action.projects,
        activeProject: active,
        screen: active ? 'dashboard' : 'project-selector',
      };
    }
    case 'SELECT_PROJECT':
      return {
        ...initialState,
        screen: 'dashboard',
        activeProject: action.project,
        availableProjects: state.availableProjects,
        connected: state.connected,
        connectionState: state.connectionState,
      };
    case 'SHOW_PROJECT_SELECTOR':
      return { ...state, screen: 'project-selector' };
    case 'RESTORE_SESSION':
      return {
        ...state,
        screen: action.session.activeProject ? 'dashboard' : 'project-selector',
        activeProject: action.session.activeProject,
        eventCounts: action.session.eventCounts,
        enforcementLevel: action.session.enforcementLevel,
        compactionLevel: action.session.compactionLevel,
        memoryTokens: action.session.memoryTokens,
        tokensSaved: action.session.tokensSaved,
        suppressionRatio: action.session.suppressionRatio,
      };
    default:
      return state;
  }
}
