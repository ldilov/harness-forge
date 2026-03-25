# Frontend and Backend Patterns

## Frontend
- colocate UI with view-specific state, not cross-cutting domain rules
- use derived state rather than duplicated state
- model async request states explicitly

## Backend
- treat runtime validation and static typing as complementary
- define API schema close to transport boundary
- avoid leaking ORM types across service layers
