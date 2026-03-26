# Debugging And Testing

## Testing layers

- pure module tests with Busted where practical
- host smoke tests for plugin, web, or game integration paths
- formatter and language-server checks for consistency and early diagnostics

## Tooling notes

- Busted is the standard lightweight unit-test surface for many Lua projects
- StyLua is a strong deterministic formatter across Lua 5.x, LuaJIT, Luau, and CfxLua ecosystems
- LuaLS provides annotations, diagnostics, and runtime-aware checking that help a lot in mixed host environments
