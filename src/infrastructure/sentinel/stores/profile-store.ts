import { AtomicJsonStore } from "./atomic-json-store.js";
import {
  ActiveProfileSchema,
  defaultActiveProfile,
  type ActiveProfile,
} from "../../../domain/sentinel/policy/profile.js";
import { sentinelActiveProfilePath } from "../../../domain/sentinel/paths.js";

export class ActiveProfileStore {
  private readonly store: AtomicJsonStore<ActiveProfile>;

  constructor(workspaceRoot: string) {
    this.store = new AtomicJsonStore<ActiveProfile>(
      sentinelActiveProfilePath(workspaceRoot),
      () => defaultActiveProfile(),
      { validate: (raw) => ActiveProfileSchema.parse(raw) },
    );
  }

  async read(): Promise<ActiveProfile> {
    return this.store.read();
  }

  async write(active: ActiveProfile): Promise<void> {
    await this.store.write(ActiveProfileSchema.parse(active));
  }
}
