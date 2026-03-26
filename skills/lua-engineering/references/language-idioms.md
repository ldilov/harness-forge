# Language Idioms

## Prefer

- local scope by default
- small returned module tables
- explicit function arguments over mutable ambient state
- simple tables for data carriers and clear metamethod use only where it adds real leverage
- readable loops and guards over dense one-liners

## Use caution with

- deep metatable chains that hide behavior
- mutation of shared tables from many modules
- version-specific syntax without a runtime check
- dynamic code loading unless the repo already uses it intentionally
