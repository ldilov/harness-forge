# JavaScript Ecosystem Guide

## Default Assumptions
- Check whether the repo is CommonJS, ESM, or mixed before editing imports.
- Identify runtime target: Node, browser, Electron, edge runtime, or hybrid.
- Prefer small framework-aligned changes rather than introducing custom abstractions.

## Package Signals
- `package.json`: scripts, engines, type field, exports, workspaces
- lockfile: npm, pnpm, yarn
- bundler/runtime config: webpack, rollup, vite, esbuild, tsup

## Design Rules
- Keep side effects out of reusable modules.
- Be explicit about environment assumptions.
- Avoid hidden singleton state unless the project already embraces it.
