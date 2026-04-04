---
id: semiformal-exploration-log
kind: task-template
title: Semi-formal Exploration Log
summary: Structured exploration format for hypothesis-led repository investigation.
category: reasoning
status: stable
version: 1
applies_to:
  - codex
  - claude-code
  - cursor
  - opencode
languages:
  - any
supported_targets:
  - codex
  - claude-code
  - cursor
  - opencode
supported_languages:
  - any
owner: core
generated: false
---

# Semi-formal Exploration Log

This file is the live working log. Use it while navigating the repository.

The rule is simple:

> do not request or open the next file until you can state the hypothesis that justifies it.

## Session metadata

- task:
- current question:
- target conclusion:
- session owner:
- started at:

## Exploration entries

Copy this block for each exploration step.

### Step N - before requesting a file or tool output

- HYPOTHESIS H[N]:
  - what do I expect to find?
  - why might this file / symbol / config contain the answer or the bug?
- EVIDENCE ALREADY HELD:
  - which prior premise, test detail, or observation justifies this hypothesis?
- CONFIDENCE:
  - high | medium | low
- NEXT ACTION:
  - read file | inspect symbol | inspect config | inspect test | inspect call site
- NEXT ACTION RATIONALE:
  - why this is the best next move instead of another path

### Step N - after reading

- OBSERVATIONS from `[filename]`
  - O[N.1]:
    - location:
    - observation:
    - why it matters:
  - O[N.2]:
    - location:
    - observation:
    - why it matters:
- HYPOTHESIS UPDATE
  - H[X]: CONFIRMED | REFUTED | REFINED
  - explanation:
- NEW OR REFINED HYPOTHESES
  - H[Y]:
- UNRESOLVED
  - open question 1:
  - open question 2:
- CONTINUE OR STOP?
  - continue because:
  - or stop because:
- EVIDENCE QUALITY
  - low | medium | high
- TRACE COMPLETENESS
  - low | medium | high

## Escalation triggers

If any of these happen, escalate into a full certificate:

- the answer affects merge safety
- more than one plausible explanation remains
- the issue spans multiple files or layers
- third-party semantics are involved
- the reasoning is beginning to branch

## Anti-patterns

Do not write:

- "read this file just in case"
- "probably this is the bug"
- "looks equivalent"
- "I think this helper does X" without evidence
- "done" while unresolved questions still directly affect the conclusion
