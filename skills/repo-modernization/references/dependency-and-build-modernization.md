# Dependency And Build Modernization

## Safe sequence

1. pin and document the current toolchain
2. repair CI and local reproducibility
3. update one framework or package family at a time
4. keep build output and artifact shape stable where consumers depend on them
5. only then change architecture surfaces that rely on the updated toolchain

## Common modernization wins

- centralize version management where the ecosystem supports it
- automate dependency update intake and triage
- collapse duplicate scripts and inconsistent build wrappers
- remove abandoned generators or build steps after proving nothing consumes them
