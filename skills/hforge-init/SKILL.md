---
name: hforge-init
description: initialize harness forge in the current repository, bootstrap the target-aware runtime, and establish the managed surfaces needed for later review, analysis, and decision tracking. use when the repo is not initialized, when runtime files are missing, or when the user asks to set up hforge in a project.
---

# HForge Init

## Trigger Signals

- the repository is not yet initialized for Harness Forge
- `.hforge/agent-manifest.json` or `.hforge/runtime/index.json` is missing
- target runtime files such as `.codex/` or `.claude/` are missing or incomplete
- the user asks to initialize, bootstrap, or wire Harness Forge into a repo

## Inspect First

- repository root files such as `README.md`, `package.json`, and CI or target config files
- `AGENTS.md` and `.agents/skills/` when present
- `.hforge/agent-manifest.json` and `.hforge/runtime/index.json` when present
- `.codex/` and `.claude/` bridge surfaces when present

## Workflow

1. inspect the current workspace state with `hforge status --root . --json`
2. if the repo is not initialized or target runtime files are absent, run `hforge bootstrap --root . --yes`
3. run `hforge refresh --root . --json` after bootstrap so shared runtime summaries are current
4. inspect `hforge catalog --json` when bundle or profile visibility matters
5. summarize detected targets, installed surfaces, runtime artifacts, and the recommended next command

## Output Contract

- initialization status and whether bootstrap was needed
- detected targets and managed runtime surfaces now present
- runtime artifacts now available under `.hforge/runtime/`
- the best next command to run, such as `/hforge-analyze` or `/hforge-review`

## Validation Path

- `hforge status --root . --json`
- `hforge bootstrap --root . --yes`
- `hforge refresh --root . --json`

## Failure Modes

- the repo is not writable
- the `hforge` launcher is not available
- target detection is incomplete or no supported target is installed yet

## Escalation

- escalate when bootstrap cannot write the project-owned runtime
- escalate when targets are ambiguous and the repo needs explicit operator intent
- escalate when package installation or shell setup is missing

## References

- `skills/hforge-init/references/bootstrap-order.md`
- `skills/hforge-init/references/output-contract.md`
