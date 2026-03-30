---
id: research-to-implementation-brief
kind: task-template
title: Research to Implementation Brief
summary: Convert exploration into a smallest-safe experiment or implementation path with explicit unknowns and proof points.
category: planning
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
recommended_agents:
  - planner
recommended_commands:
  - plan
  - test
owner: core
generated: false
---

## Purpose

Turn research, spike work, or architectural exploration into a concrete next
step that can be implemented, validated, and reviewed.

## When to Use

Use when the team has enough evidence to stop exploring but not enough structure
to begin coding confidently.

## Inputs

- research notes or benchmark results
- competing options or candidate approaches
- constraints discovered during exploration

## Optional Inputs

- prototype output
- cost estimates
- stakeholder feedback

## Constraints

- capture the conclusion, not the full research diary
- separate known facts from open questions
- prefer the smallest safe experiment when uncertainty is still material

## Expected Outputs

- recommended path forward
- unresolved unknowns
- proposed first implementation slice
- evidence needed to confirm the recommendation

## Acceptance Criteria

- the brief explains why the chosen path beat the alternatives
- the first implementation slice is concrete and reviewable
- unknowns that still matter are explicit

## Quality Gates

- the recommendation states what would invalidate it
- research conclusions are tied to actionable work, not generic insight
- follow-up validation is defined before implementation starts

## Validation Tools

- `scripts/templates/shell/check-template-frontmatter.sh`
- `scripts/templates/powershell/Check-TemplateFrontmatter.ps1`
- `scripts/templates/config/required-sections.json`

## Suggested Workflow

Use `implement-change` after this brief is accepted.

## Related Commands

- `plan`
- `test`

## Related Agents

- `planner`

## Examples

- convert a caching spike into a staged production implementation plan
- turn build-tool research into a concrete migration starter slice

## Working Template

### What is changing?

- recommended implementation slice:
- alternatives considered:

### Why is it changing?

- research conclusion:
- constraints or evidence that drove the recommendation:

### What must remain true?

- assumptions that the implementation must respect:
- compatibility or runtime constraints carried forward:

### What could break?

- unknowns still unresolved:
- biggest downside if the recommendation is wrong:

### How will we know it works?

- first proof point:
- validation milestone:
- criteria to continue, pause, or revise:

### How do we roll it back?

- fallback option if the chosen path fails:
- way to stop after the first slice without damaging the system:

### What should future engineers remember?

- strongest evidence from the research:
- why rejected options lost:
- follow-up research still worth doing later:
