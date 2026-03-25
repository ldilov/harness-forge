# FastAPI Framework Pack

Use this pack when the repository is a Python API or service built with FastAPI.

## Primary signals

- `pyproject.toml` or `requirements.txt` references `fastapi`
- app modules create `FastAPI(...)`

## Companion surfaces

- `lang:python`
- API contract and release-readiness review paths

## Validation cues

- confirm response models, dependency injection, and async boundaries still hold
- verify API tests and startup wiring after endpoint changes
