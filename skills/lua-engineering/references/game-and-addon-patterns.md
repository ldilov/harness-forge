# Game And Addon Patterns

## Love2D and frame-loop code

Keep update, draw, input, and asset lifecycle concerns explicit. Avoid hidden cross-frame mutation that makes gameplay or UI bugs hard to reproduce.

## Addon or mod ecosystems

Respect host load order, config discovery, and sandbox rules. Prefer additive hooks and stable extension points over monkey-patching shared globals unless the host ecosystem already expects that pattern.

## State management

- isolate frame or tick updates
- keep save-data schema changes explicit
- document deterministic vs time-based behavior when debugging gameplay issues
