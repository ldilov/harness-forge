# Ecosystem Guide

## Module systems

Node has both CommonJS and ECMAScript modules. The package `type` field and file extensions such as `.mjs` and `.cjs` decide how source is interpreted.

## Packaging

For modern packages, `exports` is the preferred way to define the public interface. It supports multiple entrypoints and encapsulates internal files. Adding it later can be a breaking change if consumers relied on private paths.

## Tooling signals

- ESLint remains the baseline linter for JS projects
- Vitest is a strong default when the repo is already Vite-oriented
- browser apps often hide runtime assumptions inside bundler config rather than source files

## Semver note

Public entrypoints, file paths, default vs named export shape, and env-variable behavior are consumer-facing contracts even when the repo does not describe them formally.
