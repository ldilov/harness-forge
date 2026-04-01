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
- treat `.agents/skills/` wrappers as discovery-only surfaces that point back
  to canonical `skills/` contracts instead of repeating pack summaries
- prefer registry-owned or generated metadata for repetitive wrapper, catalog,
  and workflow text instead of hand-maintaining parallel pack descriptions
- keep the first inspection paths concrete so an agent can recover quickly in an
  unfamiliar repository
- make outputs deterministic enough to review later
- include references when the skill depends on deeper heuristics or checklists
- if a skill is safety-sensitive, call out explicit stop conditions

## Imported skill packs

- inventory single-skill ports such as `engineering-assistant` in
  `manifests/catalog/engineering-assistant-import-inventory.json`
- keep maintainer-facing provenance for single-skill ports in
  `docs/authoring/engineering-assistant-port.md`
- inventory every imported runtime surface in
  `manifests/catalog/enhanced-skill-import-inventory.json`
- merge overlapping responsibilities into the existing canonical skill instead
  of creating duplicates
- promote a new skill only when it owns a distinct runtime responsibility that
  should remain discoverable on its own
- keep pack provenance in maintainer-facing docs such as
  `docs/authoring/enhanced-skill-import.md`, not in runtime entrypoints
- update wrappers, package-surface coverage, and validation in the same feature
  lineage so imports do not drift silently

## Good operational artifact examples

- onboarding summary with repo map, risks, and next actions
- release report with pass or fail gates and blocking findings
- security scan summary with attack surface, risk rating, and remediation queue

## Anti-patterns

- skills that only say "analyze the repo" without inspection order
- skills that have no verification or escalation step
- skills that cannot explain what output they produce
