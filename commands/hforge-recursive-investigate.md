---
id: command-hforge-recursive-investigate
kind: command
title: Harness Recursive Investigate Command
summary: Use when an agent should autonomously escalate a hard task into a recursive session, prefer Typed RLM first, and only fall back to bounded structured analysis when needed.
status: stable
owner: core
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - all
generated: false
---
# Harness Recursive Investigate Command

## Syntax

Invoke this command in runtimes that support markdown-backed command entrypoints,
for example `/hforge-recursive-investigate` followed by the problem statement,
task id, or investigation objective.

## When agents should use it

Use this command when the task is hard enough that ordinary chat-only reasoning
or one-pass repo scanning is likely to miss important evidence.

Typical triggers:

- the problem crosses multiple modules, packages, or services
- the root cause is unclear and requires staged evidence gathering
- the task needs compact durable artifacts so the agent does not keep rereading
  the same repo surfaces
- the work benefits from typed bundles, bounded subcalls, or replayable session
  state
- the task needs policy-aware code-cell execution or proposal artifacts rather
  than freeform shell-first exploration
- the task is large enough that ordinary prompt history would become noisy or
  expensive without compact root frames and scorecards

Do not use it for small, direct edits where ordinary repository inspection is
enough.

## Expected workflow

1. resolve command execution through `.hforge/generated/bin/hforge(.cmd|.ps1)` first, bare `hforge` second, and `npx @harness-forge/cli` last
2. inspect support with `hforge recursive capabilities --root . --json`
3. create or refresh the investigation substrate with `hforge recursive plan "<objective>" --task-id <taskId> --root . --json`
4. prefer Typed RLM first by submitting a bundle with `hforge recursive execute <sessionId> --file <bundle.json> --root . --json` or `--stdin`
5. fall back to `hforge recursive run <sessionId> --file <snippet>` or `--stdin` only when one bounded structured-analysis step is the right tool
6. inspect the durable outputs with `hforge recursive inspect <sessionId> --root . --json`, `hforge recursive iterations <sessionId> --root . --json`, `hforge recursive subcalls <sessionId> --root . --json`, `hforge recursive cells <sessionId> --root . --json`, `hforge recursive promotions <sessionId> --root . --json`, `hforge recursive meta-ops <sessionId> --root . --json`, `hforge recursive score <sessionId> --root . --json`, and `hforge recursive replay <sessionId> --root . --json`
7. summarize the investigation using the durable artifacts instead of repeating broad repo scans

## Agent behavior hints

- say explicitly when you are escalating into recursive mode
- prefer typed bundles that read handles, create bounded subcalls, checkpoint,
  or summarize evidence before using freeform snippets
- treat recursive sessions as durable evidence, not as an excuse for unlimited
  exploration
- compact context by reusing root frames, iteration results, scorecards, and
  final outputs instead of rereading the whole repo
- keep support claims honest: Cursor and OpenCode only receive translated
  shared-runtime recursive support, not native parity

## Failure behavior

- if recursive capabilities do not support the active language or posture, say
  so explicitly and fall back to ordinary non-recursive investigation
- if the task is actually simple, do not force recursive mode just because the
  command is available
- if policy blocks code cells, promotions, or writes, report that honestly and
  continue within the allowed recursive posture
