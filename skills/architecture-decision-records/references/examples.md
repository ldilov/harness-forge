# Examples

## Good ADR title

Adopt incremental schema expand-and-contract for multi-release database changes

## Weak ADR title

Database notes

## Good consequence section

- enables rolling deploys across mixed application versions
- increases short-term write-path complexity because dual-write remains until the contract phase
- requires migration telemetry before old columns can be removed
