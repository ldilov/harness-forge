import path from "node:path";

import { ensureDir, exists, writeTextFile } from "../../shared/index.js";

export interface GenerateClaudeMdResult {
  readonly claudeMdPath: string;
  readonly commandsForgeCreated: boolean;
  readonly commandsForgePath: string | null;
}

function buildClaudeMdContent(): string {
  return `# Harness Forge

This workspace is managed by [Harness Forge](https://github.com/ldilov/harness-forge) — a self-improving AI coding agent harness.

## Quick Reference

See \`AGENTS.md\` for full guidance. See \`.hforge/generated/agent-command-catalog.json\` for machine-readable command discovery.

## CLI Commands

Resolve CLI execution in this order:
1. \`.hforge/generated/bin/hforge\` (workspace launcher)
2. Bare \`hforge\` (if shell setup was run)
3. \`npx @harness-forge/cli\` (fallback — always works)

### Essential commands

| Command | What it does |
|---------|-------------|
| \`hforge next\` | Recommends the most useful action right now |
| \`hforge status --json\` | Check what's installed |
| \`hforge doctor --json\` | Full health check |
| \`hforge refresh\` | Regenerate runtime after code changes |
| \`hforge dashboard\` | Open real-time browser dashboard |

### Living Loop commands

| Command | What it does |
|---------|-------------|
| \`hforge loop\` | Living Loop health summary |
| \`hforge score\` | Session effectiveness scores |
| \`hforge insights\` | Browse learned patterns |
| \`hforge adapt\` | View/manage auto-tunings |
| \`hforge trace\` | View session traces |
| \`hforge learn\` | Trigger pattern extraction |

### Sharing & maintenance

| Command | What it does |
|---------|-------------|
| \`hforge export --bundle <file>\` | Export tuned harness as .hfb bundle |
| \`hforge import <file>\` | Import bundle from another machine |
| \`hforge update\` | Update harness to latest version |
| \`hforge audit\` | Verify install integrity |

## Runtime

- Hidden canonical layer: \`.hforge/\`
- Visible bridges: \`AGENTS.md\`, \`.agents/skills/\`, \`.claude/\`
- Command catalog: \`.hforge/generated/agent-command-catalog.json\`
- Agent manifest: \`.hforge/agent-manifest.json\`
`;
}

function buildClaudeCommandsForgeMd(): string {
  return `Run the Harness Forge CLI command: $ARGUMENTS

Resolution order:
1. .hforge/generated/bin/hforge $ARGUMENTS
2. hforge $ARGUMENTS
3. npx @harness-forge/cli $ARGUMENTS

Always pass --json for machine-readable output when processing results.
`;
}

export async function generateClaudeMd(workspaceRoot: string): Promise<GenerateClaudeMdResult> {
  const claudeMdContent = buildClaudeMdContent();
  const claudeMdPath = path.join(workspaceRoot, "CLAUDE.md");
  await writeTextFile(claudeMdPath, claudeMdContent);

  let commandsForgeCreated = false;
  let commandsForgePath: string | null = null;

  const claudeDir = path.join(workspaceRoot, ".claude");
  if (await exists(claudeDir)) {
    const commandsDir = path.join(claudeDir, "commands");
    await ensureDir(commandsDir);
    commandsForgePath = path.join(commandsDir, "forge.md");
    await writeTextFile(commandsForgePath, buildClaudeCommandsForgeMd());
    commandsForgeCreated = true;
  }

  return {
    claudeMdPath,
    commandsForgeCreated,
    commandsForgePath,
  };
}
