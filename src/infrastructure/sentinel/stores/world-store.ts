import path from "node:path";
import fs from "node:fs/promises";
import { AtomicJsonStore } from "./atomic-json-store.js";
import {
  WorldSourcesFileSchema,
  WorldCursorsFileSchema,
  defaultWorldSources,
  watchKey,
  type WorldCursorsFile,
  type WorldSourcesFile,
  type WorldWatchRef,
} from "../../../domain/sentinel/world/world-event.js";
import {
  sentinelWorldCacheDir,
  sentinelWorldCursorsPath,
  sentinelWorldSourcesPath,
} from "../../../domain/sentinel/paths.js";
import { ensureDir, exists } from "../../../shared/fs.js";

export function safeWorldCacheKey(key: string): string {
  return key.replace(/[^a-zA-Z0-9._-]+/g, "_");
}

export class WorldSourcesStore {
  private readonly store: AtomicJsonStore<WorldSourcesFile>;

  constructor(workspaceRoot: string) {
    this.store = new AtomicJsonStore<WorldSourcesFile>(
      sentinelWorldSourcesPath(workspaceRoot),
      () => defaultWorldSources(),
      { validate: (raw) => WorldSourcesFileSchema.parse(raw) },
    );
  }

  async read(): Promise<WorldSourcesFile> {
    return this.store.read();
  }

  async write(value: WorldSourcesFile): Promise<void> {
    await this.store.write(WorldSourcesFileSchema.parse(value));
  }

  private listFor(file: WorldSourcesFile, kind: WorldWatchRef["kind"]): readonly string[] {
    if (kind === "npm") {
      return file.watch.npm;
    }
    if (kind === "github") {
      return file.watch.github;
    }
    if (kind === "runtime") {
      return file.watch.runtime;
    }
    return [];
  }

  private withList(file: WorldSourcesFile, kind: WorldWatchRef["kind"], list: readonly string[]): WorldSourcesFile {
    if (kind === "npm") {
      return { ...file, watch: { ...file.watch, npm: [...list] } };
    }
    if (kind === "github") {
      return { ...file, watch: { ...file.watch, github: [...list] } };
    }
    if (kind === "runtime") {
      return { ...file, watch: { ...file.watch, runtime: [...list] } };
    }
    return file;
  }

  async addWatch(ref: WorldWatchRef): Promise<{ added: boolean; sources: WorldSourcesFile }> {
    let added = false;
    const next = await this.store.update((current) => {
      const list = this.listFor(current, ref.kind);
      if (list.includes(ref.name)) {
        return current;
      }
      if (ref.kind !== "npm" && ref.kind !== "github" && ref.kind !== "runtime") {
        return current;
      }
      added = true;
      const sortedNext = [...list, ref.name].sort();
      return this.withList(current, ref.kind, sortedNext);
    });
    return { added, sources: next };
  }

  async removeWatch(ref: WorldWatchRef): Promise<{ removed: boolean; sources: WorldSourcesFile }> {
    let removed = false;
    const next = await this.store.update((current) => {
      const list = this.listFor(current, ref.kind);
      if (!list.includes(ref.name)) {
        return current;
      }
      removed = true;
      const filtered = list.filter((entry) => entry !== ref.name);
      return this.withList(current, ref.kind, filtered);
    });
    return { removed, sources: next };
  }
}

export class WorldCursorsStore {
  private readonly store: AtomicJsonStore<WorldCursorsFile>;

  constructor(workspaceRoot: string) {
    this.store = new AtomicJsonStore<WorldCursorsFile>(
      sentinelWorldCursorsPath(workspaceRoot),
      () => ({ cursors: {} }),
      { validate: (raw) => WorldCursorsFileSchema.parse(raw) },
    );
  }

  async get(ref: WorldWatchRef): Promise<string | null> {
    const file = await this.store.read();
    return file.cursors[watchKey(ref)] ?? null;
  }

  async set(ref: WorldWatchRef, cursor: string | null): Promise<void> {
    await this.store.update((current) => ({
      cursors: { ...current.cursors, [watchKey(ref)]: cursor },
    }));
  }
}

export class WorldCache {
  private readonly baseDir: string;

  constructor(workspaceRoot: string, source: string) {
    this.baseDir = sentinelWorldCacheDir(workspaceRoot, source);
  }

  private safeKey(key: string): string {
    return safeWorldCacheKey(key);
  }

  async write(key: string, body: string, etag: string | null): Promise<void> {
    await ensureDir(this.baseDir);
    const file = path.join(this.baseDir, `${this.safeKey(key)}.json`);
    const sidecar = path.join(this.baseDir, `${this.safeKey(key)}.meta.json`);
    await fs.writeFile(file, body, "utf8");
    await fs.writeFile(
      sidecar,
      `${JSON.stringify({ etag, savedAt: new Date().toISOString() }, null, 2)}\n`,
      "utf8",
    );
  }

  async read(key: string): Promise<{ body: string; etag: string | null } | null> {
    const file = path.join(this.baseDir, `${this.safeKey(key)}.json`);
    const sidecar = path.join(this.baseDir, `${this.safeKey(key)}.meta.json`);
    if (!(await exists(file))) {
      return null;
    }
    const body = await fs.readFile(file, "utf8");
    if (!(await exists(sidecar))) {
      return { body, etag: null };
    }
    try {
      const raw = await fs.readFile(sidecar, "utf8");
      const meta = JSON.parse(raw) as { readonly etag?: string | null };
      return { body, etag: meta.etag ?? null };
    } catch {
      return { body, etag: null };
    }
  }
}
