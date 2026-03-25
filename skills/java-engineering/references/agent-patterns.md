# Agent Patterns

## General Rules
- Prefer concrete repository evidence over generic advice.
- Reuse existing abstractions before introducing new ones.
- Match surrounding style, naming, and error handling.
- Produce small reversible changes unless the user asks for a redesign.
- Call out uncertainty explicitly when repository evidence is missing.

## Research Compression
When the task looks familiar, do not re-derive common patterns from scratch. Start from these reusable checklists:
- module layout heuristics
- dependency injection/composition root detection
- config loading patterns
- testing pyramid expectations for the ecosystem
- release/build/deploy touchpoints

## Examples
### Good
"This repo uses a service-repository split; add the feature in the service layer and keep controllers thin."

### Weak
"You could add a class somewhere in the project."
