---
id: harness-forge-placement
kind: documentation
title: Harness Forge Placement Guide
summary: Suggested placement for these semi-formal reasoning templates inside a Harness Forge-style repository.
status: stable
version: 1
---

# Harness Forge Placement Guide

This bundle is standalone, but it maps naturally onto a Harness Forge-style repo.

## Recommended placement

### Canonical installed layer

Place the reusable templates under a reasoning-focused namespace such as:

- `.hforge/templates/reasoning/contracts/`
- `.hforge/templates/reasoning/logs/`
- `.hforge/templates/reasoning/ledgers/`
- `.hforge/templates/reasoning/certificates/`
- `.hforge/templates/reasoning/workflows/`

### Thin visible bridge layer

Optionally expose a smaller user-facing subset under:

- `templates/reasoning/`
- `docs/reasoning/`

## Suggested file mapping

| This bundle file | Suggested repo location |
|---|---|
| `templates/contracts/semiformal-core-contract.md` | `.hforge/templates/reasoning/contracts/semiformal-core-contract.md` |
| `templates/logs/semiformal-exploration-log.md` | `.hforge/templates/reasoning/logs/semiformal-exploration-log.md` |
| `templates/ledgers/function-trace-table.md` | `.hforge/templates/reasoning/ledgers/function-trace-table.md` |
| `templates/ledgers/data-flow-and-semantic-properties.md` | `.hforge/templates/reasoning/ledgers/data-flow-and-semantic-properties.md` |
| `templates/certificates/*.md` | `.hforge/templates/reasoning/certificates/` |
| `workflows/*.md` | `.hforge/templates/reasoning/workflows/` |
| `docs/*.md` | `docs/reasoning/` or `.hforge/library/docs/reasoning/` |

## How to use in task flow

### During planning

Attach:

- semiformal core contract
- change-safety certificate for risky changes

### During investigation

Attach:

- exploration log
- function trace or data-flow ledger as needed

### During review

Require:

- task-specific certificate or change-safety certificate
- explicit final conclusion
- unresolved assumptions section

## Recommended governance note

Do not treat these as decorative docs.
Treat them as **execution contracts** for how agents and engineers must reason when correctness claims matter.
