# Flow Orchestration

Speckit flow state is the re-entry surface for spec-driven delivery. It turns a
folder of artifacts into a recoverable working state with an explicit stage,
last artifact, blockers, and next action.

## Runtime commands

```bash
node scripts/runtime/flow-status.mjs --json
hforge flow status --json
hforge parallel plan specs/<feature>/tasks.md --json
hforge parallel status --json
hforge parallel merge-check --json
```

## Canonical state file

- `.specify/state/flow-state.json`

## Required state fields

- `featureId`
- `currentStage`
- `status`
- `lastArtifact`
- `nextAction`
- `updatedAt`

## Supported stages

| Stage | Meaning | Primary artifacts |
| --- | --- | --- |
| `clarify` | The work is still being framed. | `spec.md`, checklist answers |
| `specify` | The feature has a spec but not yet a technical plan. | `spec.md` |
| `plan` | Design decisions and contracts are being established. | `plan.md`, `research.md`, `contracts/` |
| `tasks` | The execution backlog is being generated or reviewed. | `tasks.md` |
| `implement` | Tasks are actively being completed. | code changes, tests, docs |
| `validate` | Implementation is complete and end-to-end validation is underway. | release output, quickstart checks |

## Artifact lineage

The runtime should make it easy to trace:

`spec -> plan -> research/contracts -> tasks -> implementation -> validation`

Lineage should point back to real files in `specs/<feature-id>/` instead of
guessing from timestamps or chat history.

## Recovery rule

If a session is interrupted, inspect `.specify/state/` first. Agents should
resume from the last known stage and artifact instead of re-deriving state from
partial memory.

## Issue-export convention

When tasks are exported into issues or tracked externally:

- preserve the originating feature id
- preserve task ids and dependencies
- keep the current stage and next action visible
- reference the same artifact lineage recorded in flow state
