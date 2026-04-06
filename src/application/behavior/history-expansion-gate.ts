import { type HistoryExpansionPolicy } from '@domain/behavior/history-expansion-policy.js';
import type { BehaviorEventEmitter } from './behavior-event-emitter.js';

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
  private readonly emitter?: BehaviorEventEmitter;

  constructor(policy: HistoryExpansionPolicy, emitter?: BehaviorEventEmitter) {
    this.policy = policy;
    this.emitter = emitter;
  }

  evaluate(request: ExpansionRequest): ExpansionResult {
    if (
      request.overrideFlag &&
      this.policy.overrideConditions.includes(request.overrideFlag)
    ) {
      this.emitter?.emitHistoryExpansion({
        reason: `Override: ${request.overrideFlag}`,
        overrideFlag: request.overrideFlag,
      });
      return {
        allowed: true,
        eventType: 'history.expansion.requested',
        reason: `Override: ${request.overrideFlag}`,
      };
    }

    if (this.policy.defaultAction === 'allow') {
      this.emitter?.emitHistoryExpansion({
        reason: 'Default policy: allow',
      });
      return {
        allowed: true,
        eventType: 'history.expansion.requested',
        reason: 'Default policy: allow',
      };
    }

    const denialReason = `Denied: no valid override. Reason: ${request.reason}`;
    this.emitter?.emitHistoryExpansionDenied({
      reason: denialReason,
      requestedReason: request.reason,
    });
    return {
      allowed: false,
      eventType: 'history.expansion.denied',
      reason: denialReason,
    };
  }
}
