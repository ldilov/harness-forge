# ASP.NET And EF Core

## ASP.NET Core

- validate untrusted input at the edge and map failures to consistent HTTP responses
- keep endpoint code focused on routing, auth, validation, and result mapping
- make serialization, casing, and null-handling decisions explicit when contracts matter
- when auth or middleware changes, review the full request pipeline rather than one handler in isolation

## EF Core query and model guidance

- use the smallest query shape that satisfies the caller
- prefer explicit includes or projections over accidental lazy graph loading
- use no-tracking reads where mutation is not required
- be careful with client-side evaluation, large tracked graphs, and hidden N+1 patterns

## Migration guidance

- inspect generated migrations for rename-vs-drop mistakes and unexpected data loss
- prefer production-reviewed SQL scripts, especially for high-risk schema changes
- treat index builds, constraint validation, and large table rewrites as rollout topics, not just code topics
- verify mixed-version compatibility whenever old and new binaries may coexist during deployment
