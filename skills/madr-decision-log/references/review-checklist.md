# ADR Review Checklist

Use this checklist when reviewing or normalizing ADRs.

## Structure

- Front matter is valid YAML when present
- Title is specific and durable
- Required sections are present for the chosen template depth
- Heading levels are consistent
- Filename matches repository convention

## Decision quality

- Problem statement explains why a decision is needed
- Options are materially different rather than cosmetic variants
- Chosen option is named exactly and appears in the options list
- Rationale explains why the chosen option won
- Trade-offs are explicit
- Consequences are concrete
- Confirmation describes how compliance or success will be checked

## Consistency

- Option names match across all sections
- Status matches the current lifecycle state
- Date reflects latest meaningful update when the repository uses that rule
- Related ADR links are present where supersession or dependency exists
- Repository numbering and category rules are preserved

## Language

- Prefer concise, durable wording
- Avoid meeting-minutes phrasing
- Avoid vague claims like "best", "modern", or "more scalable" without context
- Keep the document understandable for an engineer who joins months later
