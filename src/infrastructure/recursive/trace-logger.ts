import fs from "node:fs/promises";
import path from "node:path";

import type { RecursiveTraceEvent } from "../../domain/recursive/trace-event.js";
import { ensureDir } from "../../shared/index.js";

export async function appendRecursiveTraceEvent(tracePath: string, event: RecursiveTraceEvent): Promise<void> {
  await ensureDir(path.dirname(tracePath));
  await fs.appendFile(tracePath, `${JSON.stringify(event)}\n`, "utf8");
}
