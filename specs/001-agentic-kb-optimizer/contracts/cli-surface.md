# Contract: CLI Surface

## Purpose

Define the user-facing command contract for the Harness Forge CLI.

## Core commands

- `hforge init`
- `hforge install`
- `hforge add`
- `hforge remove`
- `hforge list`
- `hforge plan`
- `hforge diff`
- `hforge status`
- `hforge doctor`
- `hforge validate`
- `hforge repair`
- `hforge backup`
- `hforge restore`
- `hforge uninstall`
- `hforge upgrade`
- `hforge catalog`
- `hforge template list`
- `hforge template show <id>`
- `hforge template validate`
- `hforge workflow show <id>`
- `hforge workflow validate <id>`
- `hforge workflow graph <id>`

## Required selectors

- `--target`
- `--profile`
- `--lang`
- `--framework`
- `--with`
- `--root`
- `--yes`
- `--dry-run`
- `--json`
- `--force`
- `--backup-dir`
- `--no-backup`
- `--from-state`

## Output guarantees

- Every mutating command must support a preview path through `--dry-run` or an
  equivalent non-destructive mode.
- Machine-readable output must be available through `--json`.
- Validation and apply commands must return non-zero exit codes on failure.
- Target compatibility warnings must be explicit and actionable.

## Failure contract

- Unknown targets, profiles, packs, templates, or workflows must fail with clear
  suggestions rather than silent fallback.
- Destructive operations must not proceed without explicit confirmation or
  automation-safe override.
- When a validator fails, the CLI must identify the failing artifact and the
  reason.
