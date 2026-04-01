# Framework Packs

Framework packs extend language packs with higher-signal repo detection and
workflow cues.

## First framework wave

- `react`
- `vite`
- `express`
- `fastapi`
- `django`
- `spring-boot`
- `aspnet-core`
- `gin`
- `ktor`
- `symfony`
- `nextjs`
- `laravel`

Each framework pack points back to a base language pack and exposes detection
signals in `manifests/catalog/framework-assets.json`.

Framework overlays are hybrid ownership surfaces: they add higher-signal
specialization on top of a base language pack, but they do not become a second
owner of the shared baseline rules already authored under `rules/`.
