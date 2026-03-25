# Spring Patterns

## Core Guidance
- keep controllers thin
- avoid burying business logic in annotations/config classes
- treat transaction boundaries intentionally
- prefer constructor injection
- understand bean lifecycle before introducing dynamic behavior

## Persistence
- verify fetch behavior and transaction scope
- avoid exposing JPA entities directly as external contracts when it complicates evolution
