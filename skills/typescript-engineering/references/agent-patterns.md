# Agent Patterns

## Non-negotiables

- prefer repository evidence over generic ecosystem fashion
- protect runtime behavior even when the type system looks satisfied
- keep public exports explicit and intentional
- choose the smallest change that preserves local conventions

## Default implementation bias

- push untrusted data through validation at the boundary
- model domain states with discriminated unions or explicit tagged objects
- keep type helpers readable; favor clarity over type-level novelty
- keep async flows explicit and avoid hidden promise fan-out in request paths
- move shared contracts into a stable package only when multiple consumers already need them

## Review questions

- what is the real runtime boundary here?
- which package or module owns this contract?
- does the type change alter emitted JS, declaration output, or bundle shape?
- how will the change behave under the active module system and bundler?
