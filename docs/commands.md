# Commands

Harness Forge exposes install, catalog, repo-intelligence, flow, and
maintenance commands through the `hforge` CLI.

## Core command groups

- `install` for initial target bootstrap
- `bootstrap` for autodiscovery-driven installation into the current repo
- `status` for current workspace state
- `commands` for the agent-visible CLI and npm command catalog
- `catalog` for bundles, targets, profiles, and recommendations
- `recommend` for repo-intelligence and evidence-backed setup guidance
- `template validate` and `template suggest` for template and workflow flows
- `flow status` for recoverable Speckit state
- `doctor`, `audit`, `sync`, `diff-install`, `upgrade-surface`, and `prune`
  for lifecycle diagnostics
- `backup`, `repair`, `restore`, `upgrade`, `migrate`, and `uninstall` for the
  broader maintenance surface

## Common examples

```bash
npx @harness-forge/cli bootstrap --root . --yes
node dist/cli/index.js bootstrap --root . --yes
node dist/cli/index.js commands --json
node dist/cli/index.js catalog --json
node dist/cli/index.js recommend tests/fixtures/benchmarks/typescript-web-app --json
node dist/cli/index.js template validate --json
node dist/cli/index.js template suggest bugfix
node dist/cli/index.js flow status --json
node dist/cli/index.js doctor --json
node dist/cli/index.js audit --json
node dist/cli/index.js diff-install --json
node dist/cli/index.js sync --json
node dist/cli/index.js upgrade-surface --json
node dist/cli/index.js prune --json
```

## Script-level validation and reporting

The published package supports direct `npx` execution without a manual local
build. Git-sourced installs use npm `prepare` to build automatically during
installation.

```bash
npm run commands:catalog
npm run bootstrap:current
npm run validate:release
npm run validate:compatibility
npm run validate:skill-depth
npm run validate:framework-coverage
npm run validate:doc-command-alignment
npm run validate:runtime-consistency
npm run knowledge:coverage
npm run knowledge:drift
npm run flow:status
npm run observability:report
```

## Operational docs

- `commands/plan.md`
- `commands/test.md`
- `docs/maintenance-lifecycle.md`
- `docs/flow-orchestration.md`
