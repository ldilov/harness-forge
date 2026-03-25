# tsconfig and Build

## Check First
- module system
- target/lib
- path aliases
- declaration emit expectations
- isolatedModules / composite / project references

## Monorepo Guidance
- use project references when the repo already does
- avoid importing from package internals bypassing public APIs
- keep generated output out of source directories
