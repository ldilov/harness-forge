---
name: lua-engineering
description: Auto-discoverable Lua engineering skill for Harness Forge language packs.
origin: Harness Forge
---

# Lua Engineering

Activate this skill when the workspace contains `.lua` files or when the task
mentions Neovim, OpenResty, Love2D, or embedded Lua automation.

## Use these surfaces

- `.hforge/library/skills/lua-engineering/SKILL.md`
- `.hforge/library/skills/lua-engineering/references/`
- `.hforge/library/docs/authoring/enhanced-skill-import.md` for import provenance and the added runtime-profile and OpenResty context
- `RESEARCH-SOURCES.md` for the pack-level research summary
- `VALIDATION.md` for the pack-level validation notes
- `.hforge/library/rules/common/`
- `.hforge/library/rules/lua/`
- `.hforge/library/knowledge/seeded/lua/`
- `.hforge/templates/workflows/implement-lua-change.md`

## Operating rule

Use the promoted rules as the execution baseline and the seeded examples as the
reference layer for framework- and runtime-specific choices. Keep execution in
the canonical `.hforge/library/skills/lua-engineering/` surface rather than this wrapper.
