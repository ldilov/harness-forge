# Getting started with Sentinel

Sentinel watches your project quietly and writes down what changes.
Right now we ship one watcher (Repo Drift Monitor) and the commands
you need to use it. More watchers are on the way.

## Try it in under a minute

You'll need: Node.js 22 or later, this repo built (`npm run build`),
and a project to watch (we'll use the current repo).

### 1. See what watchers are installed

```bash
hforge monitor list
```

If you have not added any watchers yet, Sentinel will tell you and
suggest the next command.

### 2. Add the bundled defaults

```bash
hforge monitor init-defaults
```

This copies sample watcher configs into `.hforge/monitors/`. You can
edit them later — they are plain YAML.

### 3. Run one tick

```bash
hforge monitor once
```

Sentinel runs each enabled watcher one time. Output looks like:

```
- repo-drift: 1 new, 0 dedup, 0 error(s) in 5ms
Total: 1 new, 0 dedup, 0 error(s).
```

The first run captures a snapshot. Subsequent runs only emit a new
record if something actually changed.

### 4. See what was found

```bash
hforge observe
```

Each line shows what changed, why it matters, and which file points
to the proof. Example:

```
[info] repo-drift baseline captured
    Captured baseline for vitest.
    evidence: file:package.json, file:.hforge/runtime/observations/repo-drift-snapshot.json
    seen: 2026-05-05T21:21:22.336Z  source: harness.repo_drift
```

### 5. Check the cost meter

```bash
hforge monitor status
```

Confirms:
- Whether the daemon is running
- Whether **panic stop** is on
- How many watchers are enabled
- Your **LLM token daily budget** (default `0` — meaning zero
  AI cost from Sentinel itself)
- Your **maximum actions per hour** ceiling

## Turning a watcher on or off

```bash
hforge monitor disable repo-drift
hforge monitor enable repo-drift
```

This just flips the `enabled:` field in the YAML file. Safe to run
any time.

## Filtering observations

```bash
hforge observe --severity warning
hforge observe --since 1h
hforge observe --source harness.repo_drift --limit 10
hforge observe --json
```

## How Sentinel keeps cost predictable

Two files in `.hforge/runtime/policies/` are your knobs:

- **cadence.yaml** — minimum interval between ticks, max
  monitor runs per hour, max actions per hour, panic stop.
- **budget.yaml** — daily LLM token budget, per-action token
  budget, external request quotas (e.g., npm, github per hour).

If either file is missing, Sentinel uses safe defaults:

| Knob | Default | What it does |
|---|---|---|
| `globalMinIntervalSeconds` | 30 | No watcher runs more often than this. |
| `maxMonitorRunsPerHour` | 240 | Hard cap on watcher ticks per hour. Once hit, extra ticks return `monitor_runs_per_hour_exhausted` and skip cleanly. |
| `maxActionsPerHour` | 10 | Caps how many actions can be proposed in one hour. |
| `panicStop` | false | Set to `true` to halt all autonomy. |
| `llmTokens.dailyBudget` | 0 | Sentinel cannot call an LLM on its own. |

You can copy the bundled samples:

```bash
cp templates/sentinel/policies/cadence.yaml .hforge/runtime/policies/cadence.yaml
cp templates/sentinel/policies/budget.yaml .hforge/runtime/policies/budget.yaml
```

## How severity rules in your YAML take effect

Each watcher YAML can map a rule key to a severity level:

```yaml
classify:
  severity:
    default: notice
    manifest_changed: warning
```

Sentinel resolves the level in this order:

1. If the watcher emits a draft with a matching `classifyKey` (e.g. `manifest_changed`) and you mapped it, that level wins.
2. Otherwise the `default` level (if you set one) wins.
3. Otherwise the watcher's built-in default level wins.

This is how the Repo Drift Monitor escalates from `notice` to `warning` when `.hforge/agent-manifest.json` is touched.

## See signals and actions

When a watcher notices something worth flagging, it gets promoted to a **signal**.
When a signal carries a known intent, the planner proposes an **action**.

```bash
hforge signals                       # prioritized list
hforge signals show <id>             # full detail with linked observations
hforge signals suppress <id> --until 7d
hforge signals resolve <id>

hforge actions                       # all proposed plans
hforge actions show <id>             # steps, risk, verification, rollback
hforge actions reject <id> --reason "not now"
hforge actions run <id>              # refused — see "What is not in this preview yet"

hforge autonomy status               # current profile + budget usage
hforge autonomy policy               # full effective policy
hforge autonomy explain <action-id>  # why an action is allowed or blocked
```

A typical drift cycle:

```
$ hforge monitor once          # captures baseline
$ # ...edit package.json...
$ hforge monitor once          # detects drift
- repo-drift: 1 new, 0 dedup, 0 error(s) in 4ms

$ hforge signals
[notice] p=39 Repo drift in 1 surface
    Changed since last tick: package.json. Consider running 'hforge refresh' ...
    category=maintenance intent=refresh-harness-runtime id=sig_01KQX...

$ hforge actions
[proposed] Refresh Harness Forge runtime artifacts
    risk=low authority=A2 steps=2 id=act_01KQX...
    reason: Drift signal 'Repo drift in 1 surface' indicates that ...

$ hforge autonomy explain act_01KQX...
Decision for act_01KQX...: BLOCK
  - execution layer (US5 Safe Executor) not yet implemented; this action cannot run
  - requested authority A2 >= cautious profile default A1; human approval required
  - risk assessment requires human approval
```

## Approving an action

By default Sentinel proposes actions but never runs them. To approve one, give it
a scoped authority grant:

```bash
hforge actions approve <id> --authority A3 --expires 2h --scope ".hforge/**"
```

The approval is appended to a SHA-256 hash chain in `.hforge/runtime/actions/approvals.json`.
If anything tampers with the file (a stray edit, a corrupted commit, a bug),
the chain check raises `ApprovalChainTamperedError` on the next read and the
CLI surfaces it as a critical error — your approvals can't be silently
rewritten.

`hforge autonomy explain <action-id>` walks through the full policy-gate
decision and lists every reason the action is allowed or blocked:

- execution layer pending (US5 — always block today)
- panic-stop state
- requested authority vs granted authority (with the chosen approval)
- profile-required approval
- risk assessment requires human approval
- touched targets matching denied paths
- step commands matching denied patterns
- missing rollback for medium+ risk plans with local mutations
- profile-deny patterns (e.g. cautious denies `merge`, `deploy.production`)

## Profiles

Five built-in profiles ship with Sentinel:

| Profile | Default authority | Approval required for |
|---|---|---|
| `observe` | A0 | A1, A2, A3, A4, A5 |
| `cautious` (default) | A1 | A2, A3, A4, A5 |
| `assisted` | A2 | A3, A4, A5 |
| `active` | A3 | A4, A5 |
| `maintainer` | A4 | A5 |

Switch profile with `hforge autonomy set-profile <name>`. Override the default
level with `hforge autonomy set-level <A0..A5>`.

## Running an approved action

After approval, you can execute the action in an isolated worktree:

```bash
hforge actions run <id>                  # creates a worktree, runs each step,
                                         # captures stdout/stderr, runs verification,
                                         # logs every side effect to the ledger.
hforge actions run <id> --dry-run        # prints what would run without doing it
hforge actions verify <id>               # re-runs verification against the existing worktree
hforge actions diff <id>                 # prints the captured patch.diff
hforge actions logs <id> --stream both   # prints stdout/stderr per step
hforge actions ledger --action <id>      # all side effects for this action
hforge actions rollback <id>             # applies the action's RollbackSpec
```

Where things land:

```
.hforge/runtime/actions/runs/<action-id>/
├── plan.json          ← snapshot of the plan at run-time
├── stdout-step-0.log  ← captured per-step output
├── stderr-step-0.log
├── patch.diff         ← `git diff HEAD` inside the worktree
├── verification.json  ← verification report
├── side-effects.jsonl ← per-run mirror of the global ledger
└── worktree/          ← the isolated git worktree
```

The worktree is ALWAYS created from your current branch. The action's branch
is named `sentinel/<short-id>`; if it collides with an existing branch
(e.g., another worktree), Sentinel appends `-1`, `-2`, ...

The sandbox env redirects `HOME`/`USERPROFILE` to `<worktree>/.sentinel-home`,
keeps `PATH` and a small allowlist (locale, system dirs on Windows), and drops
everything else. Your `~/.aws`, `~/.ssh`, `SECRET_KEY=...` env vars, etc.
never reach the sandboxed step.

## Watching the outside world

Sentinel can also notice when packages or runtimes you depend on change.

```bash
hforge world sources                          # current allowlist + policy
hforge world watch add npm:typescript         # watch a single npm package
hforge world watch add runtime:nodejs:lts     # watch the Node.js LTS schedule
hforge world watch remove npm:typescript      # stop watching
hforge world sync                             # fetch all watched sources once
hforge world signals                          # filter signals to world-derived ones
```

What happens during `world sync`:

1. Sentinel fetches each allowlisted source. The HTTP client refuses any URL
   that isn't on the configured allowlist for the source kind.
2. Each event is normalized into an Observation.
3. **Relevance scoring** consults your `package.json`:
   - Direct dependency → score `1.0`
   - Peer / dev → `0.85` / `0.7`
   - Optional → `0.4`
   - Anything else → `0.1` (typically dropped or downgraded to `info`)
4. Drafts that pass the floor are ingested as observations, then run through
   the same correlator + planner pipeline as drift signals.
5. `304 Not Modified` responses short-circuit fetches with no bandwidth cost.

Adapters available today:

- `npm:<package>` — npm registry; flags `major_release` and `deprecated`.
- `runtime:nodejs:lts` — Node.js Release schedule; flags
  `runtime.maintenance` for any major past its maintenance date.
- `github:<owner/repo>` — adapter pending; CLI accepts the watch but does
  not fetch yet.

## Running the always-on daemon

`hforge monitor run` is now a real daemon. It blocks the terminal,
schedules each watcher on its own interval with jitter, polls
`panicStop`, and drains cleanly on Ctrl+C.

```bash
hforge monitor run                     # foreground; Ctrl+C to drain
hforge monitor run --max-ticks 5       # exit after 5 scheduler ticks (CI/smoke)
hforge monitor run --profile assisted  # apply a non-default autonomy profile
hforge monitor stop                    # send SIGTERM to the recorded pid
```

The PID file lives at `.hforge/runtime/sentinel.pid` and survives across
runs only as long as the daemon does — it's a structured record (pid,
hostname, started-at), and `monitor stop` reads it to find the right
process.

