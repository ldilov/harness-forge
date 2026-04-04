# Recursive RLM Guide

Harness Forge Recursive RLM is the durable investigation mode for work that is too large, ambiguous, or evidence-heavy for ordinary chat-only reasoning.

It is not a hidden background agent loop. It is an explicit, policy-bounded runtime that an agent can choose when the task benefits from compact root frames, typed iterations, bounded code cells, reusable helper scripts, scorecards, and replayable artifacts.

## What It Is Today

The promoted flow is:

1. inspect recursive support and host runtimes
2. plan a recursive session
3. prefer Typed RLM action bundles
4. use bounded structured analysis only as a fallback
5. inspect artifacts
6. score and replay the trajectory
7. summarize from durable evidence

That means the current RLM implementation is best understood as:

- an environment-first session planner
- a typed recursive execution substrate
- a bounded code-cell runner
- a durable artifact and memory system
- a replay and score layer

## Typed RLM vs Structured Analysis

Use Typed RLM when you want the agent to work through explicit bounded operations such as:

- `read-handle`
- `update-memory`
- `checkpoint`
- `spawn-subcall`
- `run-code-cell`
- `propose-promotion`
- `propose-meta-op`
- `finalize-output`

Use bounded structured analysis when one focused host-executed snippet is enough and a full typed iteration would be overkill.

In short:

- `hforge recursive execute` is the promoted Typed RLM path
- `hforge recursive run` is the bounded structured-analysis fallback

## When Agents Should Use It

Installed agents are encouraged to choose recursive mode when the task is:

- cross-module or cross-service
- ambiguous enough to need staged evidence gathering
- long enough that normal prompt history will get noisy
- policy-sensitive and likely to need bounded execution
- worth preserving as durable runtime artifacts

Installed agents should not force recursive mode for:

- simple single-file edits
- obvious fixes after one targeted read
- formatting or mechanical chores

## Host Runtime Inventory

Recursive code cells now use the canonical runtime inventory at:

`\.hforge/runtime/recursive/runtime-inventory.json`

That inventory records:

- operating system family
- shell posture
- Node.js availability
- Python availability
- PowerShell availability
- whether a runtime is host-provided or workspace-managed
- version, health, and execution hints

If a desired runtime is missing or unhealthy, inspect:

- `hforge recursive runtimes --root . --json`
- `hforge recursive provision-runtime python --root . --json`
- `hforge recursive provision-runtime powershell --root . --json`

Provisioning is explicit and advisory. Harness Forge does not silently mutate the system runtime environment behind the operator’s back.

## Session Artifact Map

Recursive sessions live under:

```text
.hforge/runtime/recursive/sessions/RS-123/
|- session.json
|- execution-policy.json
|- capabilities.json
|- runtime-inventory.json
|- memory.json
|- summary.json
|- root-frame.json
|- iterations/
|- runs/
|- subcalls/
|- code-cells/
|- helpers/
|- checkpoints/
|- promotions/
|- meta-ops/
|- scorecards/
`- final-output.json
```

The `helpers/` directory contains reusable helper scripts published by code-cell actions. These are session-scoped artifacts, not unrestricted product-code writes.

## Minimal Operator Walkthrough

Problem:

"I need one compact investigation that confirms which runtime surfaces exist before I ask the agent to dig deeper."

Commands:

```bash
hforge recursive capabilities --root . --json
hforge recursive runtimes --root . --json
hforge recursive plan "inspect recursive posture for the current repo" --task-id TASK-001 --root . --json
```

What to inspect:

- `.hforge/runtime/recursive/language-capabilities.json`
- `.hforge/runtime/recursive/runtime-inventory.json`
- `.hforge/runtime/recursive/sessions/<sessionId>/session.json`
- `.hforge/runtime/recursive/sessions/<sessionId>/runtime-inventory.json`
- `.hforge/runtime/recursive/sessions/<sessionId>/root-frame.json`

What success looks like:

- you know whether Node.js, Python, and PowerShell are healthy
- you know whether the current session allows those runtimes by policy
- the agent can decide whether Typed RLM is warranted before it starts iterating

## Realistic Investigation Scenario

Problem:

"The billing retry flow fails somewhere between the API route, the service layer, and the worker. The root cause is unclear and I do not want the agent to keep rescanning the repo."

Operator-facing flow:

```text
/hforge-recursive-investigate investigate the billing retry flow across API, service, and worker boundaries
```

Explicit CLI equivalent:

```bash
hforge recursive capabilities --root . --json
hforge recursive runtimes --root . --json
hforge recursive plan "investigate billing retry flow across API, service, and worker boundaries" --task-id TASK-BILLING-001 --root . --json
hforge recursive execute RS-123 --file billing-bundle.json --root . --json
hforge recursive score RS-123 --root . --json
hforge recursive replay RS-123 --root . --json
```

What the operator gets back:

- a session id
- a bounded policy posture
- typed iterations instead of one giant chat transcript
- reusable helper scripts when a code cell publishes them
- a scorecard and replay path for reviewing the investigation

## Limits and Honesty

- Recursive mode is agent-selected, not silently always-on.
- Typed RLM is the promoted path; structured analysis remains the fallback.
- Node.js is always host-provided through the active CLI process.
- Python and PowerShell depend on healthy host discovery or explicit workspace-managed provisioning.
- Cursor and OpenCode should be treated as translated recursive support, not native parity.
