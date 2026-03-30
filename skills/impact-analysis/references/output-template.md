# Output Template

Use this structure unless the user asks for a different format.

## Executive Summary
- summarize the change in one sentence
- state the top impact area
- state the top risk driver
- state the confidence band
- give the final recommendation

## Change Fingerprint
| Field | Value |
|---|---|
| change summary | |
| change type | |
| stage | |
| rollout mode | |
| primary artifacts | |
| major constraints | |

## Impact Inventory
| Surface | Direct / Indirect / Latent | Why it is affected | Severity | Evidence |
|---|---|---|---|---|
| component / contract / data / runtime / workflow | | | low / medium / high | |

## Scorecard
| Dimension | Score | Band | Main drivers |
|---|---:|---|---|
| impact quantity | | | |
| risk | | | |
| confidence | | | |

### Escalators Triggered
- list triggered escalators, or write `none`

## Evidence and Assumptions
### Evidence
- artifact-backed findings

### Assumptions
- explicit assumptions

### Unknowns
- missing evidence that could materially change the result

## Validation Plan
| Priority | Check | Why | Owner |
|---|---|---|---|
| p0 / p1 / p2 | | | |

## Rollout and Rollback Notes
- rollout guardrails
- stop conditions
- rollback path
- cleanup or repair steps if rollback is not lossless

## Recommendation
Choose one:
- approve
- approve with safeguards
- needs more evidence
- redesign before merge
- stage behind compatibility window
