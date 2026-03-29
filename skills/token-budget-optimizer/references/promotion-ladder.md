# Context Promotion Ladder

Use this ladder to decide what belongs in active prompt context.

## Level 1: Discovery only

- wrappers in `.agents/skills/`
- short command docs
- repo root guidance bridges

Use these to choose the next canonical surface quickly.

## Level 2: Canonical operating surfaces

- `.hforge/agent-manifest.json`
- `.hforge/generated/agent-command-catalog.json`
- canonical skill contracts under `.hforge/library/skills/`
- runtime indexes and repo summaries

Prefer these before reading broad product code.

## Level 3: Task-bound artifacts

- spec, plan, and task documents
- task-runtime artifacts
- decision records
- review summaries and validation outputs

Promote these when the work is already scoped and historical context matters.

## Level 4: Focused code evidence

- only the files needed to resolve an active question
- only the specific function, module, schema, or config block that matters

Do not jump here until the earlier levels stop being enough.

## Level 5: Broad exploratory scans

- full repo walks
- many-file comparisons
- recursive investigation sessions

Use these only when lower-cost surfaces cannot answer the question safely.
