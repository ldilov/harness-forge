---
id: command-hforge-bug-diamond
kind: command
title: Harness Bug Investigation Command
summary: Use when an agent should investigate a defect, regression, flaky test, or incident-like failure with evidence, hypotheses, verification, and recurrence prevention.
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
# Harness Bug Investigation Command

## Syntax

Invoke this command in runtimes that support markdown-backed command entrypoints:

```text
/hforge-bug-diamond <bug report or failing behavior>
```

For Claude Code project skills, prefer:

```text
/bug-investigation <bug report>
```

For Codex skills, prefer:

```text
$bug-investigation <bug report>
```

## Arguments and options

- `<bug report or failing behavior>`: the defect, regression, flaky test, or incident symptom to investigate.
- No flags. Severity and containment posture are classified by the agent during triage and stated explicitly.

## Expected workflow

1. Classify severity and impact.
2. Decide whether containment is needed before root cause analysis.
3. Capture expected behavior, actual behavior, environment, and reproduction status.
4. Inspect relevant repo/runtime evidence.
5. Build a hypothesis table.
6. Test hypotheses with the least risky, highest-information checks first.
7. Implement the smallest confirmed fix.
8. Verify against reproduction and regression coverage.
9. Add recurrence prevention notes.
10. Recommend A3, 8D-lite, DMAIC, or postmortem escalation when severity or recurrence warrants it.

## Output contract

```markdown
# Bug Investigation

## Triage
- Severity:
- User/system impact:
- Data risk:
- Containment needed:

## Problem Report
- Expected:
- Actual:
- Reproduction:
- Environment:

## Evidence
- User-provided:
- Repository:
- Runtime/tool:
- Assumptions:

## Hypotheses
| ID | Hypothesis | Likelihood | Evidence for | Evidence against | Test | Status |
|---|---|---|---|---|---|---|

## Fix Plan
- Confirmed root cause:
- Proposed fix:
- Validation:
- Prevention:
```

After implementation:

```markdown
# Bug Fix Report

## Root Cause Evidence
## Changes
## Verification
## Regression Coverage
## Recurrence Prevention
## Follow-up / Postmortem Need
```

## Side effects

- Read-only during triage, evidence inspection, and hypothesis testing; only the fix stage modifies files.
- Preserves evidence before cleanup when incident severity is medium or high.
- Does not run destructive commands as part of investigation.

## Failure behavior

- If user/data harm is ongoing, prioritize containment over root cause analysis.
- If the issue cannot be reproduced, preserve evidence and state confidence.
- Do not claim root cause without evidence.
- Do not refactor broadly unless the root cause requires it and the risk is accepted.
- If the issue is really a feature request, switch to `/hforge-double-diamond` or `double-diamond-feature`.
