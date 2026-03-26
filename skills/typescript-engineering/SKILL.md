---
name: typescript-engineering
description: typescript and javascript engineering guidance seeded from the harness forge knowledge base. use when the repo or task is dominated by .ts, .tsx, package.json, tsconfig, node.js services, react, next.js, frontend tooling, or multi-package workspaces where type boundaries matter.
origin: Harness Forge
---

# TypeScript Engineering

Use this skill when the repository is TypeScript-first and the right answer depends on module boundaries, runtime contracts, build graph shape, or strict typing discipline rather than ad hoc code edits.

## Activation

- the task touches `.ts`, `.tsx`, `package.json`, `tsconfig.json`, workspace configuration, or generated type surfaces
- the repo is a Node service, CLI, package, React app, Next.js app, Vite app, or multi-package workspace
- the change depends on public exports, schema validation, code generation, or cross-package contracts

## Load Order

- `rules/common/README.md`
- `rules/common/coding-style.md`
- `rules/common/patterns.md`
- `rules/common/testing.md`
- `rules/common/security.md`
- `rules/typescript/README.md`
- `rules/typescript/coding-style.md`
- `rules/typescript/patterns.md`
- `rules/typescript/testing.md`
- `rules/typescript/security.md`
- `templates/workflows/implement-typescript-change.md`
- `knowledge-bases/seeded/typescript/docs/overview.md`
- `knowledge-bases/seeded/typescript/docs/frameworks.md`
- `knowledge-bases/seeded/typescript/docs/review-checklist.md`
- `knowledge-bases/seeded/typescript/examples/`
- `skills/typescript-engineering/references/`

## Execution Contract

1. map package manager, workspace layout, module system, and tsconfig graph before changing files
2. identify runtime boundaries and pair static types with runtime validation where untrusted data enters the system
3. preserve local export surfaces and semver expectations unless the task explicitly authorizes a contract change
4. prefer narrow, composable types, discriminated unions, and explicit async behavior over clever type gymnastics
5. when the repo is multi-package, keep references, build outputs, and import paths consistent across the workspace
6. validate both TypeScript correctness and runtime or bundler correctness before finalizing

## Outputs

- touched-file plan grouped by package or app boundary
- implementation summary with the exact contract or build seam that changed
- validation path with typecheck, test, lint, and runtime or bundler confirmation
- compatibility note when exports, generated types, or shared contracts changed

## Validation

- use the repo's preferred `typecheck`, `lint`, `test`, `build`, or workspace commands first
- inspect `tsconfig` inheritance, path aliases, project references, and module-system settings before moving files or imports
- confirm that runtime assumptions match compile-time assumptions, especially for ESM, CommonJS, browser, and server boundaries
- add runtime validation or schema assertions when the code crosses an API, event, env-var, or persistence boundary
- consult `knowledge-bases/seeded/typescript/docs/review-checklist.md` before finalizing a patch or design note

## Escalation

- escalate when the repo mixes incompatible ESM, CommonJS, browser, or server assumptions
- escalate when a public package export or shared contract changes without migration guidance
- escalate when generated types, codegen, or workspace build order are unclear

## Supplemental Engineering References

- `skills/typescript-engineering/references/repo-exploration.md`
- `skills/typescript-engineering/references/output-templates.md`
- `skills/typescript-engineering/references/agent-patterns.md`
- `skills/typescript-engineering/references/debugging-playbook.md`
- `skills/typescript-engineering/references/type-system-patterns.md`
- `skills/typescript-engineering/references/tsconfig-and-build.md`
- `skills/typescript-engineering/references/frontend-and-backend-patterns.md`
- `skills/typescript-engineering/references/runtime-validation-and-boundaries.md`
- `skills/typescript-engineering/references/workspace-and-monorepo.md`
- `skills/typescript-engineering/references/examples.md`