### Halt everything

```bash
hforge autonomy panic-stop on
```

The next daemon tick (within ~1 second) sees the flag, calls
`AbortController.abort("panic_stop")` on every in-flight executor run,
records a `panic.toggle` cadence-ledger entry, releases its PID lock,
and exits with reason `panic_stop`. Worktrees are preserved for forensic
review. Flip back with `hforge autonomy panic-stop off`.

### Crash recovery

If the daemon (or its host) is killed mid-run, the next time you call
`hforge monitor run` it scans for orphan run dirs whose checkpoints are
in non-terminal phases (`policy-check`, `worktree-create`, `running`,
`verifying`, `rollback`), flips them to `failed`, and continues. The
checkpoint file under `.hforge/runtime/actions/runs/<id>/checkpoint.json`
records the last phase + step index so an operator can attribute the
failure to the prior daemon process.

## Watching Sentinel from the dashboard

```bash
hforge dashboard
```

The dashboard now includes a full Sentinel section with all eight panels:

- **Status header** — daemon running yes/no, panic-stop flag, last-hour
  monitor-run / action-proposed / panic-toggle counts, totals.
- **World Feed** — raw observations newest-first with severity badge, source,
  occurrence count, confidence.
- **Signals** — priority-sorted, severity-color-coded, suppressed signals
  shown with a strikethrough so you can see them but they're visually de-prioritized.
