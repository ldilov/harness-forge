# TypeScript Review Checklist

Use this when reviewing rules, examples, generated output, or agent guidance for TypeScript.

## Design

- Are boundaries explicit?
- Is mutable shared state minimized?
- Are framework and runtime concerns separated from domain logic?

## Testing

- Are tests behavior-focused?
- Are failure paths covered?
- Are integration boundaries tested where silent breakage is likely?

## Security

- Are secrets kept out of source and logs?
- Is untrusted input validated at the edge?
- Are risky runtime features called out and constrained?

## Documentation quality

- Do examples compile or run conceptually without missing context?
- Are framework-specific assumptions clearly labeled?
- Does the content distinguish rules from examples from optional advice?
