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
- `shell setup` and `shell status` for optional PATH integration without forcing a global npm install
- `status` for current workspace state
- `refresh` for shared runtime regeneration after install or maintenance work
- `update` and `upgrade` for non-destructive package refresh from the latest published Harness Forge version while preserving gathered runtime state
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
- `recursive plan`, `recursive capabilities`, `recursive execute`,
  `recursive run`, `recursive runs`, `recursive inspect-run`,
  `recursive inspect`, `recursive iterations`, `recursive inspect-iteration`,
  `recursive subcalls`, `recursive inspect-subcall`, `recursive cells`,
  `recursive inspect-cell`, `recursive promotions`,
  `recursive inspect-promotion`, `recursive meta-ops`,
  `recursive inspect-meta-op`, `recursive score`, `recursive scorecards`,
  `recursive replay`, `recursive adr`, `recursive resume`,
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

Use bare `hforge` after `shell setup`, after a global install, or by replacing
it with the workspace-local launcher under `.hforge/generated/bin/`.

For agents inside an installed workspace, the safest execution order is:

1. `.hforge/generated/bin/hforge.cmd` or `.ps1` on Windows, or `./.hforge/generated/bin/hforge` on POSIX
2. bare `hforge`
3. `npx @harness-forge/cli`

## Markdown command entrypoints

Some agent runtimes support markdown-backed command triggers in addition to the
CLI. Harness Forge ships command docs for those environments under `commands/`.

Examples:

- `/hforge-init` to bootstrap or refresh the project-owned Harness Forge runtime
- `/hforge-analyze` to force installed-runtime inspection before coding
- `/hforge-review` to inspect drift, decision coverage, and stale runtime artifacts
- `/hforge-refresh` to regenerate runtime summaries after install or repo changes
- `/hforge-decide` to capture durable ASR or ADR records
- `/hforge-status` to inspect current workspace state before acting
- `/hforge-commands` to inspect the shipped command catalog before inventing commands
- `/hforge-recommend` to run repo-intelligence and recommendation flows
- `/hforge-cartograph` to inspect repo topology, boundaries, and hotspots
- `/hforge-task` to inspect task-runtime folders and task packs
- `/hforge-recursive` to escalate difficult work into recursive structured analysis
- `/hforge-recursive-investigate` to tell an agent to autonomously escalate hard work into a recursive investigation and prefer Typed RLM first
- `/hforge-update` to preview or apply a non-destructive package refresh
- `commands/hforge-init.md`, `commands/hforge-analyze.md`, `commands/hforge-review.md`, `commands/hforge-refresh.md`, `commands/hforge-decide.md`, `commands/hforge-status.md`, `commands/hforge-commands.md`, `commands/hforge-recommend.md`, `commands/hforge-cartograph.md`, `commands/hforge-task.md`, `commands/hforge-recursive.md`, `commands/hforge-recursive-investigate.md`, and `commands/hforge-update.md` as the canonical packaged command surfaces
- `commands/plan.md` and `commands/test.md` for broader planning and validation guidance

Treat these as agent-facing prompt entrypoints, not replacements for the CLI.