- **Approval Inbox** — proposed actions whose risk requires explicit human
  sign-off and don't yet have an active approval. Each row shows the full reason
  text plus a copy-paste-ready CLI hint (`hforge actions approve <id> --authority Ax --expires 2h`).
- **Action Queue** — proposed and in-flight action plans with status badge,
  risk badge, step count, and the full reason text.
- **Verification Results** — newest-first per-action verification reports
  (passed / failed / partial), with each check's ✓/✗/∼ icon, command, and summary.
- **Autonomy Posture** — 4-quadrant policy snapshot: active profile (with
  requireApproval levels + deny tags), cadence ceilings, denied paths, denied commands.
  (The full per-monitor capability map from spec FR-080 is a follow-up.)
- **Agent Watchdog** — active agent runs with status badge, intervention step + count,
  paused-reason; recent intervention ledger entries newest-first; copy-paste pause/resume
  CLI hints. Empty state explains the watchdog activates once agent step types ship.
- **Side-Effect Ledger** — newest-first table of every mutation, with a
  reversible/final badge per entry.

All eight panels poll every 5 seconds via the REST endpoints
`/api/sentinel/{status,observations,signals,actions,approvals,ledger,verification,policy,watchdog}`.
The poll skips when the browser tab is hidden (Page Visibility API) so background
tabs don't hammer the local server. Click-to-approve and click-to-suppress UI is
tracked as a follow-up in [specs/017-sentinel/tasks.md](../../specs/017-sentinel/tasks.md).

