---
name: double-diamond-feature
description: Use for meaningful feature development before coding. Guides the agent through Discover, Define, Develop, and Deliver with evidence, options, validation, and rollback notes. Do not use for bugs, regressions, outages, or flaky tests; use bug-investigation instead.
---

# Double Diamond Feature Development

## Trigger Signals

Use this skill when the user asks for:

- a new feature
- a user-facing behavior change
- an API or workflow change
- an ambiguous product request
- architecture-significant implementation work
- a feature that may affect security, performance, data, accessibility, or cross-system behavior

Do not use as the primary workflow for bugs, regressions, outages, or flaky tests. Use `bug-investigation` instead.

## Mode Selection

- **Lite**: small, low-risk, clear change. Keep output short. Maps to the `brief` output profile.
- **Standard**: default for meaningful feature work. Maps to the `standard` output profile.
- **Deep**: high-risk, ambiguous, cross-boundary, or architecture-significant work. Maps to the `deep` output profile.

State the selected mode and why. Prefer the lightest mode that still makes the work safe and reviewable.

## Workflow

### 1. Discover

Gather evidence before editing files. Reuse Harness Forge runtime surfaces instead of rediscovering the repo: `.hforge/runtime/repo/repo-map.json`, `.hforge/runtime/repo/recommendations.json`, `.hforge/generated/agent-command-catalog.json`.

Classify every fact as:

- user-provided
- repository-derived
- runtime/tool-derived
- external research
- assumption

### 2. Define

Create the smallest correct problem frame:

- problem statement
- users/stakeholders
- non-goals
- constraints
- acceptance criteria
- risk level
- human checkpoint needed or not

### 3. Develop

For non-trivial work, compare at least two solution options:

| Option | Summary | Pros | Cons | Risk | Validation |
|---|---|---|---|---|---|

Select an option with rationale and trade-offs. For one viable option, justify why explicitly.

### 4. Deliver

Implement the selected option. Keep scope aligned with the defined problem.

After implementation, report:

- selected option
- files changed
- validation commands/results
- acceptance criteria mapping
- remaining risks
- rollback/mitigation
- follow-up work

## Reframe Triggers

Stop and update the frame if:

- new evidence changes the problem
- the task is actually a bug (switch to `bug-investigation`)
- the selected option requires a larger blast radius than expected
- high-risk security/data/infrastructure behavior appears
- no credible validation path exists

## Output Before Implementation

```markdown
## Double Diamond Frame
Mode: Lite | Standard | Deep

### Discover
- User outcome:
- Evidence:
- Existing behavior:
- Constraints:
- Unknowns/assumptions:

### Define
- Problem:
- Non-goals:
- Acceptance criteria:
- Risk:

### Develop
| Option | Summary | Pros | Cons | Risk | Validation |
|---|---|---|---|---|---|

### Decision
- Selected option:
- Why:
- Trade-offs:

### Delivery plan
- Files likely to change:
- Validation:
- Rollback/mitigation:
```

## Output After Implementation

```markdown
## Delivery Report
- Selected option:
- Files changed:
- Validation:
- Acceptance mapping:
- Remaining risks:
- Rollback/mitigation:
- Follow-up:
```

## High-Risk Pause

Pause for human confirmation before changes involving auth, secrets, payments, data deletion/migration, production infrastructure, or compliance-sensitive behavior.

## Target Compatibility

This skill is plain-markdown and host-agnostic. Claude Code invokes it as `/double-diamond-feature`; Codex selects it via `/skills` or `$double-diamond-feature`. Do not rely on host-native hooks or interactive prompts — degrade to stating assumptions in non-interactive hosts.
