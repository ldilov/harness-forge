# Commands

Harness Forge exposes install, catalog, repo-intelligence, flow, and
maintenance commands through the `hforge` CLI.

## Interactive front door

- `hforge` with no arguments opens guided onboarding in an interactive
  terminal when the repo does not yet contain `.hforge/`
- `hforge` with no arguments opens the project hub when the repo already has a
  Harness Forge runtime
- `hforge init --interactive` forces the guided onboarding flow
- `hforge init --root <repo> --agent codex --setup-profile recommended --yes`
  is the direct non-interactive equivalent
- `hforge init --root <repo> --agent codex --dry-run` previews the same setup
  plan without writing files

## Core command groups

- `install` for initial target bootstrap
- `init` for deterministic first-run runtime initialization
- `bootstrap` for autodiscovery-driven installation into the current repo
- `status` for current workspace state
- `refresh` for shared runtime regeneration after install or maintenance work
- `task` for task-runtime inspection
- `pack` for task-pack inspection
- `review` for runtime and decision-health summaries
- `export` for operator-facing runtime handoff bundles
- `commands` for the agent-visible CLI and npm command catalog
- `catalog` for bundles, targets, profiles, and recommendations
- `recommend` for repo-intelligence and evidence-backed setup guidance
- `scan`, `cartograph`, `classify-boundaries`, and `synthesize-instructions`
  for self-service repo analysis and target-aware instruction planning
- `target inspect`, `target list`, and `capabilities` for Codex, Claude Code,
  Cursor, and OpenCode support inspection
- `template validate` and `template suggest` for template and workflow flows
- `flow status` for recoverable Speckit state
- `recursive plan`, `recursive inspect`, `recursive adr`, `recursive resume`,
  `recursive finalize`, `recursive compact`, and `recursive repl` for optional
  recursive-runtime operation on difficult work
- `observability summarize` and `observability report` for local metrics and
  effectiveness review
- `parallel plan`, `parallel status`, and `parallel merge-check` for shard
  planning and merge safety
- `doctor`, `audit`, `sync`, `diff-install`, `upgrade-surface`, and `prune`
  for lifecycle diagnostics
- `backup`, `repair`, `restore`, `upgrade`, `migrate`, and `uninstall` for the
  broader maintenance surface

## Common examples

```bash
npx @harness-forge/cli
npx @harness-forge/cli init --root . --agent codex --setup-profile recommended --yes
npx @harness-forge/cli init --root . --agent codex --dry-run
npx @harness-forge/cli bootstrap --root . --yes
node dist/cli/index.js init --root . --json
node dist/cli/index.js bootstrap --root . --yes
node dist/cli/index.js refresh --root . --json
node dist/cli/index.js task list --root . --json
node dist/cli/index.js task inspect TASK-001 --root . --json
node dist/cli/index.js pack inspect TASK-001 --root . --json
node dist/cli/index.js review --root . --json
node dist/cli/index.js export --root . --json
node dist/cli/index.js commands --json
node dist/cli/index.js catalog --json
node dist/cli/index.js recommend tests/fixtures/benchmarks/typescript-web-app --json
node dist/cli/index.js scan . --json
node dist/cli/index.js cartograph . --json
node dist/cli/index.js classify-boundaries . --json
node dist/cli/index.js synthesize-instructions . --target codex --json
node dist/cli/index.js target inspect codex --json
node dist/cli/index.js capabilities --target claude-code --json
node dist/cli/index.js template validate --json
node dist/cli/index.js template suggest bugfix
node dist/cli/index.js flow status --json
node dist/cli/index.js recursive plan "investigate billing retry behavior" --task-id TASK-001 --json
node dist/cli/index.js recursive inspect RS-123 --json
node dist/cli/index.js observability summarize --json
node dist/cli/index.js observability report . --json
node dist/cli/index.js parallel plan specs/005-enhanced-skills-embedding/tasks.md --json
node dist/cli/index.js parallel status --json
node dist/cli/index.js parallel merge-check --json
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
npm run smoke:cli
npm run bootstrap:current
npm run recommend:current
npm run cartograph:current
npm run instructions:codex
npm run target:codex
npm run target:claude-code
npm run target:opencode
npm run validate:release
npm run validate:local
npm run validate:compatibility
npm run validate:skill-depth
npm run validate:framework-coverage
npm run validate:doc-command-alignment
npm run validate:runtime-consistency
npm run observability:summary
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

## Useful self-service workflows

### Understand a repo before installing

```bash
hforge recommend . --json
hforge cartograph . --json
hforge classify-boundaries . --json
```

### Generate target-aware guidance for your runtime

```bash
hforge target inspect codex --json
hforge target inspect claude-code --json
hforge target inspect opencode --json
hforge synthesize-instructions . --target codex --write --json
```

### Review local effectiveness and parallel readiness

```bash
hforge observability summarize --json
hforge observability report . --json
hforge parallel plan specs/005-enhanced-skills-embedding/tasks.md --json
hforge parallel status --json
hforge parallel merge-check --json
```

### Escalate difficult work into a recursive runtime session

```bash
hforge recursive plan "investigate billing retry behavior across the route and service" --task-id TASK-001 --json
hforge recursive inspect RS-123 --json
hforge recursive compact RS-123 --json
hforge recursive finalize RS-123 --json
```

The `recursive plan` entrypoint writes a durable draft session under
`.hforge/runtime/recursive/sessions/`, reports the session id, the active
budget policy, the seeded handles, and the current promotion state, and leaves
ordinary non-recursive task/runtime flows untouched.

### Inspect the hidden runtime after initialization

```bash
hforge
hforge status --root . --json
hforge refresh --root . --json
hforge task list --root . --json
hforge review --root . --json
hforge export --root . --json
```

When the repo already contains `.hforge/`, the no-argument `hforge` entrypoint
acts like a lightweight project hub and routes to these common workflows.
