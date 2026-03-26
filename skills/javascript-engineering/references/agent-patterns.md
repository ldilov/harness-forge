# Agent Patterns

## Non-negotiables

- reason from the real runtime, not from file extensions alone
- treat package contract changes as semver-sensitive until proven otherwise
- keep global side effects explicit and localize them to startup or setup modules
- prefer small reversible edits over sweeping rewrites

## Default implementation bias

- use JSDoc or lightweight schema validation when contracts need clarity
- keep framework glue separate from reusable core logic
- centralize environment access and process-level side effects
- make async startup and shutdown behavior explicit in services and CLIs

## Review questions

- where does this code actually run?
- which entrypoint or package surface owns the behavior?
- what consumer contracts might break if imports or exports move?
- what test or smoke command proves the runtime path still works?
