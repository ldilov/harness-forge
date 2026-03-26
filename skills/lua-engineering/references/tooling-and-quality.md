# Tooling And Quality

## Good defaults when the repo supports them

- StyLua for formatting
- LuaLS for diagnostics, annotations, and editor support
- Busted for unit tests
- host-native smoke checks for lifecycle-sensitive behavior

## Review checklist

- confirm runtime version
- confirm host API assumptions
- check for accidental globals
- verify coroutine or callback ordering
- validate with the real host entrypoint when integration matters
