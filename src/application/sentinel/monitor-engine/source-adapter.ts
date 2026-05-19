import type { LoadedMonitor } from "./registry.js";
import type { ObservationDraft } from "../../../infrastructure/sentinel/stores/observation-store.js";

export interface SourceAdapterContext {
  readonly workspaceRoot: string;
  readonly monitor: LoadedMonitor;
}

export interface CollectResult {
  readonly drafts: readonly ObservationDraft[];
  readonly commit?: () => Promise<void>;
}

export interface SourceAdapter {
  readonly id: string;
  collect(context: SourceAdapterContext): Promise<CollectResult>;
}

export class SourceAdapterRegistry {
  private readonly adapters = new Map<string, SourceAdapter>();

  register(adapter: SourceAdapter): void {
    this.adapters.set(adapter.id, adapter);
  }

  get(id: string): SourceAdapter | undefined {
    return this.adapters.get(id);
  }

  has(id: string): boolean {
    return this.adapters.has(id);
  }

  ids(): readonly string[] {
    return [...this.adapters.keys()];
  }
}
