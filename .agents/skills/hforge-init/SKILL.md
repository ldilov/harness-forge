---
name: "hforge-init"
description: "Bootstrap Harness Forge in the current repository, install or refresh the project-owned runtime, and summarize the managed surfaces that are now available."
compatibility: "Requires a repository where Harness Forge can write project-owned runtime files."
metadata:
  author: "harness-forge"
  source: "skills/hforge-init/SKILL.md"
---

## User Input

```text
$ARGUMENTS
```

You must consider the user input before proceeding.

## Goal

Initialize the current repository for Harness Forge usage and make the installed runtime easy to inspect and use.

## Execution

1. Treat the text after `/hforge-init` as optional setup hints such as target preference or setup intent.
2. Check whether `.hforge/agent-manifest.json` or `.hforge/runtime/index.json` already exists.
3. Run `hforge status --root . --json` first.
4. If the repository is not initialized or required target runtime surfaces are missing, run `hforge bootstrap --root . --yes`.
5. Run `hforge refresh --root . --json` after bootstrap or whenever runtime summaries look incomplete.
6. Summarize:
   - detected targets
   - installed managed surfaces
   - runtime artifacts now available
   - the best next command to run
7. If bootstrap cannot run safely, explain the blocker and list the minimum next manual step.
