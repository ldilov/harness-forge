export const ALLOWED_SECTIONS = [
  'Current Objective',
  'Current State',
  'Accepted Decisions',
  'Constraints',
  'Open Questions / Blockers',
  'Next Best Actions',
  'Canonical References',
  'Previous Summary',
] as const;

export const FORBIDDEN_PATTERNS = [
  'full chat transcript',
  'repeated repo explanation',
  'long log output',
  'tool output dump',
  'dead-end exploration',
  'duplicated documentation',
  'large code block',
] as const;

export const SIZE_BUDGET = {
  targetMinWords: 300,
  targetMaxWords: 1200,
  hardCapTokens: 4000,
  charsPerToken: 4,
} as const;

export const SUBAGENT_FORBIDDEN_FIELDS = [
  'fullMemory',
  'fullSessionSummary',
  'fullEventHistory',
  'unrelatedArtifacts',
] as const;
