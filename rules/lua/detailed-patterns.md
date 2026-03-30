# Lua Detailed Patterns

## Promote

- explicit boundary validation
- thin host adapters
- pure domain or transformation modules where possible
- deliberate mapping between transport, persistence, and domain models
- composition roots that make dependencies visible

## Avoid

- framework objects flowing deep into business logic
- utility modules that become hidden dumping grounds
- shared mutable state with implicit ownership
- copy-pasted boundary code with slightly different rules
