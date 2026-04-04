---
name: "hforge-recursive-investigate"
description: "Auto-discoverable wrapper for the Harness Forge recursive-investigate workflow. Use when a task is ambiguous, cross-module, investigation-heavy, or likely to benefit from Typed RLM, bounded subcalls, and durable recursive artifacts."
compatibility: "Works best in repositories already initialized with Harness Forge and should remain honest about translated support on partial targets."
metadata:
  author: "harness-forge"
  source: "skills/hforge-recursive-investigate/SKILL.md"
---

## User Input

```text
$ARGUMENTS
```

You must consider the user input before proceeding.

## Goal

Use Harness Forge recursive mode as an explicit investigation operating layer
for hard tasks, preferring Typed RLM first and only falling back to bounded
structured analysis when necessary.

## Execution

1. Treat the text after `/hforge-recursive-investigate` as the investigation objective or task focus.
2. Inspect `.hforge/agent-manifest.json`, `.hforge/runtime/index.json`, `.hforge/runtime/recursive/language-capabilities.json`, `.hforge/runtime/recursive/runtime-inventory.json`, and `.hforge/runtime/recursive/escalation-heuristics.json` first when present.
3. Run `hforge recursive capabilities --root . --json` before claiming recursive support for the active language or target.
4. Run `hforge recursive runtimes --root . --json` before assuming Python or PowerShell code-cell availability.
5. Use `hforge recursive provision-runtime <python|powershell> --root . --json` only when a workspace-managed runtime alias is genuinely useful.
6. Create or inspect a session with `hforge recursive plan "<objective>" --task-id <taskId> --root . --json` or `hforge recursive inspect <sessionId> --root . --json`.
7. Prefer Typed RLM through `hforge recursive execute <sessionId> --file <bundle.json> --root . --json` or `--stdin`.
8. Use `hforge recursive run <sessionId> --file <snippet>` or `--stdin` only when one bounded structured-analysis step is the right tool.
9. Inspect durable artifacts with `hforge recursive iterations`, `subcalls`, `cells`, `promotions`, `meta-ops`, `score`, and `replay`.
10. Reuse the recursive artifacts in your summary instead of re-scanning the whole repo.
11. Keep product code unchanged unless the user explicitly asks for edits.
