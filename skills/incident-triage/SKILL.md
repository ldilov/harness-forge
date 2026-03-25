---
name: incident-triage
description: Rapid incident framing for breakages, production regressions, and severe failures.
---

# Incident Triage

## Trigger Signals

- the task is an outage, regression, or urgent failure

## Inspect First

- failing logs, error output, recent changes, and impacted entrypoints

## Workflow

1. identify blast radius and failure signature
2. isolate the most likely failing boundary
3. define contain, mitigate, and verify steps
4. summarize status and next action

## Output Contract

- incident summary
- suspected root cause
- containment plan
- verification path

## Failure Modes

- no reliable reproduction or telemetry is available

## Escalation

- escalate when the blast radius or data risk is unclear
