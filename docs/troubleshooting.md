# Troubleshooting

## Interactive CLI issues

- if `hforge` is run without arguments in CI or another non-TTY environment,
  the CLI will not prompt; rerun with explicit flags such as
  `hforge init --root <repo> --agent codex --yes` or `--dry-run`
- if the no-argument CLI opens onboarding when you expected the project hub,
  verify that `.hforge/runtime/index.json` exists in the repo root
- if the onboarding flow is interrupted before confirmation, no writes should
  occur; if a write was partially applied later in the flow, use `doctor`,
  `audit`, or `refresh` to inspect the runtime state
- if path selection or target selection looks wrong, rerun the setup and
  override the recommended defaults explicitly

## Node runtime issues

- confirm Node.js 22+ is available on the PATH
- if bare `hforge` is not found after setup, run `npx @harness-forge/cli shell status --json`
  or use the workspace-local launcher under `.hforge/generated/bin/`
- rebuild with `npm run build` before using `install.sh` or `install.ps1`
- run `hforge --help` to confirm the built entrypoint still starts cleanly

## Missing seeded language content

- run `npm run validate:seeded-coverage`
- inspect `manifests/catalog/seeded-knowledge-files.json`
- confirm the missing file still exists under `knowledge-bases/seeded/`

## Missing validator bundle files

- run `npm run validate:package-surface`
- confirm `scripts/templates/README.md` and the script/config files are present
- run `npm run release:dry-run` if the problem appears only in publish validation

## Target install surprises

- use `--dry-run` first to preview copy and merge behavior
- inspect `targets/<target>/adapter.json` for path mapping behavior
- confirm the target supports the capability you are installing

## Init or runtime drift

- run `hforge init --root <repo> --json` to re-establish the base runtime files
- run `hforge refresh --root <repo>` after install changes to rewrite shared runtime summaries
- run `hforge doctor --root <repo>` to see missing managed paths and stale task artifacts
- run `hforge audit --root <repo>` for a fuller package and runtime report

## Command-surface mismatches

- run `npm run validate:doc-command-alignment`
- compare `docs/commands.md` with `hforge commands --json`
- confirm the built CLI in `dist/cli/index.js` is current
