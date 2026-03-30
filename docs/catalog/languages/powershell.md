---
id: language-pack-powershell
kind: language-pack
title: PowerShell Language Pack
summary: Enriched PowerShell pack with execution-grade docs, examples, rules, and workflow guidance.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - powershell
generated: false
maturity: seeded
---
# PowerShell Language Pack

## Best fit

Use this pack when PowerShell dominates the task and the answer depends on runtime boundaries, framework behavior, validation, or packaging details.

## What ships

- `knowledge-bases/seeded/powershell/docs/overview.md`
- `knowledge-bases/seeded/powershell/docs/frameworks.md`
- `knowledge-bases/seeded/powershell/docs/examples-guide.md`
- `knowledge-bases/seeded/powershell/docs/review-checklist.md`
- `knowledge-bases/seeded/powershell/examples/`
- `rules/powershell/`
- `templates/workflows/implement-powershell-change.md`
- `skills/powershell-engineering/SKILL.md`

## What changed in the enrichment pass

- placeholder-like summaries replaced with decision guidance
- examples rewritten as task playbooks
- review checklist made release-gate oriented
- rules made operational instead of decorative
