# Translation vs Emulation

Harness Forge distinguishes between support that is:

- `native`: the target ships a first-class runtime surface
- `translated`: portable scripts or guidance can bridge the gap
- `emulated`: behavior can be approximated, but not natively
- `documentation-only`: only docs and manifests are portable

Use these labels when describing degraded target support so operators know what
kind of fallback they are relying on.