```bash
npx @harness-forge/cli
npx @harness-forge/cli shell setup --yes
npx @harness-forge/cli init --root . --agent codex --setup-profile recommended --yes
npx @harness-forge/cli init --root . --agent codex --dry-run
npx @harness-forge/cli bootstrap --root . --yes
hforge shell status --json
hforge init --root . --json
hforge bootstrap --root . --yes
hforge refresh --root . --json
hforge update --root . --dry-run --yes
hforge update --root . --yes
hforge task list --root . --json
hforge task inspect TASK-001 --root . --json
hforge pack inspect TASK-001 --root . --json
hforge review --root . --json
hforge export --root . --json
hforge commands --json
hforge catalog --json
hforge recommend tests/fixtures/benchmarks/typescript-web-app --json
hforge scan . --json
hforge cartograph . --json
hforge classify-boundaries . --json
hforge synthesize-instructions . --target codex --json
hforge target inspect codex --json
hforge capabilities --target claude-code --json
hforge template validate --json
hforge template suggest bugfix
hforge flow status --json
hforge recursive plan "investigate billing retry behavior" --task-id TASK-001 --json
hforge recursive capabilities --root . --json
hforge recursive execute RS-123 --file billing-bundle.json --json
hforge recursive run RS-123 --file analyze-billing.mjs --json
hforge recursive iterations RS-123 --json
hforge recursive inspect-iteration RS-123 ITER-001 --json
hforge recursive subcalls RS-123 --json
hforge recursive cells RS-123 --json
hforge recursive promotions RS-123 --json
hforge recursive meta-ops RS-123 --json
hforge recursive score RS-123 --json
hforge recursive replay RS-123 --json
hforge recursive runs RS-123 --json
hforge recursive inspect-run RS-123 RUN-001 --json
hforge recursive inspect RS-123 --json
hforge observability summarize --json
hforge observability report . --json
hforge parallel plan specs/005-enhanced-skills-embedding/tasks.md --json
hforge parallel status --json
hforge parallel merge-check --json
hforge doctor --json
hforge audit --json
hforge diff-install --json
hforge sync --json
hforge upgrade-surface --json
hforge prune --json
```

The `update` and `upgrade` commands download the requested published package
version or dist-tag, reapply managed surfaces, write an install-state backup
under `.hforge/state/`, and intentionally preserve gathered runtime state such
as task artifacts, decision records, recursive sessions, and observability
signals.

For agent-facing examples and prompt patterns that encourage actual runtime
usage instead of passive installation, see `docs/agent-usage-playbook.md`.

## Maintainer source-checkout examples

When developing Harness Forge itself from a source checkout, the equivalent
repo-local entrypoint remains:

```bash
node dist/cli/index.js --help
node dist/cli/index.js recommend . --json
node dist/cli/index.js cartograph . --json
node dist/cli/index.js target inspect codex --json
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
hforge recursive capabilities --root . --json
hforge recursive execute RS-123 --file billing-bundle.json --json
hforge recursive run RS-123 --file analyze-billing.mjs --json
hforge recursive iterations RS-123 --json
hforge recursive subcalls RS-123 --json
hforge recursive cells RS-123 --json
hforge recursive promotions RS-123 --json
hforge recursive meta-ops RS-123 --json
hforge recursive score RS-123 --json
hforge recursive replay RS-123 --json
hforge recursive runs RS-123 --json
hforge recursive inspect-run RS-123 RUN-001 --json
hforge recursive inspect RS-123 --json
hforge recursive compact RS-123 --json
hforge recursive finalize RS-123 --json
```

If you want an agent runtime such as Codex or Claude Code to decide when to use
the recursive flow on your behalf, use the markdown-backed command entrypoint
`/hforge-recursive-investigate` and give it the task objective. That command is
the packaged hint for "this task is hard enough to justify recursive mode, use
Typed RLM first, and keep the investigation artifact-backed."

The `recursive plan` entrypoint writes a durable draft session under
`.hforge/runtime/recursive/sessions/`, reports the session id, the active
budget policy, the seeded handles, and the current promotion state, and leaves
ordinary non-recursive task/runtime flows untouched.

The promoted recursive structured-analysis path uses
`.hforge/runtime/recursive/language-capabilities.json` as the canonical
workspace capability map and records run artifacts under
`.hforge/runtime/recursive/sessions/<sessionId>/runs/`.

The promoted recursive RLM path keeps the same session substrate but adds
compact root frames, typed action bundles, durable iterations, subcalls,
bounded code cells, proposal artifacts, scorecards, and replayable
trajectories under `.hforge/runtime/recursive/sessions/<sessionId>/`.

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
