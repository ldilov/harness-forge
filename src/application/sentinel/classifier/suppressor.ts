import type { Signal } from "../../../domain/sentinel/signal/signal.js";
import type { SuppressionStore } from "../../../infrastructure/sentinel/stores/signal-store.js";

export class SuppressionFilter {
  constructor(private readonly suppressions: SuppressionStore) {}

  async apply(signals: readonly Signal[], now: number = Date.now()): Promise<readonly Signal[]> {
    const index = await this.suppressions.list();
    return signals.map((signal) => {
      const entry = index[signal.id];
      if (entry === undefined) {
        return signal;
      }
      if (!this.suppressions.isActive(entry, now)) {
        return signal;
      }
      if (signal.status === "suppressed") {
        return signal;
      }
      return { ...signal, status: "suppressed" as const };
    });
  }
}
