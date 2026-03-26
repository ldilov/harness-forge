# Repo Exploration

## Inspect these files first

- top-level Lua entrypoints and module layout
- host config for Neovim, OpenResty, game loops, or embedded runtimes
- test config, formatter config, and language-server settings
- any FFI bindings, C modules, or native build steps
- README or docs that describe runtime version and startup order

## Classify the runtime shape

- **Pure Lua library**: module boundaries and table contracts matter most
- **Neovim plugin**: editor lifecycle, autocmds, user commands, and LSP integration matter
- **OpenResty**: request phases, worker lifecycle, and nonblocking behavior matter
- **Love2D or game code**: frame loop, input, and asset lifecycle matter
- **Embedded automation**: host callbacks, sandboxing, and IO limits matter

## High-signal risk surfaces

- accidental globals and mutable shared tables
- coroutine scheduling across host callbacks
- runtime-version-specific syntax or library use
- metatable behavior that changes public contracts implicitly
- FFI or native-boundary code paths
