import path from "node:path";

import { parseAgentStartBrief } from "../../domain/runtime/agent-brief.js";
import {
  RUNTIME_AGENT_BRIEF_FILE,
  RUNTIME_AGENT_BRIEF_MD_FILE,
  RUNTIME_DIR,
  writeJsonFile,
  writeTextFile
} from "../../shared/index.js";
import { buildAgentBrief } from "./build-agent-brief.js";
import { renderAgentBriefMarkdown } from "./render-agent-brief.js";

export interface WriteAgentBriefResult {
  jsonPath: string;
  markdownPath: string;
}

export async function writeAgentBrief(workspaceRoot: string): Promise<WriteAgentBriefResult> {
  const brief = parseAgentStartBrief(await buildAgentBrief({ workspaceRoot }));
  const jsonPath = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_AGENT_BRIEF_FILE);
  const markdownPath = path.join(workspaceRoot, RUNTIME_DIR, RUNTIME_AGENT_BRIEF_MD_FILE);

  await Promise.all([
    writeJsonFile(jsonPath, brief),
    writeTextFile(markdownPath, renderAgentBriefMarkdown(brief))
  ]);

  return { jsonPath, markdownPath };
}
