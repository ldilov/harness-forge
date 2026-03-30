# Lua framework and ecosystem guide

Use this file to choose the right pattern before changing code. Do not read it as generic background material; treat it as a decision guide.

## Core Lua

Prefer locals, explicit tables, and small modules. Lua 5.4 adds to-be-closed variables and keeps metatables/coroutines as power tools rather than defaults.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## Neovim

Keep plugin entrypoints small and isolate editor APIs behind narrow wrappers so logic stays testable.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## OpenResty

Never block the event loop with OS-level or synchronous assumptions. Treat request phase rules as hard constraints.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## LÖVE

Separate simulation, rendering, and input mapping. Keep mutable game state explicit and easy to reset for tests/debug sessions.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## Source index

- Lua 5.4 reference manual: https://www.lua.org/manual/5.4/
- Lua manuals index: https://www.lua.org/manual/
- LÖVE wiki: https://love2d.org/wiki/Main_Page
- Neovim docs: https://neovim.io/doc/
- OpenResty docs: https://openresty.org/en/
