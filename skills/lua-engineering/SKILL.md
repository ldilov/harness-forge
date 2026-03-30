---
name: lua-engineering
description: lua engineering guidance seeded from the harness forge knowledge base. use when the repo or task is dominated by .lua files, neovim plugins, openresty, love2d, embedded scripting, luajit, or host-specific lua automation where runtime compatibility matters.
origin: Harness Forge
---

# Lua Engineering

Use this skill when the repository is Lua-first and the safest next move depends on runtime flavor, host APIs, coroutine behavior, editor or game integration, or disciplined module boundaries.

## Activation

- the task touches `.lua` files, host-specific Lua config, Neovim plugins, OpenResty services, Love2D gameplay code, or embedded automation
- the runtime may vary across Lua 5.x, LuaJIT, or a host-specific flavor such as Luau or editor-embedded Lua
- the change depends on module contracts, async or coroutine behavior, or host lifecycle hooks

## Load Order

- `rules/common/README.md`
- `rules/common/coding-style.md`
- `rules/common/patterns.md`
- `rules/common/testing.md`
- `rules/common/security.md`
- `rules/lua/README.md`
- `rules/lua/coding-style.md`
- `rules/lua/patterns.md`
- `rules/lua/testing.md`
- `rules/lua/security.md`
- `templates/workflows/implement-lua-change.md`
- `knowledge-bases/seeded/lua/docs/overview.md`
- `knowledge-bases/seeded/lua/docs/frameworks.md`
- `knowledge-bases/seeded/lua/docs/examples-guide.md`
- the closest matching file in `knowledge-bases/seeded/lua/examples/`
- `knowledge-bases/seeded/lua/docs/review-checklist.md`
- `skills/lua-engineering/references/`

## Execution Contract

1. identify the active runtime and host before changing code: pure Lua, LuaJIT, Neovim, OpenResty, Love2D, or embedded automation
2. preserve local module conventions and avoid accidental global state
3. prefer small table-based modules, explicit contracts, and readable control flow over metatable-heavy cleverness unless the repo already relies on it
4. treat coroutine, event-loop, and host-lifecycle behavior as first-class design constraints
5. validate with the host's actual entrypoint, tests, formatting, or language-server checks before finalizing

## Outputs

- touched-file plan grouped by module or host surface
- implementation or debugging summary with the exact runtime assumption that changed
- validation path with formatter, tests, host smoke steps, or editor checks
- compatibility note when the runtime flavor or host API assumptions changed

## Validation

- use the repo's preferred test and formatting path first
- confirm the target runtime version and host before using syntax or standard-library APIs
- use LuaLS diagnostics and annotations when the repo already depends on them
- add or update Busted tests when the code is pure enough to isolate from the host
- consult `knowledge-bases/seeded/lua/docs/review-checklist.md` before finalizing a patch or design note

## Escalation

- escalate when the repo mixes Lua versions or host APIs with incompatible assumptions
- escalate when performance-sensitive LuaJIT or FFI behavior is changed without evidence
- escalate when host lifecycle, coroutine scheduling, or plugin loading order are unclear

## Supplemental Engineering References

- `skills/lua-engineering/references/repo-exploration.md`
- `skills/lua-engineering/references/output-templates.md`
- `skills/lua-engineering/references/agent-patterns.md`
- `skills/lua-engineering/references/debugging-playbook.md`
- `skills/lua-engineering/references/language-idioms.md`
- `skills/lua-engineering/references/runtime-profiles.md`
- `skills/lua-engineering/references/neovim-and-editor-patterns.md`
- `skills/lua-engineering/references/openresty-patterns.md`
- `skills/lua-engineering/references/game-and-addon-patterns.md`
- `skills/lua-engineering/references/debugging-and-testing.md`
- `skills/lua-engineering/references/tooling-and-quality.md`
- `skills/lua-engineering/references/examples.md`
