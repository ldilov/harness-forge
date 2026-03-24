# Contract: Template and Workflow Catalog

## Purpose

Define the contract for shipped task templates, workflow templates, and the
validation utilities they reference.

## Canonical authoring format

- Markdown with YAML front matter is the canonical source format.
- Task templates live under `templates/tasks/`.
- Workflow templates live under `templates/workflows/`.

## Required task-template metadata

- `id`
- `kind`
- `title`
- `category`
- `status`
- `version`
- `supported_targets`
- `supported_languages`
- `recommended_agents`
- `recommended_commands`
- `owner`
- `generated`

## Required workflow-template metadata

- `id`
- `kind`
- `title`
- `mode`
- `status`
- `version`
- `supported_targets`
- `supported_languages`
- `default_agents`
- `owner`
- `generated`

## Required task-template sections

- `## Purpose`
- `## When to Use`
- `## Inputs`
- `## Optional Inputs`
- `## Constraints`
- `## Expected Outputs`
- `## Acceptance Criteria`
- `## Quality Gates`
- `## Suggested Workflow`
- `## Related Commands`
- `## Related Agents`
- `## Examples`

## Required workflow-template sections

- `## Purpose`
- `## When to Use`
- `## Entry Conditions`
- `## Workflow Stages`
- `## Handoff Contracts`
- `## Exit Conditions`
- `## Failure Modes`
- `## Escalation Rules`
- `## Artifacts Produced`
- `## Human Approval Points`
- `## Examples`

## Required workflow stage fields

- `**Goal**`
- `**Consumes**`
- `**Produces**`
- `**Exit Criteria**`
- `**Failure Conditions**`
- `**Next Trigger**`

## Validator references

Templates and workflows may reference these shipped validators:

- `scripts/templates/shell/check-template-frontmatter.sh`
- `scripts/templates/shell/check-template-links.sh`
- `scripts/templates/shell/list-missing-template-sections.sh`
- `scripts/templates/shell/generate-template-index.sh`
- `scripts/templates/shell/verify-workflow-contracts.sh`
- `scripts/templates/powershell/Check-TemplateFrontmatter.ps1`
- `scripts/templates/powershell/Check-TemplateLinks.ps1`
- `scripts/templates/powershell/Get-MissingTemplateSections.ps1`
- `scripts/templates/powershell/New-TemplateIndex.ps1`
- `scripts/templates/powershell/Test-WorkflowContracts.ps1`

## Discovery guarantees

- Templates must declare supported targets and languages clearly enough for
  assistants to recommend them.
- Referenced commands, agents, workflows, and validators must resolve to shipped
  assets.
- Validation failure output must identify the exact template or stage contract
  that failed.
