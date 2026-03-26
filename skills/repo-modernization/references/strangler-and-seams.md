# Strangler And Seams

## Incremental replacement bias

The strangler approach beats a rewrite impulse in most real repos because it creates a new path around the old system gradually, delivering value and reducing risk before the old path disappears.

## Good seams

- stable external contracts such as APIs, events, or file formats
- packages or modules with clear ownership boundaries
- adapters around data access, external services, or legacy framework glue
- anti-corruption layers that let new code stop depending on old internals directly

## Bad seams

- boundaries defined only by folder names without behavioral ownership
- fake service splits that keep one shared database and shared runtime assumptions untouched
- "temporary" duplication with no cleanup trigger or stop condition
