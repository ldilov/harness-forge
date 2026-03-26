---
name: repo-onboarding
description: repository discovery, entrypoint mapping, and fast onboarding for unfamiliar codebases. use when the repo is new, mixed, legacy, monorepo-shaped, poorly documented, or when the next safe step is blocked on understanding layout, ownership, and commands.
---

# Repository Onboarding

## Trigger Signals

- the repository is unfamiliar, mixed, legacy, or monorepo-shaped
- the next safe step is blocked on understanding layout, ownership, or workflow
- docs are sparse, stale, or scattered across many entrypoints

## Inspect First

- repo root files such as `README.md`, top-level manifests, CI config, container config, and deployment hints
- `AGENTS.md`, `.agents/skills/`, `.specify/`, or other repo-native guidance surfaces when present
- top-level source, app, package, service, infra, and test directories
- `CODEOWNERS`, contribution docs, issue or PR templates, and other health signals when present

## Workflow

1. identify the repo archetype and dominant implementation surfaces
2. map build, test, run, deploy, and validation entrypoints
3. infer ownership, boundaries, and high-risk hotspots from structure and metadata
4. call out drift, missing validation, generated code, or conflicting conventions
5. recommend the next best action and the best repo surfaces to load before changing code

## Output Contract

- repository summary with dominant languages, runtimes, and repo shape
- key commands and entrypoints for build, test, run, and release
- hotspots, blockers, and missing information that affect safe changes
- recommended next action with the specific files or dirs to inspect next

## Failure Modes

- repo layout is too large to inspect safely in one pass
- generated or vendored code hides the real ownership boundaries
- no reliable build or validation entrypoints can be found

## Escalation

- escalate when ownership or architecture cannot be inferred safely
- escalate when there is no trustworthy validation path for a risky change
- escalate when docs and code disagree about the active workflow

## References

- `skills/repo-onboarding/references/output-template.md`
- `skills/repo-onboarding/references/discovery-checklist.md`
- `skills/repo-onboarding/references/repo-archetypes.md`
- `skills/repo-onboarding/references/ownership-and-health-signals.md`
- `skills/repo-onboarding/references/command-discovery.md`
- `skills/repo-onboarding/references/monorepo-signals.md`
- `skills/repo-onboarding/references/examples.md`
