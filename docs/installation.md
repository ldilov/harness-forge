# Installation

## Front-door setup styles

Harness Forge supports both a guided interactive front door and a direct
flag-driven install path:

- `npx @harness-forge/cli` opens first-run onboarding in an interactive
  terminal or a project hub when `.hforge/` already exists
- `hforge init --root <repo> --agent codex --yes` performs the same setup
  through explicit flags without prompts
- `hforge init --root <repo> --agent codex --dry-run` previews the planned
  writes without changing the repo

Use the interactive flow when you want help choosing folder, targets,
quick/recommended/advanced setup depth, and optional modules. Use the direct
path for CI, automation, or expert usage.

## Local launcher paths

Setup writes reusable workspace-local launchers under `.hforge/generated/bin/`
so you can keep using Harness Forge after the initial `npx` run:

- `.hforge/generated/bin/hforge.cmd` for Windows Command Prompt
- `.hforge/generated/bin/hforge.ps1` for PowerShell
- `.hforge/generated/bin/hforge` for POSIX shells

Those launchers call the published package through `npx @harness-forge/cli`.
You only need a global install if you specifically want plain `hforge`
available everywhere on your machine.

Harness Forge supports two install paths:

- published package: run `npx @harness-forge/cli bootstrap --root . --yes` in the repository you want to equip, with no manual local build step
- source checkout: run `npm install && npm run build`, then use `node dist/cli/index.js install` or `node dist/cli/index.js bootstrap`

Git-sourced npm and `npx` installs are also supported through the package
`prepare` lifecycle, which builds the CLI automatically during installation.

For a deterministic first-run workspace setup before target installation, use:

```bash
npx @harness-forge/cli init --root /path/to/your/workspace --json
```

After install changes, use:

```bash
hforge refresh --root /path/to/your/workspace --json
hforge update --root /path/to/your/workspace --dry-run --yes
hforge update --root /path/to/your/workspace --yes
```

The non-destructive updater downloads the requested published Harness Forge
version or dist-tag, reapplies managed surfaces, writes an install-state backup
under `.hforge/state/`, and preserves gathered runtime state such as task
artifacts, decision records, recursive sessions, and observability outputs.

Every successful install also writes a shared runtime summary under
`.hforge/runtime/` and materializes the canonical hidden AI layer under
`.hforge/library/` and `.hforge/templates/`:

- `.hforge/agent-manifest.json` gives custom agents one machine-readable map of
  bridge files, canonical roots, launchers, and safe command discovery
- `.hforge/library/skills/` holds the installed canonical skill library
- `.hforge/library/rules/` holds the installed canonical rules
- `.hforge/library/knowledge/` holds the installed knowledge packs
- `.hforge/templates/` holds the installed canonical task and workflow templates

- `.hforge/runtime/index.json` records the durable runtime surfaces and bridge
  paths selected for the workspace, including every installed target
- `.hforge/agent-manifest.json` is the stable custom-agent contract that points
  agents at `AGENTS.md`, `.hforge/runtime/index.json`, and
  `.hforge/generated/agent-command-catalog.json`
- `.hforge/runtime/README.md` explains how root instructions, target runtime
  files, and portable docs route back to that shared runtime
- `.hforge/runtime/repo/repo-map.json` records the baseline repo map hydrated
  during bootstrap
- `.hforge/runtime/repo/instruction-plan.json` records target-aware bridge
  planning for installed runtimes
- `.hforge/runtime/findings/risk-signals.json` records baseline runtime risk
  signals discovered during bootstrap
- `.hforge/runtime/recursive/sessions/RS-XXX/session.json` appears only when an
  operator explicitly escalates hard work into recursive mode and records the
  durable draft session, budget, handles, and promotion state
- `.hforge/runtime/recursive/language-capabilities.json` records the canonical
  recursive structured-analysis capability truth for the workspace

## Shell integration vs global install

If you want bare `hforge` to work after project setup, prefer:

```bash
npx @harness-forge/cli shell setup --yes
```

That writes a user-level shim and updates a supported shell profile so the
command is available without forcing a machine-wide npm mutation from inside a
project bootstrap.

Global install is still optional:

```bash
npm install -g @harness-forge/cli
```

Use that only if you explicitly want npm-managed machine-wide availability.
