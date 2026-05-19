---
name: bug-investigation
description: Use for defects, regressions, outages, flaky tests, and unexpected behavior. Guides the agent through triage, containment, reproduction, hypotheses, root-cause evidence, fix verification, and recurrence prevention. Do not use as the primary workflow for new features; use double-diamond-feature instead.
---

# Bug Investigation

## Trigger Signals

Use this skill when the user reports:

- broken behavior
- a regression
- a failing or flaky test
- production degradation
- incorrect data/output
- an incident-like symptom
- a bug report with expected vs actual behavior

Do not use as the primary workflow for new features. Use `double-diamond-feature` instead.

## Workflow

### 1. Triage

Classify:

- severity: low, medium, high, incident
- user/system impact
- data risk
- production risk
- containment needed or not

If harm is ongoing, contain first and preserve evidence.

### 2. Problem Report

Capture:

- expected behavior
- actual behavior
- reproduction steps or evidence gap
- environment/version/time window
- relevant logs/traces/screenshots if available

### 3. Evidence Inspection

Inspect relevant code, tests, recent changes, config, logs, and runtime artifacts. Reuse Harness Forge surfaces when present: `.hforge/runtime/repo/repo-map.json`, `.hforge/runtime/findings/risk-signals.json`. Label assumptions clearly.

### 4. Hypotheses

Create a ranked hypothesis table:

| ID | Hypothesis | Likelihood | Evidence for | Evidence against | Test | Status |
|---|---|---|---|---|---|---|

Prefer tests that rule out multiple causes. Record negative results.

### 5. Fix

Implement the smallest fix for the confirmed cause. Avoid broad refactors unless the cause requires them.

### 6. Verify

Verify using:

- reproduction now passes
- regression test added or updated
- relevant existing tests
- manual verification if automated tests are unavailable

### 7. Prevent Recurrence

Recommend one or more:

- regression test
- input validation
- type/schema guard
- monitor/alert
- docs/playbook update
- postmortem or A3/8D-lite for severe/recurrent issues

## Output Before Fix

```markdown
## Bug Investigation Frame

### Triage
- Severity:
- Impact:
- Data risk:
- Containment:

### Problem report
- Expected:
- Actual:
- Reproduction:
- Environment:

### Evidence
- User-provided:
- Repository/runtime:
- Assumptions:

### Hypotheses
| ID | Hypothesis | Likelihood | Evidence for | Evidence against | Test | Status |
|---|---|---|---|---|---|---|

### Fix plan
- Confirmed/likely cause:
- Proposed fix:
- Verification:
- Prevention:
```

## Output After Fix

```markdown
## Bug Fix Report
- Root cause evidence:
- Changes made:
- Verification:
- Regression coverage:
- Recurrence prevention:
- Follow-up/postmortem need:
```

## Root-Cause Honesty

Do not claim a root cause unless it is supported by reproduction, logs, tests, code-path evidence, or clearly stated confidence.

## Target Compatibility

This skill is plain-markdown and host-agnostic. Claude Code invokes it as `/bug-investigation`; Codex selects it via `/skills` or `$bug-investigation`. Do not rely on host-native hooks or interactive prompts.
