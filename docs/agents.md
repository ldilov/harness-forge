# Agents

Harness Forge ships both product-facing agent guidance and repo-local skills.

## Primary surfaces

- `AGENTS.md` for shared workspace guidance
- `agents/planner.md` for planning expectations
- `.agents/skills/` for the shipped Spec Kit skills used in Codex-style flows
- `.agents/skills/*-engineering/` for language-aware seeded skill activation
- `skills/` for the canonical published language skill library

## When agents should use Harness Forge

- when a repository needs target-aware Codex or Claude Code setup
- when a task needs the seeded language-specific rules and examples
- when a repository language matches one of the seeded engineering skills
- when a framework-aware recommendation would be more reliable than guessing
  from file extensions
- when implementation should follow spec, plan, task, and validation loops
- when templates or workflow docs reference the shipped validator bundle
