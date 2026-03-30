# Script module

## When to use

Use this playbook when the task is primarily about: Public/private function split, module manifest boundaries, help metadata, and output contract stability.

## First questions

- What script, function, or manifest defines the public contract?
- Which inputs come from user parameters, the pipeline, remoting, environment variables, or external tools?
- Which steps must stay safe under repeat execution?
- What is the cheapest end-to-end verification path that still proves behavior?

## Typical file touch pattern

- entry script or exported function
- module/private helper
- manifest or parameter contract
- Pester tests near the changed seam
- docs or examples if operator behavior changed

## Recommended sequence

1. Read `docs/overview.md` and `docs/frameworks.md`.
2. Read `docs/examples-guide.md` and choose the closest scenario before editing broadly.
3. Inspect the public boundary first: parameters, output objects, exit codes, and remoting behavior.
4. Add or tighten validation at ingress.
5. Preserve object-first output and avoid string-only contracts unless the command is intentionally human-facing.
6. Verify the operational path, not only internal helpers.

## Anti-patterns

- widening public outputs accidentally
- silently changing exit-code semantics
- mixing host-specific glue with reusable command logic
- assuming remoting, elevation, or module-loading behavior without proving it

## Validation path

- Pester tests
- `-WhatIf` or `SupportsShouldProcess` behavior when applicable
- non-interactive smoke run
- stderr / exit-code review
- docs/help update if command behavior changed

## Handoff note

Summarize what contract changed, what stayed stable, how it was validated, and any operator follow-up risk.
