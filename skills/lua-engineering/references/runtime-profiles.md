# Runtime Profiles

## Lua 5.x and LuaJIT

Check the exact runtime before using standard-library behavior, integer semantics, or performance assumptions. LuaLS supports multiple Lua versions and LuaJIT, which makes it useful for catching version drift in mixed environments.

## Host-specific rules

- **Neovim**: editor APIs, runtimepath, and lazy loading shape module boundaries
- **OpenResty**: request phases and nonblocking IO rules matter more than generic Lua advice
- **Love2D**: frame lifecycle and asset handling define safe state boundaries
- **Embedded hosts**: sandboxing and API availability may be narrower than stock Lua
