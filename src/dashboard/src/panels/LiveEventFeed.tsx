import type { ReactElement } from 'react';
import { useState, useMemo, useRef, useEffect, useCallback, type CSSProperties } from 'react';
import { Panel } from '../components/Panel';
import { Sparkline } from '../components/Sparkline';
import type { DashboardEvent } from '../state/types';
import { colors, radius, getCategoryColor, getCategoryEmoji, getCategoryFromEventType } from '../styles/theme';
import { useDashboardContext } from '../state/DashboardContext';

interface LiveEventFeedProps {
  readonly events: readonly DashboardEvent[];
}

type Severity = 'error' | 'warning' | 'success' | 'info';

function getSeverity(eventType: string): Severity {
  if (eventType.endsWith('.failed') || eventType.endsWith('.exceeded') || eventType.endsWith('.rejected') || eventType.endsWith('.denied')) return 'error';
  if (eventType.endsWith('.warning')) return 'warning';
  if (eventType.endsWith('.completed') || eventType.endsWith('.generated') || eventType.endsWith('.promoted')) return 'success';
  return 'info';
}

const severityColors: Record<Severity, string> = {
  error: colors.accent.coral,
  warning: colors.accent.amber,
  success: colors.accent.mint,
  info: colors.text.muted,
};

function relativeTime(isoString: string, now: number): string {
  const diff = now - new Date(isoString).getTime();
  if (diff < 0) return 'just now';
  const seconds = Math.floor(diff / 1000);
  if (seconds < 5) return 'just now';
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function formatDuration(ms: number): string {
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  return `${(ms / 60_000).toFixed(1)}m`;
}

function shortenPath(p: string): string {
  const parts = p.replace(/\\/g, '/').split('/');
  return parts.length <= 3 ? p : `\u2026/${parts.slice(-2).join('/')}`;
}

function formatSmartSummary(eventType: string, payload: Record<string, unknown>): string {
  const bs = payload.budgetState as { estimatedTokens?: number; hardCap?: number } | undefined;
  const tba = payload.tokensBeforeAfter as { before?: number; after?: number } | undefined;
  const sc = payload.suppressionCounts as { total?: number; suppressed?: number } | undefined;

  switch (eventType) {
    case 'context.budget.warning':
    case 'context.budget.exceeded': {
      if (bs?.estimatedTokens !== undefined && bs?.hardCap) {
        const pct = Math.round((bs.estimatedTokens / bs.hardCap) * 100);
        return `Budget at ${pct}% (${bs.estimatedTokens.toLocaleString()} / ${bs.hardCap.toLocaleString()} tokens)`;
      }
      return eventType === 'context.budget.exceeded' ? 'Budget hard cap exceeded' : 'Approaching budget limit';
    }
    case 'context.compaction.completed': {
      if (tba?.before !== undefined && tba?.after !== undefined) {
        const saved = Math.round(((tba.before - tba.after) / tba.before) * 100);
        return `Compacted: ${tba.before.toLocaleString()} \u2192 ${tba.after.toLocaleString()} tokens (saved ${saved}%)`;
      }
      return 'Compaction completed';
    }
    case 'context.compaction.triggered':
      return `Compaction triggered${payload.level ? ` at level: ${String(payload.level)}` : ''}`;
    case 'context.duplicate.suppressed': {
      if (sc?.total !== undefined && sc?.suppressed !== undefined) {
        return `Suppressed ${sc.suppressed} of ${sc.total} sources`;
      }
      return 'Duplicate sources suppressed';
    }
    case 'memory.rotation.started':
      return `Memory rotation started${payload.tokensBefore ? ` (${Number(payload.tokensBefore).toLocaleString()} tokens)` : ''}`;
    case 'memory.rotation.completed': {
      const tb = payload.tokensBefore as number | undefined;
      const ta = payload.tokensAfter as number | undefined;
      if (tb !== undefined && ta !== undefined) return `Rotated: ${tb.toLocaleString()} \u2192 ${ta.toLocaleString()} tokens`;
      return `Memory rotated${payload.automatic ? ' (auto)' : ''}`;
    }
    case 'memory.rotation.failed':
      return `Rotation failed: ${String(payload.reason ?? 'unknown')}`;
    case 'subagent.brief.generated': {
      const obj = String(payload.objective ?? '').slice(0, 40);
      const tokens = payload.estimatedTokens as number | undefined;
      return `Brief: "${obj}${obj.length >= 40 ? '\u2026' : ''}"${tokens ? ` (${tokens} tok)` : ''}`;
    }
    case 'subagent.brief.rewritten':
      return `Brief rewritten (truncated ${payload.truncatedDecisions ?? 0} decisions)`;
    case 'subagent.brief.rejected':
      return `Brief rejected: ${String(payload.reason ?? 'validation failed')}`;
    case 'subagent.run.started':
      return 'Subagent execution started';
    case 'subagent.run.completed':
      return `Subagent completed${payload.durationMs ? ` in ${formatDuration(Number(payload.durationMs))}` : ''}`;
    case 'context.load.started':
      return 'Loading context sources\u2026';
    case 'context.load.completed': {
      const n = payload.sourcesLoaded as number | undefined;
      return `Context loaded${n ? ` (${n} sources)` : ''}${payload.durationMs ? ` in ${formatDuration(Number(payload.durationMs))}` : ''}`;
    }
    case 'context.summary.promoted':
      return `Session summary promoted${payload.summaryId ? ` [${String(payload.summaryId).slice(0, 12)}]` : ''}`;
    case 'context.delta.emitted':
      return `Delta emitted${payload.deltaId ? ` [${String(payload.deltaId).slice(0, 12)}]` : ''}`;
    case 'history.expansion.requested':
      return `History expansion requested: ${String(payload.reason ?? 'allowed')}`;
    case 'history.expansion.denied':
      return `Expansion denied: ${String(payload.reason ?? 'policy')}`;
    case 'artifact.pointer.promoted': {
      const saved = payload.estimatedTokensSaved as number | undefined;
      return `Artifact promoted${saved ? ` (saved ${saved.toLocaleString()} tokens)` : ''}${payload.sourcePath ? ` \u2190 ${String(payload.sourcePath)}` : ''}`;
    }
    case 'response.profile.selected':
      return `Profile: ${String(payload.profile ?? 'standard')} (${String(payload.source ?? 'default')})`;
    case 'response.profile.overridden':
      return `Profile overridden to ${String(payload.profile ?? '?')}`;
    case 'runtime.startup.files.generated':
      return `Generated ${payload.filesGenerated ?? '?'} startup files${payload.durationMs ? ` in ${formatDuration(Number(payload.durationMs))}` : ''}`;
    case 'workspace.discovery.completed': {
      const targets = payload.targetsFound as string[] | undefined;
      return `Discovered ${targets?.length ?? 0} targets: ${targets?.join(', ') ?? 'none'}`;
    }
    case 'workspace.diagnosis.completed':
      return `Diagnosed: ${String(payload.repoType ?? 'unknown')} repo`;
    case 'recommendation.generated':
      return `Recommended ${(payload.bundles as string[] | undefined)?.length ?? 0} bundles via ${String(payload.source ?? '?')}`;
    case 'install.plan.created':
      return `Install plan: ${payload.operationCount ?? 0} operations for ${String(payload.targetId ?? '?')}`;
    case 'install.operation.applied':
      return `${String(payload.operation ?? 'copy')} \u2192 ${shortenPath(String(payload.target ?? ''))}${payload.durationMs ? ` (${formatDuration(Number(payload.durationMs))})` : ''}`;
    case 'install.completed':
      return `Install completed: ${payload.filesWritten ?? 0} files${payload.durationMs ? ` in ${formatDuration(Number(payload.durationMs))}` : ''}`;
    case 'install.validation.completed':
      return `Validation: ${payload.valid ? '\u2705 passed' : '\u274C failed'}`;
    case 'compaction.strategy.selected':
      return `Strategy: ${String(payload.strategy ?? '?')} (${String(payload.reason ?? '')})`;
    case 'compaction.validation.completed':
      return `Compaction validation: ${payload.valid ? '\u2705 safe' : '\u274C unsafe'}`;
    case 'command.started':
      return `\u25B6 ${String(payload.command ?? 'unknown')}`;
    case 'command.completed':
      return `\u2714 ${String(payload.command ?? '?')} completed${payload.durationMs ? ` (${formatDuration(Number(payload.durationMs))})` : ''}`;
    case 'command.failed':
      return `\u2718 ${String(payload.command ?? '?')} failed: ${String(payload.error ?? 'unknown')}`;
    case 'session.started':
      return `Session started (v${String(payload.version ?? '?')})`;
    case 'session.ended':
      return `Session ended${payload.totalDurationMs ? ` (${formatDuration(Number(payload.totalDurationMs))})` : ''}`;
    default: {
      const json = JSON.stringify(payload);
      return json.length <= 2 ? '' : json.length > 80 ? `${json.slice(0, 77)}\u2026` : json;
    }
  }
}

function computeSparklineData(events: readonly DashboardEvent[], now: number): readonly number[] {
  const bucketCount = 30;
  const bucketMs = 10_000;
  const buckets = new Array<number>(bucketCount).fill(0);
  const windowStart = now - bucketCount * bucketMs;
  for (const e of events) {
    const t = new Date(e.occurredAt).getTime();
    if (t >= windowStart) {
      const idx = Math.min(Math.floor((t - windowStart) / bucketMs), bucketCount - 1);
      buckets[idx] = (buckets[idx] ?? 0) + 1;
    }
  }
  return buckets;
}

function renderPayloadValue(value: unknown, depth = 0): ReactElement {
  if (value === null || value === undefined) {
    return <span style={{ color: colors.text.muted, fontStyle: 'italic' }}>null</span>;
  }
  if (typeof value === 'boolean') {
    return (
      <span style={{
        color: value ? colors.accent.mint : colors.accent.coral,
        fontWeight: 600,
        fontSize: 10,
        padding: '1px 6px',
        borderRadius: 4,
        background: value ? 'rgba(34,197,94,0.12)' : 'rgba(239,68,68,0.12)',
      }}>
        {value ? 'true' : 'false'}
      </span>
    );
  }
  if (typeof value === 'number') {
    return <span style={{ color: colors.accent.amber, fontFamily: 'monospace' }}>{value.toLocaleString()}</span>;
  }
  if (typeof value === 'string') {
    const display = value.length > 120 ? `${value.slice(0, 117)}\u2026` : value;
    return <span style={{ color: colors.accent.lavender }}>&quot;{display}&quot;</span>;
  }
  if (Array.isArray(value)) {
    if (value.length === 0) return <span style={{ color: colors.text.muted }}>[]</span>;
    if (depth > 1) return <span style={{ color: colors.text.muted }}>[{value.length} items]</span>;
    return (
      <span>
        {value.map((item, i) => (
          <span key={i}>
            {renderPayloadValue(item, depth + 1)}
            {i < value.length - 1 && <span style={{ color: colors.text.muted }}>, </span>}
          </span>
        ))}
      </span>
    );
  }
  if (typeof value === 'object') {
    const entries = Object.entries(value as Record<string, unknown>);
    if (entries.length === 0) return <span style={{ color: colors.text.muted }}>{'{}'}</span>;
    if (depth > 1) return <span style={{ color: colors.text.muted }}>{`{${entries.length} keys}`}</span>;
    return (
      <div style={{ paddingLeft: 12, borderLeft: `1px solid ${colors.border.subtle}`, marginTop: 2 }}>
        {entries.map(([k, v]) => (
          <div key={k} style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 2 }}>
            <span style={{ color: colors.text.muted, minWidth: 80, fontSize: 10 }}>{k}</span>
            {renderPayloadValue(v, depth + 1)}
          </div>
        ))}
      </div>
    );
  }
  return <span>{String(value)}</span>;
}

