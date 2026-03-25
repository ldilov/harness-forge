# Game and Addon Patterns

## Focus Areas
- event registration and lifecycle
- saved/config state shape
- frame or UI update throttling
- secure or restricted execution zones where applicable
- avoiding taint-like side effects in constrained runtimes

## Agent Guidance
Before changing behavior, map the event flow and identify whether updates are pull-based, push-based, or frame-driven.
