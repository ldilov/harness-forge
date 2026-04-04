import { type HistoryExpansionPolicy } from '@domain/behavior/history-expansion-policy.js';

export interface ExpansionRequest {
  readonly reason: string;
  readonly overrideFlag?:
    | 'explicit_user_request'
    | 'task_policy_exemption'
    | 'recovery_debug_mode';
}

export interface ExpansionResult {
  readonly allowed: boolean;
  readonly eventType: string;
  readonly reason: string;
}

export class HistoryExpansionGate {
  private readonly policy: HistoryExpansionPolicy;

  constructor(policy: HistoryExpansionPolicy) {
    this.policy = policy;
  }

  evaluate(request: ExpansionRequest): ExpansionResult {
    if (
      request.overrideFlag &&
      this.policy.overrideConditions.includes(request.overrideFlag)
    ) {
      return {
        allowed: true,
        eventType: 'history.expansion.requested',
        reason: `Override: ${request.overrideFlag}`,
      };
    }

    if (this.policy.defaultAction === 'allow') {
      return {
        allowed: true,
        eventType: 'history.expansion.requested',
        reason: 'Default policy: allow',
      };
    }

    return {
      allowed: false,
      eventType: 'history.expansion.denied',
      reason: `Denied: no valid override. Reason: ${request.reason}`,
    };
  }
}