const headerRowStyle: CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  gap: 12,
  marginBottom: 8,
};

const chipBarStyle: CSSProperties = {
  display: 'flex',
  gap: 4,
  flexWrap: 'wrap',
  marginBottom: 8,
};

const inputStyle: CSSProperties = {
  width: '100%',
  background: colors.bg.primary,
  border: `1px solid ${colors.border.subtle}`,
  borderRadius: 6,
  padding: '6px 10px',
  color: colors.text.primary,
  fontSize: 12,
  outline: 'none',
  marginBottom: 8,
  boxSizing: 'border-box',
};

const feedStyle: CSSProperties = {
  maxHeight: 440,
  overflowY: 'auto',
  overflowX: 'hidden',
  fontSize: 11,
  position: 'relative',
};

const newEventsPillStyle: CSSProperties = {
  position: 'sticky',
  top: 0,
  zIndex: 10,
  textAlign: 'center',
  padding: '4px 12px',
  background: colors.accent.magenta,
  color: '#fff',
  fontSize: 11,
  fontWeight: 600,
  borderRadius: 12,
  cursor: 'pointer',
  margin: '0 auto 4px',
  width: 'fit-content',
};

const expandedContainerStyle: CSSProperties = {
  padding: '8px 12px',
  background: colors.bg.primary,
  borderRadius: radius.sm,
  margin: '2px 0 6px 12px',
  fontSize: 11,
  borderLeft: `2px solid ${colors.border.active}`,
};

