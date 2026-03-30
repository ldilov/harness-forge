# Lua implementation overview

## Why this pack exists

This file is meant to be execution guidance, not a placeholder catalog entry. An agent should load it when Lua is the dominant language and use it to choose the correct example, framework notes, and review checklist before editing code.

## Current posture

Lua’s reference manual remains the canonical language definition. The pack assumes disciplined use of locals, explicit module returns, protected calls around unsafe host boundaries, and narrow metatable usage.

## Default operating model

1. Map entrypoints, package or module boundaries, and deployment/runtime assumptions first.
2. Identify trust boundaries: HTTP, CLI, config, files, queues, database rows, environment variables, editor APIs, or host callbacks.
3. Pick the closest matching example scenario from `examples/`.
4. Apply the language rule set plus the common security/testing rules.
5. Verify through the repo's real build and runtime path, not only static analysis.

## What good changes look like

- contracts are explicit
- runtime validation exists where static analysis cannot protect you
- tests cover the changed seam
- logs and errors help operators debug safely
- public behavior changes are called out

## What weak changes look like

- broad refactors with no contract explanation
- framework glue and domain logic mixed together
- hidden global or process-wide state
- missing validation at the boundary
- no mention of rollback, migration, or compatibility

## Scenario routing
- `01-neovim-plugin.md` — **Neovim plugin**. Module layout, user commands, autocmds, async/job boundaries, and non-invasive editor behavior.
- `02-openresty-request-handler.md` — **OpenResty request handler**. ngx lifecycle, request/response rules, shared dict limits, and safe upstream access.
- `03-love-gameplay-module.md` — **LÖVE gameplay module**. State update/draw separation, deterministic simulation, asset boundaries, and debug instrumentation.
- `04-embedded-automation-script.md` — **Embedded automation script**. Sandbox assumptions, shell/process boundaries, and robust nil/error handling.

## Required final pass

Before finalizing, walk the language review checklist and confirm the change is safe across correctness, boundary validation, testing, operations, and compatibility.
