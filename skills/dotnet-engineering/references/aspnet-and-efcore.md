# ASP.NET Core and EF Core

## ASP.NET Core
- thin controllers/endpoints
- consistent validation and problem details strategy
- middleware order matters
- structured logging with correlation identifiers where relevant

## EF Core
- avoid leaking tracked entities across layers casually
- choose eager/lazy/explicit loading intentionally
- watch query translation and N+1 behavior
- separate migrations concerns from runtime domain logic
