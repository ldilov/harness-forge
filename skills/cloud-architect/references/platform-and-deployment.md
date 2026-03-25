# Platform and Deployment

## Compute Options
- containers for portability and controlled runtime
- serverless for bursty/event-driven workloads with operational simplicity
- VMs when OS/runtime control is essential
- managed platforms when reducing operational burden is the main goal

## Deployment Guidance
- immutable deployments preferred
- progressive rollout where risk warrants it
- separate build artifact creation from environment configuration
- health checks and rollback criteria must be explicit
