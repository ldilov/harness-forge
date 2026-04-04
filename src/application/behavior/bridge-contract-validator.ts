import { type BridgeContract } from '@domain/behavior/bridge-contract.js';

export interface ValidationResult {
  readonly valid: boolean;
  readonly diffs: readonly string[];
}

interface TargetedContract {
  readonly target: string;
  readonly contract: BridgeContract;
}

export class BridgeContractValidator {
  validate(contracts: ReadonlyArray<TargetedContract>): ValidationResult {
    if (contracts.length < 2) {
      return { valid: true, diffs: [] };
    }

    const diffs: string[] = [];
    const reference = contracts[0]!;

    for (let i = 1; i < contracts.length; i++) {
      const current = contracts[i]!;

      if (!arraysEqual(reference.contract.resumeOrder, current.contract.resumeOrder)) {
        diffs.push(
          `resumeOrder differs between "${reference.target}" and "${current.target}"`,
        );
      }

      if (reference.contract.conflictRule !== current.contract.conflictRule) {
        diffs.push(
          `conflictRule differs between "${reference.target}" and "${current.target}"`,
        );
      }

      if (reference.contract.historyRule !== current.contract.historyRule) {
        diffs.push(
          `historyRule differs between "${reference.target}" and "${current.target}"`,
        );
      }

      if (reference.contract.subagentRule !== current.contract.subagentRule) {
        diffs.push(
          `subagentRule differs between "${reference.target}" and "${current.target}"`,
        );
      }

      if (reference.contract.outputRule !== current.contract.outputRule) {
        diffs.push(
          `outputRule differs between "${reference.target}" and "${current.target}"`,
        );
      }
    }

    return { valid: diffs.length === 0, diffs };
  }
}

function arraysEqual(a: readonly string[], b: readonly string[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((val, idx) => val === b[idx]);
}
