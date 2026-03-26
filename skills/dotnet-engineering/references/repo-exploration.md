# Repo Exploration

## Inspect these files first

- `global.json` for SDK pinning
- `Directory.Build.props` and `Directory.Build.targets` for shared compiler and analyzer rules
- `Directory.Packages.props` for central package management
- solution files and project references to map the dependency graph
- `appsettings*.json`, secrets wiring, or environment-specific configuration surfaces
- migration folders, test projects, container definitions, and deployment manifests

## Classify the repo shape

- **Single service**: one startup project plus a few supporting libraries
- **Library pack**: multiple publishable packages with test suites and sample apps
- **Distributed app**: AppHost or service-orchestration surfaces, often with shared service defaults
- **Worker or automation**: background scheduling, queue processing, or CLI execution with minimal HTTP surface
- **Legacy mixed solution**: older csproj formats, partial framework upgrades, or custom build targets

## Find the composition root

Look for one of these first:

- `Program.cs`
- `Startup.cs`
- service-registration extensions such as `AddApplication`, `AddInfrastructure`, or `ConfigureServices`
- worker bootstrap code or CLI command registration

This tells you where dependencies, configuration, and middleware are assembled. Keep new dependencies visible there unless the repo clearly centralizes them elsewhere.

## High-signal risk surfaces

- custom middleware, auth handlers, or filters
- source generators, analyzers, Roslyn-based tooling, or codegen
- EF Core migration history and database startup behavior
- background services, timers, or queue consumers
- solution-wide props files that can affect every project in one edit
- publish profiles, trimming or AOT settings, and container build stages
