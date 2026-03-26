# Neovim And Editor Patterns

## Plugin structure

- separate user-facing setup from core logic
- keep autocmds, keymaps, and commands near startup wiring
- isolate editor API calls so pure logic can be tested or reasoned about separately

## LSP and tooling

The modern Neovim LSP path prefers `vim.lsp.config` and `vim.lsp.enable` on newer Neovim versions. Legacy `require('lspconfig')` setup is deprecated in the upstream config project.

## Debugging tips

- use `:checkhealth` for environment issues
- verify runtimepath and lazy-loading assumptions
- check whether a plugin manager changed load order or optional dependency timing
