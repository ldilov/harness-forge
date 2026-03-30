# TypeScript implementation overview

## Why this pack exists

This file is meant to be execution guidance, not a placeholder catalog entry. An agent should load it when TypeScript is the dominant language and use it to choose the correct example, framework notes, and review checklist before editing code.

## Current posture

Default modern TS guidance in this pack assumes strict mode, explicit runtime validation, narrow public exports, and repo-aware tsconfig graphs. TypeScript 5.9 uses a slimmer `tsc --init` and adds a stable `--module node20` option, which is useful when you want predictable Node 20 semantics instead of the floating `nodenext` model.

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
- `01-node-api.md` — **Node API with runtime validation**. Node services, Hono/Express/Fastify handlers, env validation, and schema-first boundaries.
- `02-react-component-library.md` — **React component library**. Typed component APIs, accessibility, Storybook/test expectations, and packaging boundaries.
- `03-nextjs-app.md` — **Next.js App Router application**. Server/client boundaries, data fetching, route handlers, and cache-aware mutations.
- `04-monorepo-shared-types-and-validation.md` — **Monorepo shared types and validation**. Shared contracts, package exports, tsconfig references, codegen, and semver-aware changes.

## Required final pass

Before finalizing, walk the language review checklist and confirm the change is safe across correctness, boundary validation, testing, operations, and compatibility.
