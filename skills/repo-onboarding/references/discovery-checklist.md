# Discovery Checklist

## Start at the root

- README and setup docs
- manifests for package managers or language toolchains
- CI workflows and release scripts
- container or infra config
- root config files that affect the whole repo

## Then map the code

- app or service roots
- shared libraries or packages
- test roots
- generated code
- docs and design notes

## Then answer

- how do I build and test this repo?
- what are the dominant runtimes and frameworks?
- where are the risky shared seams?
- what should I inspect before making the requested change?
