# Python Ecosystem Guide

## Default Assumptions
- Prefer Python 3.11+ idioms unless repository constraints say otherwise.
- Prefer `pyproject.toml` over legacy packaging files when the repo supports it.
- Use type hints for public APIs and non-trivial internal flows.
- Prefer `pathlib`, `dataclasses`, `enum`, and `typing` over ad hoc utility code.

## Project Shapes
### Library
- public API in a stable package root
- limited side effects at import time
- semantic versioning awareness
- docs/examples close to API

### Service
- clear composition root
- config boundary separated from domain logic
- structured logging and health probes
- dependencies injected instead of globally imported singletons

### CLI Tool
- thin entrypoint
- parsing isolated from execution
- machine-readable exit/error behavior
- support for dry-run where practical

## Packaging Heuristics
- `src/` layout is safer for libraries.
- Use extras for optional capabilities.
- Pin narrowly for applications, loosely for libraries.
- Put dev tooling config in `pyproject.toml` when available.
