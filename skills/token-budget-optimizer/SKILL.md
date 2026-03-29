---
name: token-budget-optimizer
description: compact context, reuse existing runtime artifacts, and choose the smallest authoritative surface before expanding prompt history. use when the task is growing large, when earlier repo intelligence already exists, or when repeated rescans would waste tokens without adding new evidence.
---

# Token Budget Optimizer

## Trigger Signals

- the prompt is getting long and earlier repo context is being repeated
- the repo already has `AGENTS.md`, `.hforge/runtime/`, specs, plans, or review artifacts that can answer the next question
- the task is investigative or iterative enough that careless re-reading will waste tokens
- the agent is about to scan broad directory trees before checking existing runtime summaries

## Inspect First

- `.hforge/agent-manifest.json` and `.hforge/generated/agent-command-catalog.json`
- `.hforge/runtime/index.json`, `.hforge/runtime/repo/repo-map.json`, and `.hforge/runtime/repo/recommendations.json`
- active guidance bridges such as `AGENTS.md`, `CLAUDE.md`, and `.agents/skills/<skill>/SKILL.md`
- any existing `spec.md`, `plan.md`, `tasks.md`, review output, or decision record relevant to the current task
- `skills/token-budget-optimizer/scripts/inspect_token_surfaces.py` when a deterministic token-surface audit would help

## Workflow

1. identify the concrete question the agent must answer next and avoid reading more than that question requires
2. rank existing surfaces by authority, freshness, and cost, preferring hidden runtime summaries and durable artifacts before broad source scans
3. reuse prior findings, repo maps, decision records, and task artifacts instead of re-deriving them from scratch
4. compact the active context into a short working set: current goal, authoritative surfaces, open questions, and the next small evidence step
5. escalate to deeper reads only when the compacted working set cannot answer the task safely

## Output Contract

- a short context budget summary with the current goal and the smallest authoritative surfaces to keep loaded
- a reuse plan listing which runtime artifacts, docs, or task artifacts should be trusted instead of reread
- compaction candidates describing what can be summarized once and then dropped from active context
- unresolved gaps that still require new evidence or deeper file reads

## Failure Modes

- runtime artifacts are stale, missing, or do not cover the active question
- the task is genuinely novel and prior summaries are no longer trustworthy
- the agent mistakes low-cost summaries for high-authority truth and skips required verification

## Escalation

- escalate when the repo has conflicting guidance across `AGENTS.md`, runtime summaries, and product code
- escalate when token saving would hide a risky detail such as a release gate, migration step, or support constraint
- escalate when there is no reliable compact surface and the agent must build a new authoritative summary first

## References

- `skills/token-budget-optimizer/references/audit-dimensions.md`
- `skills/token-budget-optimizer/references/promotion-ladder.md`
- `skills/token-budget-optimizer/references/scoring-model.md`
- `skills/token-budget-optimizer/references/report-template.md`
- `skills/token-budget-optimizer/scripts/inspect_token_surfaces.py`
