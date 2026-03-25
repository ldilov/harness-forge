# Vite Framework Pack

Use this pack when the repository uses Vite as the primary frontend build tool.

## Primary signals

- `vite.config.*`
- `package.json` depends on `vite`

## Companion surfaces

- `lang:typescript`
- React or vanilla frontend workflows depending on the repo shape

## Validation cues

- verify local build and dev-server assumptions before changing config
- check path aliases and environment handling when build behavior changes
