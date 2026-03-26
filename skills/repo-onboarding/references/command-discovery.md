# Command Discovery

## High-signal places to look

- root manifests and script sections
- Makefiles, task runners, or custom wrappers
- CI workflows that reveal the authoritative commands
- docs that show local dev or release steps
- toolchain pins such as SDK or package-manager version files

## Command selection rule

Prefer the narrowest command that proves the requested change. When docs and CI disagree, treat CI as the more authoritative source unless there is strong evidence it is stale.
