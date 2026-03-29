# Agent Usage Playbook

Harness Forge is most useful when the agent treats it as an explicit operating
layer rather than passive repo decoration.

This playbook shows how to promote actual usage in installed workspaces, how to
run commands even when bare `hforge` is not on `PATH`, and what prompts to give
Claude Code or Codex so they use the installed runtime instead of falling back
to ad-hoc repo exploration.

## Command resolution rule

Inside an installed workspace, agents should resolve Harness Forge commands in
this order:

1. `.hforge/generated/bin/hforge.cmd` or `.ps1` on Windows, or `./.hforge/generated/bin/hforge` on POSIX
2. bare `hforge`
3. `npx @harness-forge/cli`

That means a global install is optional. Agents can still run the package
reliably through the workspace-local launcher.

## Slash-style command trigger

In runtimes that support markdown command entrypoints, Harness Forge can also
be promoted through `/hforge-init`, `/hforge-analyze`, `/hforge-review`,
`/hforge-refresh`, `/hforge-decide`, `/hforge-status`, `/hforge-commands`,
`/hforge-recommend`, `/hforge-cartograph`, `/hforge-task`,
`/hforge-recursive`, and `/hforge-update`.

Those commands are backed by `commands/hforge-init.md`,
`commands/hforge-analyze.md`, `commands/hforge-review.md`,
`commands/hforge-refresh.md`, `commands/hforge-decide.md`,
`commands/hforge-status.md`, `commands/hforge-commands.md`,
`commands/hforge-recommend.md`, `commands/hforge-cartograph.md`,
`commands/hforge-task.md`, `commands/hforge-recursive.md`, and
`commands/hforge-update.md`, and are intended to make the agent:

- inspect the installed Harness Forge runtime first
- choose a safe command execution path
- summarize active guidance, targets, repo intelligence, and next steps before coding

## What usage looks like

An agent is usually using Harness Forge well when it does at least some of the
following:

- reads `AGENTS.md`, `CLAUDE.md`, or target bridge files before acting
- checks `.hforge/agent-manifest.json` or `.hforge/generated/agent-command-catalog.json`
- uses `status`, `commands`, `recommend`, `review`, `task`, or `recursive` instead of inventing unsupported commands
- reads `.hforge/runtime/repo/repo-map.json` or `.hforge/runtime/repo/recommendations.json` before making support claims
- writes durable artifacts only when the workflow actually calls for them
- compacts context by reusing runtime summaries, task artifacts, and decision
  records instead of rereading wide repo surfaces

## Important limitation

Normal agent work does not automatically populate every Harness Forge runtime
folder.

For example:

- `.hforge/runtime/tasks/` only fills when task-runtime flows are used
- `.hforge/runtime/decisions/` only fills when ASR or ADR style decision records are written
- `.hforge/runtime/recursive/sessions/` only fills when recursive mode is explicitly used

So an empty task or decision folder does not automatically mean the agent is
ignoring Harness Forge. It often means the agent is using the guidance layer
but has not yet been asked to persist structured runtime artifacts.

## Recommended first commands

These are the best low-friction commands to promote actual package usage:

```bash
hforge status --root . --json
hforge commands --json
hforge recommend . --json
hforge review --root . --json
```

If the repo already has meaningful complexity:

```bash
hforge cartograph . --json
hforge classify-boundaries . --json
hforge synthesize-instructions . --target claude-code --json
```

If the task is hard or multi-hop:

```bash
hforge recursive plan "investigate the issue" --task-id TASK-001 --root . --json
hforge recursive capabilities --root . --json
```

If the task is large or the prompt is getting expensive:

```text
Load .agents/skills/token-budget-optimizer/SKILL.md and use the installed
token-budget-optimizer skill before broad repo scanning. Reuse existing
runtime summaries, task artifacts, and decision records first, then tell me
which surfaces you will keep loaded and which ones you can compact away.
```

## Prompt patterns

### 1. Prove that the agent is using Harness Forge

Use this when you want the agent to confirm it is reading the installed layer:

```text
Before making changes, inspect CLAUDE.md, AGENTS.md, and .hforge/agent-manifest.json.
Tell me which Harness Forge surfaces are active in this repo, which command form
you will use, and which hidden runtime files you consider authoritative.
```

### 2. Force command-aware behavior

Use this when the agent tends to improvise commands:

```text
Use the installed Harness Forge command catalog before inventing commands.
Resolve execution through .hforge/generated/bin/hforge first, then bare hforge,
then npx @harness-forge/cli. Show me the command you chose before running it.
```

### 3. Force repo-aware guidance before coding

Use this when you want the agent to inspect the workspace before implementation:

```text
Use Harness Forge to inspect this repo before coding. Run status, commands, and
recommend, then summarize what the installed runtime says about targets, risks,
and recommended operating surfaces before you edit files.
```

### 4. Create durable task artifacts

Use this when you want visible runtime evidence for a feature or bug:

```text
Treat this work as a tracked Harness Forge task. Create a task id, inspect the
repo using the installed runtime, and persist task-runtime artifacts for file
interest, impact analysis, and task pack output before implementation.
```

### 5. Create decision records

Use this when the work changes architecture, workflow, or support posture:

```text
If this task changes architecture, release posture, workflow contracts, or AI
runtime behavior, write a Harness Forge decision record under
.hforge/runtime/decisions and summarize the rationale in the response.
```

### 6. Escalate into recursive mode

Use this when the work is ambiguous or investigation-heavy:

```text
This is a hard investigation task. Use Harness Forge recursive mode instead of
chat-only reasoning. Plan a recursive session, inspect recursive capabilities,
run one bounded structured analysis step, and return the durable run result.
```

### 7. Keep the agent honest about support claims

Use this when the task touches target support or language behavior:

```text
Do not guess target or language support. Use Harness Forge capability surfaces,
including .hforge/runtime/recursive/language-capabilities.json and target inspect
output, before claiming that Claude Code, Codex, Cursor, or OpenCode supports a
behavior.
```

### 8. Force context compaction and reuse

Use this when the task is long-running or the agent is repeating repo scans:

```text
Use the installed Harness Forge token-budget-optimizer skill before you expand
context further. Reuse existing runtime summaries, task artifacts, and decision
records first. Tell me what you will keep loaded, what you will compact, and
what new evidence still requires a focused read.
```

## Claude-specific examples

```text
Use CLAUDE.md as the Claude-native bridge, but keep AGENTS.md as the shared
cross-agent contract. Before implementing, inspect the installed Harness Forge
runtime and tell me which launcher or command form you will use.
```

```text
Use Harness Forge as your repo operating layer for this task. Read CLAUDE.md,
AGENTS.md, and .hforge/generated/agent-command-catalog.json, then use status,
recommend, and review before you write code.
```

## Codex-specific examples

```text
Use AGENTS.md and the installed Harness Forge command catalog before editing.
If hforge is not on PATH, use the workspace launcher under .hforge/generated/bin.
Prefer Harness Forge repo-intelligence commands over blind repo scanning.
```

```text
Use Harness Forge to bootstrap your understanding of this repo: inspect command
availability, review installed targets, run recommendation and repo-map flows,
and base your plan on the installed runtime outputs instead of assumptions.
```

## Best operator habit

If you want agents to use Harness Forge more consistently, make that an explicit
instruction at the start of important tasks:

```text
Use the installed Harness Forge runtime for this task, not just the repo files.
Inspect the active guidance surfaces first, resolve the safest command form, and
persist structured artifacts when the task crosses into tracked work,
architecture decisions, or recursive investigation.
```
