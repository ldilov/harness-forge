import fs from "node:fs/promises";
import path from "node:path";
import { ensureDir, exists } from "../../../shared/fs.js";

export class JsonlStore<T> {
  constructor(private readonly filePath: string) {}

  async append(record: T): Promise<void> {
    await ensureDir(path.dirname(this.filePath));
    const line = `${JSON.stringify(record)}\n`;
    await fs.appendFile(this.filePath, line, "utf8");
  }

  async appendMany(records: readonly T[]): Promise<void> {
    if (records.length === 0) {
      return;
    }
    await ensureDir(path.dirname(this.filePath));
    const payload = records.map((record) => `${JSON.stringify(record)}`).join("\n") + "\n";
    await fs.appendFile(this.filePath, payload, "utf8");
  }

  async readAll(): Promise<T[]> {
    if (!(await exists(this.filePath))) {
      return [];
    }
    const raw = await fs.readFile(this.filePath, "utf8");
    if (raw.length === 0) {
      return [];
    }
    const out: T[] = [];
    for (const line of raw.split("\n")) {
      if (line.length === 0) {
        continue;
      }
      out.push(JSON.parse(line) as T);
    }
    return out;
  }

  async tail(limit: number): Promise<T[]> {
    const all = await this.readAll();
    return all.slice(-Math.max(0, limit));
  }

  async count(): Promise<number> {
    const all = await this.readAll();
    return all.length;
  }

  get path(): string {
    return this.filePath;
  }
}
