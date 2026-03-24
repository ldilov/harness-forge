# Hooks

Harness Forge differentiates between target hook support and its own shipped
validation workflows.

## Target behavior

- Codex: no runtime hook support in the current adapter
- Claude Code: hook-capable target surface
- Cursor and OpenCode: documented as hook-capable targets

## What still ships for every target

- validation scripts in `scripts/templates/`
- `.agents/skills/` for Spec Kit workflows
- target-neutral docs and language pack knowledge

## Recommended practice

Use workflow validation and release gates even when the target does not provide
hook execution.
