import type { RecursiveCodeCell, RecursiveCodeCellResult } from "../../domain/recursive/code-cell.js";
import {
  listRecursiveCodeCells,
  loadRecursiveCodeCell,
  loadRecursiveCodeCellResult,
  readRecursiveCodeCellSource,
  writeRecursiveCodeCell
} from "./session-store.js";

export { listRecursiveCodeCells, loadRecursiveCodeCell, loadRecursiveCodeCellResult, readRecursiveCodeCellSource, writeRecursiveCodeCell };

export async function persistRecursiveCodeCell(
  workspaceRoot: string,
  cell: RecursiveCodeCell,
  result?: RecursiveCodeCellResult,
  sourceText?: string,
  stdout?: string,
  stderr?: string
) {
  return writeRecursiveCodeCell(workspaceRoot, cell, result, sourceText, stdout, stderr);
}
