# Targets

Harness Forge keeps the same product surface for Codex and Claude Code, then
layers target-specific placement and guidance on top.

## Supported targets

- Codex
- Claude Code
- Cursor
- OpenCode

## Shared behavior

- all targets consume the same bundle manifests
- language packs ship from the same `knowledge-bases/seeded/` source
- task and workflow templates reuse the same validator bundle

## Codex highlights

- keeps `AGENTS.md` at repo root
- can consume `.agents/skills/` directly
- uses `.hforge/templates/` for installed workflow templates

## Claude Code highlights

- receives root guidance through `CLAUDE.md`
- keeps template assets under `.claude/templates/`
- still benefits from the shared seeded language and validator content

## See also

- `docs/install/targets.md`
- `targets/codex/adapter.json`
- `targets/claude-code/adapter.json`