const replayBadgeStyle: CSSProperties = {
  fontSize: 8,
  fontWeight: 700,
  letterSpacing: 1,
  padding: '1px 5px',
  borderRadius: 3,
  background: 'rgba(99,102,241,0.2)',
  color: colors.accent.lavender,
  textTransform: 'uppercase' as const,
  marginLeft: 4,
};

export function LiveEventFeed({ events }: LiveEventFeedProps) {
  const { selectedCategory } = useDashboardContext();
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [activeCategories, setActiveCategories] = useState<ReadonlySet<string>>(new Set());
  const [now, setNow] = useState(Date.now());
  const [animatedIds, setAnimatedIds] = useState<ReadonlySet<string>>(new Set());
  const feedRef = useRef<HTMLDivElement>(null);
  const isAtTopRef = useRef(true);
  const prevEventCountRef = useRef(0);
  const [missedCount, setMissedCount] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 5000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (events.length > prevEventCountRef.current) {
      const newIds = new Set<string>();
      const added = events.length - prevEventCountRef.current;
      for (let i = events.length - added; i < events.length; i++) {
        const evt = events[i];
        if (evt) newIds.add(evt.eventId);
      }
      setAnimatedIds(newIds);
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setAnimatedIds(new Set());
        });
      });
      if (!isAtTopRef.current) {
        setMissedCount((c) => c + added);
      }
    }
    prevEventCountRef.current = events.length;
  }, [events]);

  const handleScroll = useCallback(() => {
    if (!feedRef.current) return;
    isAtTopRef.current = feedRef.current.scrollTop < 30;
    if (isAtTopRef.current) setMissedCount(0);
  }, []);

  const scrollToTop = useCallback(() => {
    feedRef.current?.scrollTo({ top: 0, behavior: 'smooth' });
    setMissedCount(0);
  }, []);

  const categoryCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    for (const e of events) {
      const cat = getCategoryFromEventType(e.eventType);
      counts[cat] = (counts[cat] ?? 0) + 1;
    }
    return counts;
  }, [events]);

  const activeCategoriesToUse = activeCategories.size === 0 ? null : activeCategories;

  const filtered = useMemo(() => {
    const term = search.toLowerCase();
    return [...events]
      .reverse()
      .filter((e) => {
        if (selectedCategory && getCategoryFromEventType(e.eventType) !== selectedCategory) return false;
        if (activeCategoriesToUse && !activeCategoriesToUse.has(getCategoryFromEventType(e.eventType))) return false;
        if (term && !e.eventType.toLowerCase().includes(term) && !formatSmartSummary(e.eventType, e.payload).toLowerCase().includes(term)) return false;
        return true;
      })
      .slice(0, 200);
  }, [events, search, activeCategoriesToUse, selectedCategory]);

  const sparklineData = useMemo(() => computeSparklineData(events, now), [events, now]);

  const eventsPerMin = useMemo(() => {
    const fiveMinAgo = now - 300_000;
    const recent = events.filter((e) => new Date(e.occurredAt).getTime() >= fiveMinAgo);
    return recent.length > 0 ? Math.round((recent.length / 5) * 10) / 10 : 0;
  }, [events, now]);

  const toggleCategory = (cat: string) => {
    setActiveCategories((prev) => {
      const next = new Set(prev);
      if (next.has(cat)) { next.delete(cat); } else { next.add(cat); }
      return next;
    });
  };

  const allCategories = Object.keys(categoryCounts).sort();

  return (
    <Panel title="Live Event Feed" subtitle={`${events.length} events`}>
      <div style={headerRowStyle}>
        <Sparkline data={[...sparklineData]} width={120} height={22} color={colors.accent.magenta} />
        <span style={{ color: colors.text.secondary, fontSize: 11 }}>{eventsPerMin}/min</span>
        <span style={{ flex: 1 }} />
        <span style={{ color: colors.text.muted, fontSize: 10 }}>last 5 min</span>
      </div>

      {allCategories.length > 0 && (
        <div style={chipBarStyle}>
          {allCategories.map((cat) => {
            const isActive = activeCategoriesToUse === null || activeCategoriesToUse.has(cat);
            const catColor = getCategoryColor(`${cat}.x`);
            return (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: 3,
                  padding: '2px 8px',
                  fontSize: 10,
                  fontWeight: 500,
                  border: `1px solid ${isActive ? catColor : colors.border.subtle}`,
                  borderRadius: 12,
                  background: isActive ? `${catColor}18` : 'transparent',
                  color: isActive ? catColor : colors.text.muted,
                  cursor: 'pointer',
                  transition: 'all 0.15s ease',
                  opacity: isActive ? 1 : 0.6,
                }}
              >
                <span style={{ fontSize: 10 }}>{getCategoryEmoji(`${cat}.x`)}</span>
                {cat}
                <span style={{ fontSize: 9, opacity: 0.7, marginLeft: 2 }}>{categoryCounts[cat]}</span>
              </button>
            );
          })}
          {activeCategories.size > 0 && (
            <button
              onClick={() => setActiveCategories(new Set())}
              style={{
                padding: '2px 8px',
                fontSize: 10,
                border: `1px solid ${colors.border.subtle}`,
                borderRadius: 12,
                background: 'transparent',
                color: colors.text.muted,
                cursor: 'pointer',
              }}
            >
              clear
            </button>
          )}
        </div>
      )}

      <input
        style={inputStyle}
        placeholder="Search events, summaries..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      <div style={feedStyle} ref={feedRef} onScroll={handleScroll}>
        {missedCount > 0 && (
          <div style={newEventsPillStyle} onClick={scrollToTop}>
            {missedCount} new event{missedCount > 1 ? 's' : ''} &uarr;
          </div>
        )}
        {filtered.map((e) => {
          const catColor = getCategoryColor(e.eventType);
          const severity = getSeverity(e.eventType);
          const isNew = animatedIds.has(e.eventId);
          const isExpanded = expandedId === e.eventId;

          return (
            <div key={e.eventId}>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: '14px 1fr auto',
                  gap: 6,
                  padding: '5px 8px 5px 0',
                  borderBottom: `1px solid ${colors.border.subtle}`,
                  borderLeft: `3px solid ${catColor}`,
                  cursor: 'pointer',
                  background: isExpanded ? colors.bg.cardHover : 'transparent',
                  opacity: isNew ? 0 : 1,
                  transform: isNew ? 'translateY(-6px)' : 'translateY(0)',
                  transition: 'opacity 0.3s ease-out, transform 0.3s ease-out, background 0.15s ease',
                }}
                onClick={() => setExpandedId(isExpanded ? null : e.eventId)}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', paddingLeft: 4 }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: severityColors[severity],
                    opacity: severity === 'info' ? 0.3 : 0.9,
                    boxShadow: severity === 'error' ? `0 0 6px ${severityColors.error}` : 'none',
                  }} />
                </div>

                <div style={{ minWidth: 0, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginBottom: 1 }}>
                    <span style={{ fontSize: 11 }}>{getCategoryEmoji(e.eventType)}</span>
                    <span style={{ color: catColor, fontWeight: 600, fontSize: 11 }}>{e.eventType}</span>
                    {e.isReplay && <span style={replayBadgeStyle}>replay</span>}
                  </div>
                  <div style={{
                    color: severity === 'error' ? colors.accent.coral : colors.text.secondary,
                    fontSize: 11,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    fontWeight: severity === 'error' ? 500 : 400,
                  }}>
                    {formatSmartSummary(e.eventType, e.payload)}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', whiteSpace: 'nowrap' }}>
                  <span style={{ color: colors.text.muted, fontSize: 10 }} title={new Date(e.occurredAt).toLocaleString()}>
                    {relativeTime(e.occurredAt, now)}
                  </span>
                </div>
              </div>

              {isExpanded && (
                <div style={expandedContainerStyle}>
                  <div style={{ display: 'flex', gap: 12, marginBottom: 6, fontSize: 10, color: colors.text.muted, flexWrap: 'wrap' }}>
                    <span>ID: <span style={{ color: colors.text.secondary, fontFamily: 'monospace' }}>{e.eventId}</span></span>
                    {e.runtimeSessionId && <span>Session: <span style={{ color: colors.text.secondary, fontFamily: 'monospace' }}>{e.runtimeSessionId}</span></span>}
                    <span>{new Date(e.occurredAt).toLocaleString()}</span>
                  </div>
                  {Object.keys(e.payload).length > 0 ? (
                    <div>
                      {Object.entries(e.payload).map(([key, val]) => (
                        <div key={key} style={{ display: 'flex', gap: 8, alignItems: 'baseline', marginBottom: 3, fontSize: 11 }}>
                          <span style={{ color: colors.text.muted, minWidth: 100, fontFamily: 'monospace', fontSize: 10, flexShrink: 0 }}>{key}</span>
                          <span style={{ color: colors.text.primary, fontFamily: 'monospace', fontSize: 11 }}>
                            {renderPayloadValue(val)}
                          </span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <span style={{ color: colors.text.muted, fontStyle: 'italic', fontSize: 10 }}>No payload data</span>
                  )}
                </div>
              )}
            </div>
          );
        })}
        {filtered.length === 0 && (
          <div style={{ padding: 24, textAlign: 'center', color: colors.text.muted }}>
            {events.length === 0 ? 'Waiting for events\u2026' : 'No events match filter'}
          </div>
        )}
      </div>
    </Panel>
  );
}
