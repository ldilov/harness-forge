---
name: repo-onboarding
description: Repository discovery, entrypoint mapping, and fast onboarding for unfamiliar codebases.
---

# Repository Onboarding

## Trigger Signals

- the repository is unfamiliar, mixed, legacy, or monorepo-shaped
- the next safe step is blocked on understanding layout, ownership, or workflow

## Inspect First

- repo root files such as `README.md`, `package.json`, `pyproject.toml`, `go.mod`, or equivalent
- `AGENTS.md`, `.agents/skills/`, and `.specify/` when present
- top-level `src/`, `apps/`, `packages/`, `services/`, and `tests/` directories

## Workflow

1. identify the repo archetype and dominant implementation surfaces
2. map build, test, deploy, and validation entrypoints
3. call out risks, drift, missing validation, or conflicting conventions
4. recommend the next action and the best Harness Forge surfaces to load

## Output Contract

- repository summary
- key entrypoints and commands
- risks or blockers
- recommended next action

## Failure Modes

- repo layout is too large to inspect safely in one pass
- no reliable build or validation entrypoints can be found

## Escalation

- escalate when ownership or architecture cannot be inferred safely
- escalate when there is no trustworthy validation path for a risky change

## References

- `skills/repo-onboarding/references/output-template.md`
