# Installation

Harness Forge supports two install paths:

- published package: run `npx @harness-forge/cli bootstrap --root . --yes` in the repository you want to equip, with no manual local build step
- source checkout: run `npm install && npm run build`, then use `node dist/cli/index.js install` or `node dist/cli/index.js bootstrap`

Git-sourced npm and `npx` installs are also supported through the package
`prepare` lifecycle, which builds the CLI automatically during installation.
