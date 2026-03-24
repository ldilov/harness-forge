---
id: language-pack-typescript
kind: language-pack
title: TypeScript Language Pack
summary: Seeded TypeScript pack for Node, React, Next.js, libraries, and monorepos.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - typescript
generated: false
maturity: seeded
targets:
  - codex
  - claude-code
  - cursor
  - opencode
---
# TypeScript Language Pack

## Best fit

Use this pack for Node services, React or Next.js frontends, shared libraries,
CLIs, and monorepos with strong contract boundaries.

## What ships

- `knowledge-bases/seeded/typescript/docs/overview.md`
- `knowledge-bases/seeded/typescript/docs/review-checklist.md`
- `knowledge-bases/seeded/typescript/docs/frameworks.md`
- `knowledge-bases/seeded/typescript/examples/`
- `knowledge-bases/seeded/typescript/rules/common/`
- `knowledge-bases/seeded/typescript/rules/typescript/`

## Recommended tooling

- TypeScript
- ESLint
- Prettier
- Vitest
- Playwright
- Zod

## Common pitfalls

- unvalidated external input
- `any` leakage across boundaries
- mixed server and client assumptions
- implicit runtime contracts

## Example scenarios

- Node API
- React component library
- Next.js app
- monorepo shared types and validation
