---
name: javascript-engineering
description: javascript engineering guidance for node.js, browser apps, clis, and packages. use when .js, .jsx, .mjs, .cjs, bundler config, or package contract behavior dominate the task and a typescript-first pack would be too type-system-centric.
origin: Harness Forge
---

# JavaScript Engineering

Use this skill when the repository is JavaScript-first or the task depends more on runtime behavior, packaging, module format, or toolchain quirks than on a TypeScript type system.

## Activation

- JavaScript files, Node runtime behavior, browser bundling, or package publishing dominate the task
- the repo uses `.js`, `.jsx`, `.mjs`, `.cjs`, or mixed module formats
- package `exports`, `imports`, CLI behavior, or browser and server boundaries are central to the change

## Load Order

- `rules/common/README.md`
- `rules/common/coding-style.md`
- `rules/common/patterns.md`
- `rules/common/testing.md`
- `rules/common/security.md`
- `skills/javascript-engineering/references/`
- `knowledge-bases/seeded/typescript/docs/frameworks.md` when the repository shares the wider Node, React, or Vite ecosystem

## Execution Contract

1. map entrypoints, scripts, package manager, module system, and bundler behavior before editing code
2. identify whether the edited code runs in Node, the browser, SSR, workers, or multiple runtimes
3. preserve public package contracts unless the task explicitly authorizes a breaking change
4. prefer plain, explicit JavaScript and JSDoc-backed contracts over hidden conventions
5. validate the actual runtime path and packaging behavior, not just lint output

## Outputs

- touched-file plan grouped by package or runtime boundary
- implementation or debugging summary with the exact module or packaging seam that changed
- validation path with lint, test, smoke, and package-contract checks
- compatibility note when `exports`, entrypoints, or environment assumptions changed

## Validation

- run the repo's preferred test, lint, and smoke commands first
- confirm Node version, package manager, and lockfile assumptions before touching dependencies or module format
- inspect `package.json` `type`, `main`, `module`, `exports`, and `imports` when resolution is part of the bug
- verify browser, SSR, and Node boundaries explicitly when code is shared across environments

## Escalation

- escalate when the repo mixes incompatible ESM, CommonJS, bundler, or runtime assumptions
- escalate when changing `exports` would break undocumented consumer entrypoints
- escalate when package publishing, CLI behavior, or deployment constraints are unclear

## Supplemental Engineering References

- `skills/javascript-engineering/references/repo-exploration.md`
- `skills/javascript-engineering/references/output-templates.md`
- `skills/javascript-engineering/references/agent-patterns.md`
- `skills/javascript-engineering/references/debugging-playbook.md`
- `skills/javascript-engineering/references/ecosystem-guide.md`
- `skills/javascript-engineering/references/node-service-patterns.md`
- `skills/javascript-engineering/references/browser-and-bundler-patterns.md`
- `skills/javascript-engineering/references/package-contracts.md`
- `skills/javascript-engineering/references/testing-and-debugging.md`
- `skills/javascript-engineering/references/examples.md`
