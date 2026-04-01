import type { RecursiveSubcall } from "../../domain/recursive/subcall.js";
import {
  listRecursiveSubcalls,
  loadRecursiveSubcall,
  writeRecursiveSubcall
} from "./session-store.js";

export { listRecursiveSubcalls, loadRecursiveSubcall, writeRecursiveSubcall };

export async function upsertRecursiveSubcall(
  workspaceRoot: string,
  subcall: RecursiveSubcall
): Promise<string> {
  return writeRecursiveSubcall(workspaceRoot, subcall);
}
