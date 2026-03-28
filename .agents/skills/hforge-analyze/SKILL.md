---
name: "hforge-analyze"
description: "Analyze the current repository using Harness Forge runtime surfaces, refresh stale findings when needed, summarize repo shape and risks, and promote architecture-significant findings into durable notes or decision candidates."
compatibility: "Works best in repositories already initialized with Harness Forge, but may bootstrap first if needed."
metadata:
  author: "harness-forge"
  source: "skills/hforge-analyze/SKILL.md"
---

## User Input

```text
$ARGUMENTS
```

You must consider the user input before proceeding.

## Goal

Use Harness Forge as the primary repo-analysis system instead of re-deriving the repository state from scratch.

## Execution

1. Treat the text after `/hforge-analyze` as the focus area or analysis lens.
2. Inspect `.hforge/agent-manifest.json`, `.hforge/runtime/index.json`, and `.hforge/runtime/repo/` first when present.
3. Run `hforge status --root . --json`.
4. If runtime artifacts are missing or stale, run `hforge refresh --root . --json`.
5. Run `hforge review --root . --json` when health, decision coverage, or stale task state matters.
6. Summarize:
   - repo shape
   - dominant languages and frameworks
   - risks and validation gaps
   - recommended next actions
7. When the analysis reveals architecture-significant changes, promote them into an ASR or ADR under `.hforge/runtime/decisions/`.
8. Keep product code unchanged unless the user explicitly asks for edits.
