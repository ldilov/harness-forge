import path from "node:path";

import { exists } from "../../shared/index.js";

export interface DiscoveredWorkspaceTarget {
  targetId: string;
  confidence: number;
  evidence: string[];
  reason: string;
  source: "detected" | "fallback";
}

async function collectExistingPaths(root: string, candidates: string[]): Promise<string[]> {
  const values = await Promise.all(
    candidates.map(async (candidate) => ((await exists(path.join(root, candidate))) ? candidate : null))
  );

  return values.filter((value): value is string => value !== null);
}

export async function discoverWorkspaceTargets(root: string): Promise<DiscoveredWorkspaceTarget[]> {
  const detectors: Array<{
    targetId: string;
    candidates: string[];
    reason: string;
    confidence: number;
  }> = [
    {
      targetId: "codex",
      candidates: ["AGENTS.md", ".agents/skills", ".codex", ".codex/config.toml"],
      reason: "Codex-style repo guidance or runtime configuration is already present.",
      confidence: 0.93
    },
    {
      targetId: "claude-code",
      candidates: ["CLAUDE.md", ".claude", ".claude/settings.json", ".claude/settings.local.json"],
      reason: "Claude Code runtime files or guidance are already present.",
      confidence: 0.96
    },
    {
      targetId: "cursor",
      candidates: [".cursor", ".cursor/rules", ".cursorrules"],
      reason: "Cursor-specific workspace configuration was detected.",
      confidence: 0.82
    },
    {
      targetId: "opencode",
      candidates: [".opencode", "opencode.json", "opencode.toml", "OPENCODE.md"],
      reason: "OpenCode-specific workspace configuration was detected.",
      confidence: 0.8
    }
  ];

  const discovered: DiscoveredWorkspaceTarget[] = [];
  for (const detector of detectors) {
    const evidence = await collectExistingPaths(root, detector.candidates);
    if (evidence.length === 0) {
      continue;
    }

    discovered.push({
      targetId: detector.targetId,
      confidence: detector.confidence,
      evidence,
      reason: detector.reason,
      source: "detected"
    });
  }

  if (discovered.length > 0) {
    return discovered;
  }

  return [
    {
      targetId: "codex",
      confidence: 0.51,
      evidence: [],
      reason: "No existing agent runtime was detected, so Codex is used as the default first-class bootstrap target.",
      source: "fallback"
    }
  ];
}
