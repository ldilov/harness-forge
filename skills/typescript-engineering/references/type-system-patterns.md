# Type System Patterns

## Prefer these patterns

- discriminated unions for stateful workflows
- branded or nominal wrappers for IDs and opaque values when plain strings are too easy to mix up
- narrow function inputs and rich return types over giant parameter bags
- explicit `Result`-like objects when failure modes matter to callers
- exhaustive switching on tagged unions for business-state handling

## Use caution with

- deeply nested conditional types that obscure intent
- broad `any` or blanket assertion casts near critical logic
- ambient global augmentation unless the repo already relies on it heavily
- utility types that hide required vs optional field semantics

## Contract rule

Static types describe developer intent. Runtime checks protect real inputs. Use both where trust boundaries exist.
