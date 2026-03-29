---
name: token-budget-optimizer
description: Auto-discoverable wrapper for `.hforge/library/skills/token-budget-optimizer/SKILL.md`.
---

# Token Budget Optimizer

## Activation

- trigger when context is getting large, repetitive, or expensive to keep in active prompt history
- trigger when the repo already has runtime summaries, task artifacts, decisions, or specs that can be reused instead of re-read
- trigger before broad repo rescans when the next safe answer may already exist in `.hforge/` or other authoritative guidance surfaces

## Use These Surfaces

- `.hforge/library/skills/token-budget-optimizer/SKILL.md`
- `.hforge/library/skills/token-budget-optimizer/references/`
- `.hforge/library/skills/token-budget-optimizer/scripts/inspect_token_surfaces.py`
- `.hforge/library/docs/authoring/token-budget-optimizer-port.md`

## Operating Rule

Use the canonical skill under `.hforge/library/skills/` for execution. Treat
this wrapper as a discovery entrypoint only, prefer the smallest authoritative
runtime surfaces first, and use the maintainer-facing port note only when the
import rationale or promotion intent matters.
