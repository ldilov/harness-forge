# Tooling Signals

## Flyway and Liquibase

Treat ordered migration history as the source of truth and check whether rollback scripts or rollback metadata actually exist. Repeatable migrations, checksums, and environment drift are part of the review surface.

## Prisma

When a rename or data-preserving change is needed, prefer customizing the generated SQL instead of accepting a destructive drop-and-recreate plan. Expand-and-contract is the default safe posture for production data movement.

## EF Core

Inspect the generated migration and script output. Renames, seed changes, and default-value changes can hide data-loss or locking issues behind innocent-looking model edits.

## Atlas

Declarative diffs are powerful, but the review still has to reason about the actual engine-specific statements and rollout order.

## Online migration tools

Tools such as gh-ost can reduce MySQL lock risk, but they add requirements around cut-over, replica health, throttling, and operational supervision.
