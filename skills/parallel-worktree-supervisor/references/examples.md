# Examples

## Good split

- track 1: add shared API contract and fixtures
- track 2: provider implementation against the new contract
- track 3: consumer UI updates after the provider contract lands
- merge order: 1, then 2 and 3 as dependencies clear

## Bad split

- every track edits the same root config, migration, and shared schema file
- one track cannot validate until all others are merged
- result: do not parallelize; sequence the work instead
