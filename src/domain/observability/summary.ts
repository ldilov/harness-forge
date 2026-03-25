export interface ObservabilitySummary {
  generatedAt: string;
  totalEvents: number;
  byEventType: Record<string, number>;
  byResult: Record<string, number>;
  recommendationAcceptanceRate?: number;
  benchmarkPassRate?: number;
  driftFindings: string[];
}
