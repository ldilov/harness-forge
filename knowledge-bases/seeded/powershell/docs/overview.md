# PowerShell implementation overview

## Why this pack exists

This file is meant to be execution guidance, not a placeholder catalog entry. An agent should load it when PowerShell is the dominant language and use it to choose the correct example, framework notes, and review checklist before editing code.

## Current posture

PowerShell 7.5 runs side-by-side with Windows PowerShell 5.1, which matters for compatibility-sensitive module work. The pack assumes advanced functions, strict mode, and object-first output rather than string-only scripting.

## Default operating model

1. Map entrypoints, package or module boundaries, and deployment/runtime assumptions first.
2. Identify trust boundaries: HTTP, CLI, config, files, queues, database rows, environment variables, editor APIs, or host callbacks.
3. Pick the closest matching example scenario from `examples/`.
4. Apply the language rule set plus the common security/testing rules.
5. Verify through the repo's real build and runtime path, not only static analysis.

## What good changes look like

- contracts are explicit
- runtime validation exists where static analysis cannot protect you
- tests cover the changed seam
- logs and errors help operators debug safely
- public behavior changes are called out

## What weak changes look like

- broad refactors with no contract explanation
- framework glue and domain logic mixed together
- hidden global or process-wide state
- missing validation at the boundary
- no mention of rollback, migration, or compatibility

## Scenario routing
- `01-idempotent-admin-script.md` — **Idempotent admin script**. Parameter validation, ShouldProcess, secure remoting, and repeatable environment changes.
- `02-module-command-surface.md` — **Module command surface**. Public/private function split, help metadata, module manifest, and output contract stability.
- `03-pipeline-aware-data-tool.md` — **Pipeline-aware data tool**. Advanced functions, Begin/Process/End blocks, error records, and object-first output.
- `04-ci-automation-script.md` — **CI automation script**. Exit codes, strict mode, secret handling, and deterministic logs for build agents.

## Required final pass

Before finalizing, walk the language review checklist and confirm the change is safe across correctness, boundary validation, testing, operations, and compatibility.
