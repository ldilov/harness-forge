export interface AbortHandle {
  readonly id: string;
  readonly controller: AbortController;
  readonly registeredAt: string;
  readonly reason: string;
}

export class AbortRegistry {
  private readonly handles: Map<string, AbortHandle> = new Map();

  register(id: string, reason: string): AbortHandle {
    const existing = this.handles.get(id);
    if (existing !== undefined) {
      return existing;
    }
    const handle: AbortHandle = {
      id,
      controller: new AbortController(),
      registeredAt: new Date().toISOString(),
      reason,
    };
    this.handles.set(id, handle);
    return handle;
  }

  unregister(id: string): void {
    this.handles.delete(id);
  }

  abortAll(reason: string): readonly AbortHandle[] {
    const aborted: AbortHandle[] = [];
    for (const handle of this.handles.values()) {
      if (!handle.controller.signal.aborted) {
        try {
          handle.controller.abort(reason);
        } catch {
          continue;
        }
        aborted.push(handle);
      }
    }
    return aborted;
  }

  size(): number {
    return this.handles.size;
  }

  list(): readonly AbortHandle[] {
    return [...this.handles.values()];
  }
}
