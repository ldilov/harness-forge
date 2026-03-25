# Examples

## Example: Add service method with transactional update
- validate request at boundary
- orchestrate in service layer
- update repository logic with clear transaction semantics
- add repository/integration coverage

## Example: Debug startup failure
- inspect auto-configuration, bean dependency cycle, missing properties, profile assumptions
- narrow to minimal failing context test if possible

## Example: Refactor utility class sprawl
- move behavior closer to domain or adapter ownership
- reduce static helper accumulation
