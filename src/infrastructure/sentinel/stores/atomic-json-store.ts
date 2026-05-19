import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, exists } from "../../../shared/fs.js";
import { withPathLock } from "../../../shared/path-mutex.js";

export interface AtomicJsonStoreOptions<T> {
  readonly validate?: (raw: unknown) => T;
}

export class AtomicJsonStoreReadError extends Error {
  constructor(readonly filePath: string, cause: unknown) {
    super(`failed to read or validate ${filePath}: ${cause instanceof Error ? cause.message : String(cause)}`);
    this.name = "AtomicJsonStoreReadError";
  }
}

export class AtomicJsonStore<T> {
  private readonly validate: ((raw: unknown) => T) | undefined;

  constructor(
    private readonly filePath: string,
    private readonly initial: () => T,
    options: AtomicJsonStoreOptions<T> = {},
  ) {
    this.validate = options.validate;
  }

  async read(): Promise<T> {
    if (!(await exists(this.filePath))) {
      return this.initial();
    }
    const raw = await fs.readFile(this.filePath, "utf8");
    if (raw.length === 0) {
      return this.initial();
    }
    let parsed: unknown;
    try {
      parsed = JSON.parse(raw);
    } catch (parseError: unknown) {
      throw new AtomicJsonStoreReadError(this.filePath, parseError);
    }
    if (this.validate === undefined) {
      return parsed as T;
    }
    try {
      return this.validate(parsed);
    } catch (validationError: unknown) {
      throw new AtomicJsonStoreReadError(this.filePath, validationError);
    }
  }

  private async writeUnlocked(value: T): Promise<void> {
    await ensureDir(path.dirname(this.filePath));
    const tmp = `${this.filePath}.tmp`;
    await fs.writeFile(tmp, `${JSON.stringify(value, null, 2)}\n`, "utf8");
    await fs.rename(tmp, this.filePath);
  }

  async write(value: T): Promise<void> {
    await withPathLock(this.filePath, () => this.writeUnlocked(value));
  }

  async update(mutator: (current: T) => T | Promise<T>): Promise<T> {
    return withPathLock(this.filePath, async () => {
      const current = await this.read();
      const next = await mutator(current);
      await this.writeUnlocked(next);
      return next;
    });
  }

  async writeWithinLock(value: T): Promise<void> {
    await this.writeUnlocked(value);
  }

  get path(): string {
    return this.filePath;
  }
}
