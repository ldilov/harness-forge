# Java Detailed Coding Style

## Style goals

- clarity over cleverness
- explicit boundary types and contracts
- local reasoning before framework magic
- defaults that make unsafe behavior visible quickly

## Guidance

- prefer small modules with one primary responsibility
- keep public APIs explicit and documented by type or shape
- make invalid states hard to express
- avoid hidden side effects in constructors, module top-level code, or component render paths
- prefer names that reflect the business or runtime responsibility, not only the implementation detail
