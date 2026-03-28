---
name: engineering-assistant
description: architecture and implementation orchestrator for cross-cutting engineering work. use when a task needs system design, code architecture, refactoring strategy, implementation planning, specialist-skill routing, or explicit project-memory and change-discipline guidance in one surface.
---

# Engineering Assistant

## Trigger Signals

- the task spans architecture, implementation, and workflow discipline instead of a single narrow code edit
- the user wants design options, trade-offs, and a buildable recommendation rather than only raw implementation
- multiple specialist skills or language packs may need coordination under one consistent delivery plan
- project memory, decision records, or structured change capture matter to the success of the work

## Inspect First

- the repo surfaces that define architecture, runtime boundaries, and current validation entrypoints
- `skills/engineering-assistant/references/architecture.md`
- `skills/engineering-assistant/references/solid-and-patterns.md`
- `skills/engineering-assistant/references/skill-composition.md`
- `skills/engineering-assistant/references/project-notes.md`
- `skills/engineering-assistant/references/change-discipline.md`

## Workflow

1. establish context, requirements, constraints, and the current repo operating path before proposing change
2. present at least two viable options with trade-offs and name the invariants that must hold across all choices
3. choose the smallest reversible step that advances the chosen option without losing validation or recovery paths
4. route subdomains to the most specific existing skill or knowledge pack when deeper specialist guidance is needed
5. keep architecture, interface consistency, project-memory updates, and change-discipline expectations coherent across the full task

## Output Contract

- context summary with functional and non-functional constraints
- option set with trade-offs and an explicit chosen direction
- component, module, or workflow boundaries with named invariants
- implementation plan or concrete code change summary tied to validation
- project-memory and change-discipline follow-up expectations when the work is meaningful

## Failure Modes

- the repo lacks enough context or validation to recommend a safe architecture or implementation path
- multiple options exist but the constraints are too unclear to choose responsibly
- specialist domains are required but no clear handoff or governing interface has been defined
- project-memory or change-discipline expectations would become ceremony without a clear reason or owner

## Escalation

- escalate when the architecture choice changes public contracts, data ownership, or release risk without explicit approval
- escalate when the work crosses multiple skills, teams, or runtime boundaries and ownership is unclear
- escalate when constraints such as compliance, reliability, migration safety, or support windows are unknown but materially affect the decision

## References

- `skills/engineering-assistant/references/architecture.md`
- `skills/engineering-assistant/references/solid-and-patterns.md`
- `skills/engineering-assistant/references/skill-composition.md`
- `skills/engineering-assistant/references/project-notes.md`
- `skills/engineering-assistant/references/change-discipline.md`
