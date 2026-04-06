export const colors = {
  bg: {
    primary: '#0B0E11',
    secondary: '#111518',
    card: '#161B1F',
    cardHover: '#1C2127',
    sidebar: '#090C0F',
    gradient: 'linear-gradient(135deg, #141E1A 0%, #0F1512 50%, #0B0E11 100%)',
  },
  text: {
    primary: '#E5E7EB',
    secondary: '#9CA3AF',
    muted: '#6B7280',
  },
  accent: {
    coral: '#EF4444',
    magenta: '#22C55E',
    peach: '#F59E0B',
    amber: '#FBBF24',
    mint: '#22C55E',
    lavender: '#6366F1',
    rose: '#F87171',
    violet: '#8B5CF6',
  },
  border: {
    subtle: '#1F2937',
    active: '#374151',
  },
  threshold: {
    safe: '#22C55E',
    evaluate: '#22C55E',
    trim: '#FBBF24',
    summarize: '#F59E0B',
    rollup: '#EF4444',
    rollover: '#DC2626',
  },
  enforcement: {
    guidance: '#22C55E',
    defaults: '#6366F1',
    nudge: '#F59E0B',
    enforcement: '#EF4444',
  },
  category: {
    memory: '#22C55E',
    budget: '#FBBF24',
    compaction: '#8B5CF6',
    subagent: '#14B8A6',
    suppression: '#F59E0B',
    expansion: '#6366F1',
    artifact: '#10B981',
    output: '#E5E7EB',
    system: '#9CA3AF',
  },
  chart: {
    series1: '#22C55E',
    series2: '#14B8A6',
    series3: '#6366F1',
    series4: '#8B5CF6',
    series5: '#FBBF24',
    series6: '#F59E0B',
    areaFill: 'rgba(34,197,94,0.10)',
    areaFillAlt: 'rgba(20,184,166,0.10)',
    gridLine: '#1F2937',
  },
} as const;

export const categoryColorMap: Readonly<Record<string, string>> = {
  context: colors.category.memory,
  memory: colors.category.memory,
  budget: colors.category.budget,
  compaction: colors.category.compaction,
  subagent: colors.category.subagent,
  artifact: colors.category.artifact,
  response: colors.category.output,
  history: colors.category.expansion,
  runtime: colors.category.system,
  workspace: colors.accent.lavender,
  install: colors.accent.mint,
  command: colors.accent.peach,
  session: colors.accent.rose,
  recommendation: colors.accent.amber,
};

export const categoryEmoji: Readonly<Record<string, string>> = {
  context: '\u{1F9E0}',
  memory: '\u{1F9E0}',
  budget: '\u{1F4CA}',
  compaction: '\u{1F5DC}',
  subagent: '\u{1F916}',
  artifact: '\u{1F4E6}',
  response: '\u{1F4DD}',
  history: '\u{1F4DC}',
  runtime: '\u{2699}\u{FE0F}',
  workspace: '\u{1F50D}',
  install: '\u{1F4E5}',
  command: '\u{25B6}\u{FE0F}',
  session: '\u{1F3AC}',
  recommendation: '\u{1F4A1}',
};

export function getCategoryFromEventType(eventType: string): string {
  return eventType.split('.')[0] ?? '';
}

export function getCategoryColor(eventType: string): string {
  return categoryColorMap[getCategoryFromEventType(eventType)] ?? colors.text.muted;
}

export function getCategoryEmoji(eventType: string): string {
  return categoryEmoji[getCategoryFromEventType(eventType)] ?? '\u{1F4E2}';
}

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
} as const;

export const radius = {
  sm: 4,
  md: 8,
  lg: 12,
} as const;
