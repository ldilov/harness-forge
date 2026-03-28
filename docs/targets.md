# Targets

Harness Forge emphasizes Codex and Claude Code with project-owned runtime
surfaces in `.codex/` and `.claude/`.

## First-class targets

- `codex` for the strongest local runtime, recommendation, and maintenance path
- `claude-code` for first-class hook support plus the shared hidden `.hforge/` runtime

## Portable targets

- `cursor` for docs, manifests, and recommendation portability
- `opencode` for docs, manifests, and recommendation portability

## Production note

No target should expose the canonical AI layer at the repo root. Installed
canonical skills, rules, knowledge, templates, runtime state, and memory stay
under `.hforge/`, while root and target-specific files act as thin bridges.
