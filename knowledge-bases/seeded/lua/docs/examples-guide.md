# Lua examples guide

These examples are task playbooks, not toy snippets. Use the nearest one as the default plan scaffold.

## How to use an example

1. Select the closest scenario.
2. Copy its touched-file thinking and validation shape.
3. Adjust for the repo's framework and deployment assumptions.
4. Keep the example's anti-pattern checks in your final review.

## Available scenarios

### Neovim plugin

- file: `01-neovim-plugin.md`
- use when: Module layout, user commands, autocmds, async/job boundaries, and non-invasive editor behavior.
- always confirm: contracts, validation, tests, and operational impact

### OpenResty request handler

- file: `02-openresty-request-handler.md`
- use when: ngx lifecycle, request/response rules, shared dict limits, and safe upstream access.
- always confirm: contracts, validation, tests, and operational impact

### LÖVE gameplay module

- file: `03-love-gameplay-module.md`
- use when: State update/draw separation, deterministic simulation, asset boundaries, and debug instrumentation.
- always confirm: contracts, validation, tests, and operational impact

### Embedded automation script

- file: `04-embedded-automation-script.md`
- use when: Sandbox assumptions, shell/process boundaries, and robust nil/error handling.
- always confirm: contracts, validation, tests, and operational impact
