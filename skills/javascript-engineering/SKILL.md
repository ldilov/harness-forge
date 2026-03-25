---
name: javascript-engineering
description: JavaScript engineering guidance for Node.js, browser apps, CLIs, and tooling, backed by imported agentic reference material.
origin: Harness Forge
---

# JavaScript Engineering

Use this skill when the repo is JavaScript-first, when `.js`, `.jsx`, `.cjs`,
or `.mjs` files dominate the task, or when the work touches Node.js services,
browser applications, packages, or CLIs without a TypeScript-first code path.

## Activation

- JavaScript files or package-runtime behavior dominate the task
- the work touches Node.js services, CLIs, browser code, or package maintenance
- TypeScript guidance is too type-system-centric for the change at hand

## Load Order

- `rules/common/`
- `skills/javascript-engineering/references/`
- `knowledge-bases/seeded/typescript/docs/frameworks.md` when the repo shares the broader Node or React ecosystem

## Execution Contract

1. map entrypoints, package manager, module system, tests, and side-effect boundaries
2. identify whether the repo is ESM, CommonJS, browser-first, or mixed-runtime
3. choose the smallest correct change that matches local conventions
4. verify runtime, package, and test implications before finalizing the patch

## Outputs

- touched-file plan
- implementation or debugging summary
- validation path with runtime-specific confirmation steps

## Validation

- run the repo's JavaScript test, lint, or smoke path when available
- confirm module-system and package-manager assumptions explicitly
- use the reference pack when the task depends on ecosystem, debugging, or runtime behavior heuristics

## Escalation

- escalate when the repo mixes incompatible runtime assumptions across browser, Node.js, or bundler layers
- escalate when package-manager, module-system, or deployment constraints are unclear

## Supplemental Engineering References

- `skills/javascript-engineering/references/repo-exploration.md`
- `skills/javascript-engineering/references/output-templates.md`
- `skills/javascript-engineering/references/agent-patterns.md`
- `skills/javascript-engineering/references/debugging-playbook.md`
- `skills/javascript-engineering/references/ecosystem-guide.md`
- `skills/javascript-engineering/references/node-service-patterns.md`
- `skills/javascript-engineering/references/testing-and-debugging.md`
- `skills/javascript-engineering/references/examples.md`
