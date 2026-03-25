import path from "node:path";

import { ensureDir, FLOW_STATE_FILE, SPECIFY_STATE_DIR, writeJsonFile } from "../../shared/index.js";
import type { FlowStateRecord } from "./load-flow-state.js";

export async function saveFlowState(root: string, state: FlowStateRecord): Promise<string> {
  const stateDir = path.join(root, SPECIFY_STATE_DIR);
  await ensureDir(stateDir);
  const destination = path.join(stateDir, FLOW_STATE_FILE);
  await writeJsonFile(destination, {
    ...state,
    updatedAt: state.updatedAt || new Date().toISOString()
  });
  return destination;
}
