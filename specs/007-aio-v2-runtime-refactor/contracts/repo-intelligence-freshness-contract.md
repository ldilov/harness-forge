# Contract: Hidden Repo Intelligence Freshness and Impact

## Purpose

Define how hidden repo-intelligence artifacts remain trustworthy through file
relevance, freshness metadata, provenance, trust labels, and impact analysis.

## Required Guarantees

- Hidden repo-intelligence artifacts expose evidence, confidence, freshness,
  and trust status clearly enough for maintainers to judge reliability.
- File-of-interest selection uses task relevance and risk signals instead of
  whole-repo dumps.
- Refresh behavior updates affected areas when possible and marks stale
  artifacts explicitly when trust has degraded.
- Impact analysis surfaces likely affected modules, tests, contracts, and risk
  zones before implementation begins.
- Hidden repo intelligence remains inspectable without being mistaken for
  visible product source.

## Validation Expectations

- Freshness checks fail when generated hidden artifacts no longer expose
  required metadata.
- Relevance checks fail when ignorable noise is treated as must-include task
  context.
- Impact-analysis checks fail when the runtime promises blast-radius insight
  but cannot surface affected modules or risk zones for representative tasks.
