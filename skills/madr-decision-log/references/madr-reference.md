# MADR Reference Notes

## Default stance

Use the MADR style as a practical, text-first way to capture architectural decisions in version control. Favor readability in raw Markdown and stability over time.

## Recommended conventions

- Store ADRs under `docs/decisions/`
- Use Markdown files with four-digit, zero-padded numbers and dashed filenames
- Keep metadata in YAML front matter when metadata is needed
- Prefer these body sections:
  - `Context and Problem Statement`
  - `Decision Drivers`
  - `Considered Options`
  - `Decision Outcome`
  - `Consequences`
  - `Confirmation`
  - `Pros and Cons of the Options`
  - `More Information`
- Repeat full option names rather than introducing symbolic identifiers
- Use `Confirmation` instead of `Validation` or `Verification`
- Keep one ADR focused on one decision

## Metadata guidance

Common keys:

```yaml
status: accepted
date: 2026-03-30
decision-makers:
  - platform team
consulted:
  - security
informed:
  - engineering
```

Optional project-specific keys may be added if the repository already uses them, for example `category`, `supersedes`, or `tags`. Do not invent extra keys unless they clearly help the user.

## Writing guidance

### Good titles

- `Adopt PostgreSQL logical replication for tenant migration`
- `Use protobuf schemas for internal event contracts`
- `Move feature flag evaluation to edge workers`

### Weak titles

- `Database ADR`
- `Decision on events`
- `Architecture`

### Good consequences

- specific
- observable
- balanced across positive and negative effects
- connected to decision drivers

### Weak consequences

- generic praise
- repeated rationale from the outcome section
- implementation tasks disguised as consequences

## Choosing detail level

Use the full template when:

- there are multiple serious options
- the decision has long-lived impact
- the team needs auditability or onboarding value
- the decision will likely be revisited later

Use the minimal variant only when:

- the decision is small and obvious
- the repository uses intentionally terse ADRs
- the user explicitly asks for brevity
