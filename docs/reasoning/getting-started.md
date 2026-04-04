# Semiformal Reasoning Getting Started

## Choose a mode

1. Lite
   - Use for low-risk exploration and quick repo answers.
   - Required artifacts: core contract + short exploration log.
2. Standard
   - Use for normal feature/fix/refactor work.
   - Required artifacts: core contract + exploration log + one relevant certificate.
3. Deep
   - Use for correctness-sensitive, high-impact, or ambiguous decisions.
   - Required artifacts: full exploration log + task-specific certificate + unresolved assumptions + explicit ship/no-ship posture.

## First execution path

1. Define task and decision in the core contract.
2. Capture hypothesis-led exploration before reading each new file.
3. Select certificate using the task shape matrix.
4. Run alternative-hypothesis check.
5. Issue formal conclusion with evidence completeness.

## Escalation triggers

Escalate to a heavier mode when:

- multiple plausible explanations remain
- hidden semantics affect outcome
- review or merge depends on the conclusion
- counterexample risk remains credible

## Canonical paths

- Templates: `.hforge/templates/reasoning/`
- Bridges: `templates/reasoning/`
- Guidance: `docs/reasoning/`
