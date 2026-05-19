---
id: command-hforge-double-diamond
kind: command
title: Harness Double Diamond Feature Command
summary: Use when an agent should run a Discover -> Define -> Develop -> Deliver workflow before implementing a meaningful feature.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - all
generated: false
---
# Harness Double Diamond Feature Command

## Syntax

Invoke this command in runtimes that support markdown-backed command entrypoints:

```text
/hforge-double-diamond <feature request>
```

For Claude Code project skills, prefer:

```text
/double-diamond-feature <feature request>
```

For Codex skills, prefer:

```text
$double-diamond-feature <feature request>
```

## Arguments and options

- `<feature request>`: the feature, behavior change, or ambiguous product request to frame before coding.
- No flags. Mode (Lite, Standard, Deep) is selected by the agent from risk and ambiguity, and stated explicitly.

## Expected workflow

1. Resolve workspace context through `.hforge/generated/bin/hforge(.cmd|.ps1)` first, bare `hforge` second, and `npx @harness-forge/cli` last.
2. Inspect workspace state if available:
   - `hforge status --root . --json`
   - `hforge commands --root . --json`
   - `hforge task list --root . --json` when task artifacts may exist
   - `hforge cartograph . --json` for architecture-sensitive work
3. Run the Double Diamond frame:
   - Discover user outcome, repo context, constraints, risks, assumptions.
   - Define problem, non-goals, acceptance criteria, and risk level.
   - Develop at least two options for non-trivial work.
   - Deliver selected option with validation and rollback plan.
4. Before editing files, present the frame unless the task is explicitly Lite.
5. During implementation, reframe if new evidence invalidates the selected approach.
6. After implementation, provide a delivery report with validation results.

## Output contract

```markdown
# Double Diamond Feature Frame

## Mode
Lite | Standard | Deep

## Discover
- User outcome:
- Evidence inspected:
- Existing behavior:
- Constraints:
- Unknowns / assumptions:

## Define
- Problem:
- Non-goals:
- Acceptance criteria:
- Risk level:

## Develop
| Option | Summary | Pros | Cons | Risk | Validation |
|---|---|---|---|---|---|

## Decision
- Selected option:
- Rationale:
- Trade-offs:

## Deliver Plan
- Files likely to change:
- Validation commands:
- Rollback/mitigation:
```

After implementation:

```markdown
# Delivery Report

## Changes
## Validation
## Acceptance Mapping
## Remaining Risks
## Rollback / Mitigation
## Follow-up
```

## Side effects

- Read-only by default during Discover and Define; only the Deliver stage modifies files.
- May create task artifacts under `.hforge/runtime/tasks/<taskId>/` when the runtime is initialized.
- Does not run destructive commands during discovery.

## Failure behavior

- If the request is actually a bug, switch to `/hforge-bug-diamond` or `bug-investigation`.
- If workspace is not initialized, proceed with repository inspection and recommend `/hforge-init` only when Harness Forge runtime artifacts are needed.
- If no validation command is available, state manual verification steps.
- If high-risk changes are required, pause for human confirmation.
- If the agent cannot find enough evidence, label assumptions instead of fabricating certainty.

## Lite mode

Use Lite mode for low-risk changes. Keep output to one compact section:

```markdown
Discover: ...
Define: ...
Develop: ...
Deliver: ...
```
