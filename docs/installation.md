# Installation

Harness Forge supports two install paths:

- published package: run `npx @harness-forge/cli bootstrap --root . --yes` in the repository you want to equip, with no manual local build step
- source checkout: run `npm install && npm run build`, then use `node dist/cli/index.js install` or `node dist/cli/index.js bootstrap`

Git-sourced npm and `npx` installs are also supported through the package
`prepare` lifecycle, which builds the CLI automatically during installation.

Every successful install also writes a shared runtime summary under
`.hforge/runtime/` and materializes the canonical hidden AI layer under
`.hforge/library/` and `.hforge/templates/`:

- `.hforge/library/skills/` holds the installed canonical skill library
- `.hforge/library/rules/` holds the installed canonical rules
- `.hforge/library/knowledge/` holds the installed knowledge packs
- `.hforge/templates/` holds the installed canonical task and workflow templates

- `.hforge/runtime/index.json` records the durable runtime surfaces and bridge
  paths selected for the workspace, including every installed target
- `.hforge/runtime/README.md` explains how root instructions, target runtime
  files, and portable docs route back to that shared runtime
- `.hforge/runtime/repo/repo-map.json` records the baseline repo map hydrated
  during bootstrap
- `.hforge/runtime/repo/instruction-plan.json` records target-aware bridge
  planning for installed runtimes
- `.hforge/runtime/findings/risk-signals.json` records baseline runtime risk
  signals discovered during bootstrap
