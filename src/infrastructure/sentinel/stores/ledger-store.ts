import { JsonlStore } from "./jsonl-store.js";
import {
  SideEffect,
  SideEffectSchema,
} from "../../../domain/sentinel/ledger/side-effect.js";
import {
  sentinelLedgerPath,
  sentinelRunSideEffectsPath,
} from "../../../domain/sentinel/paths.js";

export class LedgerStore {
  private readonly globalStore: JsonlStore<SideEffect>;
  private readonly perRun: JsonlStore<SideEffect> | null;

  private constructor(globalPath: string, perRunPath: string | null) {
    this.globalStore = new JsonlStore<SideEffect>(globalPath);
    this.perRun = perRunPath === null ? null : new JsonlStore<SideEffect>(perRunPath);
  }

  static forRun(workspaceRoot: string, actionId: string): LedgerStore {
    return new LedgerStore(
      sentinelLedgerPath(workspaceRoot),
      sentinelRunSideEffectsPath(workspaceRoot, actionId),
    );
  }

  static global(workspaceRoot: string): LedgerStore {
    return new LedgerStore(sentinelLedgerPath(workspaceRoot), null);
  }

  async record(effect: SideEffect): Promise<SideEffect> {
    if (this.perRun === null) {
      throw new Error(
        "LedgerStore.record requires a per-run store; construct via LedgerStore.forRun(...)",
      );
    }
    const validated = SideEffectSchema.parse(effect);
    await this.globalStore.append(validated);
    await this.perRun.append(validated);
    return validated;
  }

  async readAll(): Promise<readonly SideEffect[]> {
    return this.globalStore.readAll();
  }

  async readForRun(): Promise<readonly SideEffect[]> {
    if (this.perRun === null) {
      return [];
    }
    return this.perRun.readAll();
  }
}
