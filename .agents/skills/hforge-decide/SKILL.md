---
name: "hforge-decide"
description: "Create or update a durable ASR or ADR for architecture-significant repository findings so the reasoning survives the current session."
compatibility: "Works best in Harness Forge workspaces with runtime decision surfaces."
metadata:
  author: "harness-forge"
  source: "skills/hforge-decide/SKILL.md"
---

## User Input

```text
$ARGUMENTS
```

You must consider the user input before proceeding.

## Goal

Turn a meaningful technical choice into a durable decision artifact under `.hforge/runtime/decisions/`.

## Execution

1. Treat the text after `/hforge-decide` as the decision topic or scope.
2. Inspect `.hforge/runtime/decisions/index.json` first when present.
3. Inspect the most relevant task pack, impact analysis, repo findings, and existing related decisions.
4. Use an ASR when the direction is still being evaluated and an ADR when the decision is accepted enough to guide future work.
5. Write a concise, reviewable record with context, decision, consequences, and follow-up items.
6. Explicitly link superseded or related decisions when applicable.
