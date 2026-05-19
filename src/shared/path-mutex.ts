import path from "node:path";

const inFlight = new Map<string, Promise<unknown>>();

export async function withPathLock<T>(filePath: string, action: () => Promise<T>): Promise<T> {
  const key = path.resolve(filePath);
  const previous = inFlight.get(key);
  const deferred = previous === undefined ? Promise.resolve() : previous.catch(() => undefined);
  const next = deferred.then(action);
  inFlight.set(key, next);
  try {
    return await next;
  } finally {
    if (inFlight.get(key) === next) {
      inFlight.delete(key);
    }
  }
}
