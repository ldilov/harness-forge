# Skill Authoring Contract

Harness Forge skills must behave like reusable operating systems, not short
prompt fragments.

## Required sections

- trigger conditions
- first inspection order
- workflow stages
- output contract
- validation path
- failure modes
- escalation rules

## Authoring rules

- start from promoted `rules/common/` and the most specific language or
  framework rules available
- keep the first inspection paths concrete so an agent can recover quickly in an
  unfamiliar repository
- make outputs deterministic enough to review later
- include references when the skill depends on deeper heuristics or checklists
- if a skill is safety-sensitive, call out explicit stop conditions

## Good operational artifact examples

- onboarding summary with repo map, risks, and next actions
- release report with pass or fail gates and blocking findings
- security scan summary with attack surface, risk rating, and remediation queue

## Anti-patterns

- skills that only say "analyze the repo" without inspection order
- skills that have no verification or escalation step
- skills that cannot explain what output they produce
