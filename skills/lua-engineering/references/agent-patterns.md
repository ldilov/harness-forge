# Agent Patterns

## Non-negotiables

- confirm the runtime flavor before relying on syntax or APIs
- preserve the repo's module style unless the task explicitly calls for refactor
- keep implicit globals and side effects out of reusable code
- prefer simple table-based contracts to hidden metatable magic when clarity matters

## Default implementation bias

- return small module tables from files
- make state ownership explicit
- isolate host API access behind adapters when the logic can be tested separately
- annotate or document table shapes when the repo already uses LuaLS conventions

## Review questions

- which runtime and host executes this code?
- what event loop or callback model constrains the behavior?
- where can pure logic be separated from host glue?
- does this edit rely on LuaJIT-only or host-only behavior?
