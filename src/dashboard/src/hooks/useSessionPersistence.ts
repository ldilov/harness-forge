import { useEffect, useRef } from 'react';
import type { DashboardState, DashboardAction, ProjectInfo } from '../state/types';

const SESSION_KEY = 'hforge-dashboard-session';
const SAVE_INTERVAL_MS = 2000;

interface PersistedSession {
  readonly screen: DashboardState['screen'];
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

export function useSessionPersistence(
  state: DashboardState,
  lastSequenceId: number,
  dispatch: React.Dispatch<DashboardAction>,
): void {
  const saveTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Save state periodically
  useEffect(() => {
    saveTimerRef.current = setInterval(() => {
      const session: PersistedSession = {
        screen: state.screen,
        activeProject: state.activeProject,
        eventCounts: state.eventCounts,
        enforcementLevel: state.enforcementLevel,
        compactionLevel: state.compactionLevel,
        memoryTokens: state.memoryTokens,
        tokensSaved: state.tokensSaved,
        suppressionRatio: state.suppressionRatio,
        lastSequenceId,
        savedAt: new Date().toISOString(),
      };
      try {
        sessionStorage.setItem(SESSION_KEY, JSON.stringify(session));
      } catch {
        // sessionStorage full or unavailable — skip silently
      }
    }, SAVE_INTERVAL_MS);

    return () => {
      if (saveTimerRef.current) clearInterval(saveTimerRef.current);
    };
  }, [state, lastSequenceId]);

  // Restore on mount (once)
  useEffect(() => {
    try {
      const raw = sessionStorage.getItem(SESSION_KEY);
      if (!raw) return;
      const session = JSON.parse(raw) as PersistedSession;

      // Only restore if saved recently (within last 10 minutes)
      const age = Date.now() - new Date(session.savedAt).getTime();
      if (age > 10 * 60 * 1000) {
        sessionStorage.removeItem(SESSION_KEY);
        return;
      }

      if (session.activeProject) {
        dispatch({ type: 'RESTORE_SESSION', session });
      }
    } catch {
      // Corrupted session — ignore
    }
  }, [dispatch]);
}

export function getPersistedLastSequenceId(): number {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return 0;
    const session = JSON.parse(raw) as PersistedSession;
    return session.lastSequenceId ?? 0;
  } catch {
    return 0;
  }
}
