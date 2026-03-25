---
name: security-scan
description: Defensive review checklist for secrets, auth boundaries, input validation, and package safety.
---

# Security Scan

## Trigger Signals

- the task touches auth, secrets, privileged routes, or network boundaries
- the repository is a service or security-sensitive runtime

## Inspect First

- environment and config surfaces
- auth middleware, handlers, route guards, and secret-loading code
- dependency manifests and externally reachable entrypoints

## Workflow

1. identify exposed trust boundaries and secret-bearing paths
2. inspect input validation, auth, and authorization behavior
3. review dependency, logging, and data-exposure risks
4. summarize concrete findings and remediation priorities

## Output Contract

- attack-surface summary
- ordered findings with severity
- recommended remediations
- residual risk note

## Failure Modes

- the task scope hides the actual runtime boundary
- there is no reliable way to trace user input to protected operations

## Escalation

- escalate when a likely secret leak or auth bypass is detected
- escalate when the scan cannot safely verify a high-risk boundary

## References

- `skills/security-scan/references/review-checklist.md`
