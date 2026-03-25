export interface ObservabilityEvent {
  eventId: string;
  eventType: string;
  recordedAt: string;
  workspaceId: string;
  target: string;
  featureId?: string;
  result: string;
  durationMs?: number;
  confidence?: number;
  inputs?: Record<string, unknown>;
  outputs?: Record<string, unknown>;
  artifacts?: string[];
  evidence?: string[];
  tags?: string[];
}
