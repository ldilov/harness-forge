import { useEffect, useRef, type Dispatch } from 'react';
import type { DashboardAction, SignalMessage, ProjectInfo } from '../state/types';
import { getPersistedLastSequenceId } from './useSessionPersistence';

const RECONNECT_BASE_MS = 1000;
const RECONNECT_MAX_MS = 30000;
const FLUSH_INTERVAL_MS = 100;

/**
 * Connects to the dashboard WebSocket and dispatches signals to the reducer.
 * Reconnects when activeProject changes (to get fresh replay for the new project).
 */
export function useSignals(
  dispatch: Dispatch<DashboardAction>,
  activeProject: ProjectInfo | null,
): { lastSequenceIdRef: React.RefObject<number> } {
  const wsRef = useRef<WebSocket | null>(null);
  const bufferRef = useRef<SignalMessage[]>([]);
  const reconnectAttemptRef = useRef(0);
  const mountedRef = useRef(true);
  const lastSequenceIdRef = useRef(getPersistedLastSequenceId());

  // Reset sequence tracking when project changes
  const projectPath = activeProject?.rootPath ?? null;

  useEffect(() => {
    // Don't connect until a project is selected
    if (!projectPath) return;

    mountedRef.current = true;
    // Reset sequence on project switch so we get a full replay
    lastSequenceIdRef.current = 0;

    function connect() {
      if (!mountedRef.current) return;

      // Close existing connection if any
      if (wsRef.current) {
        wsRef.current.onclose = null; // prevent reconnect loop
        wsRef.current.close();
        wsRef.current = null;
      }

      dispatch({ type: 'CONNECTION_STATE', state: 'connecting' });

      const seqId = lastSequenceIdRef.current;
      const wsUrl = seqId > 0
        ? `ws://${window.location.host}/ws?lastSequenceId=${seqId}`
        : `ws://${window.location.host}/ws`;

      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = () => {
        reconnectAttemptRef.current = 0;
        dispatch({ type: 'CONNECTION_STATE', state: 'connected' });
      };

      ws.onmessage = (msgEvent) => {
        try {
          const signal = JSON.parse(msgEvent.data as string) as SignalMessage;
          if (signal.sequenceId > lastSequenceIdRef.current) {
            lastSequenceIdRef.current = signal.sequenceId;
          }
          bufferRef.current.push(signal);
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        if (!mountedRef.current) return;
        dispatch({ type: 'CONNECTION_STATE', state: 'reconnecting' });
        scheduleReconnect();
      };

      ws.onerror = () => {
        ws.close();
      };
    }

    function scheduleReconnect() {
      const attempt = reconnectAttemptRef.current;
      const delay = Math.min(RECONNECT_BASE_MS * Math.pow(2, attempt), RECONNECT_MAX_MS);
      reconnectAttemptRef.current = attempt + 1;
      setTimeout(connect, delay);
    }

    const flushTimer = setInterval(() => {
      const batch = bufferRef.current.splice(0);
      for (const signal of batch) {
        dispatch({ type: 'SIGNAL_RECEIVED', signal });
      }
    }, FLUSH_INTERVAL_MS);

    connect();

    return () => {
      mountedRef.current = false;
      clearInterval(flushTimer);
      if (wsRef.current) {
        wsRef.current.onclose = null;
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [dispatch, projectPath]); // Re-run when project changes

  return { lastSequenceIdRef };
}
