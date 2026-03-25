# Lua Language Idioms

## Core Rules
- Tables are the primary composite structure; be deliberate about array-like vs map-like usage.
- Localize frequently used globals for performance/readability when the codebase style matches.
- Avoid accidental global writes.
- Prefer small explicit modules over sprawling files with hidden shared state.

## Common Patterns
- module table returned from file
- metatable-based object style only when warranted
- callback registration through event tables or framework APIs
