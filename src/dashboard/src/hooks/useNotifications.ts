import { useEffect, useRef } from 'react';
import type { DashboardEvent } from '../state/types';

const CRITICAL_EVENTS: ReadonlySet<string> = new Set([
  'context.budget.exceeded',
  'memory.rotation.started',
  'context.compaction.triggered',
  'subagent.brief.rejected',
  'history.expansion.denied',
]);

const EVENT_LABELS: Record<string, string> = {
  'context.budget.exceeded': 'Budget Exceeded',
  'memory.rotation.started': 'Memory Rotation',
  'context.compaction.triggered': 'Compaction Triggered',
  'subagent.brief.rejected': 'Brief Rejected',
  'history.expansion.denied': 'Expansion Denied',
};

export function useNotifications(events: readonly DashboardEvent[]): void {
  const registeredRef = useRef(false);
  const lastSeenCountRef = useRef(0);

  // Register service worker once
  useEffect(() => {
    if (registeredRef.current) return;
    if (!('serviceWorker' in navigator)) return;

    registeredRef.current = true;

    navigator.serviceWorker.register('/sw.js').catch(() => {
      // Service worker registration failed — notifications won't work, but that's fine
    });

    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {});
    }
  }, []);

  // Send notifications for new critical events
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;
    if (!navigator.serviceWorker.controller) return;
    if (Notification.permission !== 'granted') return;

    const newEvents = events.slice(lastSeenCountRef.current);
    lastSeenCountRef.current = events.length;

    for (const event of newEvents) {
      if (event.isReplay) continue;
      if (!CRITICAL_EVENTS.has(event.eventType)) continue;

      const label = EVENT_LABELS[event.eventType] ?? event.eventType;
      navigator.serviceWorker.controller.postMessage({
        type: 'HARNESS_NOTIFICATION',
        title: `Harness: ${label}`,
        body: formatNotificationBody(event),
        tag: `hforge-${event.eventType}`,
      });
    }
  }, [events]);
}

function formatNotificationBody(event: DashboardEvent): string {
  const parts: string[] = [];

  if (event.payload.budgetState) {
    const bs = event.payload.budgetState as Record<string, number>;
    parts.push(`Tokens: ${bs.estimatedTokens?.toLocaleString()} / ${bs.hardCap?.toLocaleString()}`);
  }

  if (event.payload.tokensBeforeAfter) {
    const tb = event.payload.tokensBeforeAfter as Record<string, number>;
    parts.push(`${tb.before?.toLocaleString()} -> ${tb.after?.toLocaleString()} tokens`);
  }

  if (event.payload.reason) {
    parts.push(String(event.payload.reason));
  }

  return parts.length > 0 ? parts.join(' | ') : event.eventType;
}