## The built-in monitors

Three monitors ship by default after `hforge monitor init-defaults`:

- **`repo-drift`** (interval `5m`) — flags when key generated artifacts go
  stale relative to source files (`package.json`, lockfile, `tsconfig.json`,
  `.hforge/agent-manifest.json`). Manifest changes get severity `warning`.
- **`dependency-risk`** (interval `6h`) — reads `package.json` and walks
  `node_modules/<pkg>/package.json` to find:
  - **Deprecated dependencies** — direct deps get severity `warning`
    (classify key `deprecated_direct`); indirect deps get `notice`.
  - **Major version available** — joins against the world-monitor cache
    (`.hforge/runtime/world/cache/npm/<pkg>.json`, populated by
    `hforge world sync`). Direct deps get `notice` (classify key
    `major_direct`); indirect deps get `info`.
  Fully offline — no shellouts, no `npm audit`. Run `hforge world sync` first
  to populate the cache for the major-upgrade check.
- **`adr-drift`** (interval `1h`) — walks `docs/adrs/`, `docs/adr/`, and
  `.hforge/runtime/decisions/` for `*.md` files; parses markdown links
  (`[text](path)` and `<path.ext>`); emits `decision.drift` observations
  per ADR with broken refs. Severity escalates from `notice` (1-2 broken)
  to `warning` (3+ broken, classify key `many_broken`). Skips
  `http://`/`https://`/`mailto:`/`#` links and strips `#fragment`s.

Each monitor's YAML lives in `.hforge/monitors/` after init. Enable/disable
individually with `hforge monitor enable <id>` / `disable <id>`. Run a single
monitor with `hforge monitor once --kind <id>`.

## Watching the watchdog

The watchdog tracks per-agent-run state and intervenes when behavior turns
suspicious. The intervention ladder is `observe → warn → constrain → pause →
require_approval → terminate → rollback`; each step is monotonic (a downgrade
attempt by a future caller is silently absorbed, but the count still increments).

```bash
hforge watchdog status                      # all tracked runs + their step + count
hforge watchdog events --run <id>           # newest-last intervention ledger
hforge watchdog pause <id> --reason "..."   # records a pause intervention
hforge watchdog resume <id>                 # flips back to active
hforge watchdog explain <id>                # full history + next escalation step
```

Today the watchdog is operator-driven (you pause/resume from the CLI). When the
spec's agent step types (`invoke_agent`, `write_file`, `apply_patch`, `open_pr`)
land, the executor will register each agent run with the watchdog and feed
real-time signals (`agent.looping`, `agent.tool_failure_repeated`, etc.) into
the intervention ladder.

## Validating the install

```bash
npm run validate:sentinel
```

Runs three checks: monitor template Zod validation, policy template Zod validation
(cadence + budget shapes), and a no-inline-comment scan across all sentinel paths.
Wired into `validate:runtime-gates` so it runs before every release.

## What is *not* in this preview yet

- Step types: `invoke_agent`, `write_file`, `apply_patch`, `open_issue`, `open_pr`
- Verification check type: `agent_review` (skipped — LLM budget defaults to 0)
- Rollback strategies: `reverse_patch`, `restore_snapshot`
- CI Failure Monitor (needs the GitHub adapter; Dependency Risk and ADR Drift now ship by default)
- Click-to-approve / click-to-suppress UI in the dashboard
- World adapters: GitHub releases, GitHub Security Advisories

These are tracked in [specs/017-sentinel/tasks.md](../../specs/017-sentinel/tasks.md)
under phases US2 through US7 + Polish.

## Troubleshooting

**"No monitors found"**
Run `hforge monitor init-defaults` to copy the bundled samples.

**"Type errors when I edit a YAML file"**
Sentinel validates each file when it loads. The error message tells
you which file and which field is wrong. Run `hforge monitor list` to
see the same diagnostic.

**"I want to delete everything Sentinel wrote"**
Remove the `.hforge/runtime/observations/`,
`.hforge/runtime/signals/` (when present), and
`.hforge/runtime/actions/` (when present) folders. Your config in
`.hforge/monitors/` and `.hforge/runtime/policies/` stays put.
