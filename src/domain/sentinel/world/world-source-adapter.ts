import type { ObservationDraft } from "../../../infrastructure/sentinel/stores/observation-store.js";
import type { WorldEvent, WorldSourceKind } from "./world-event.js";

export interface FetchSinceContext {
  readonly cursor: string | null;
  readonly maxEvents: number;
  readonly userAgent: string;
}

export interface FetchSinceResult {
  readonly events: readonly WorldEvent[];
  readonly nextCursor: string | null;
  readonly fromCache: boolean;
}

export interface WorldSourceAdapter {
  readonly id: string;
  readonly kind: WorldSourceKind;
  readonly subject: string;
  fetchSince(context: FetchSinceContext): Promise<FetchSinceResult>;
  normalize(event: WorldEvent): ObservationDraft;
}

export interface AdapterRecipe {
  readonly id: string;
  readonly subject: string;
  build(): WorldSourceAdapter;
}
