# Scripting and Modules

## Design Rules
- Prefer advanced functions for reusable automation.
- Support pipeline input intentionally.
- Separate discovery, transformation, and side effects.
- Use approved verbs and meaningful noun names.
- Prefer modules over monolithic script folders when reuse matters.

## Function Shape
- parameter validation
- begin/process/end only when pipeline semantics require it
- `SupportsShouldProcess` for destructive operations
- return objects, not formatted text, from reusable functions
