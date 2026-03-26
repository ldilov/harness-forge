# Debugging Playbook

## Module not found or wrong default export

Inspect `package.json` `type`, `exports`, file extensions, and bundler aliasing first. Many JS bugs are resolution bugs, not logic bugs.

## Works in dev, fails in production bundle

Check tree shaking, side-effect markers, environment replacement, dynamic imports, and whether code depends on path or process behavior that the bundle changes.

## Browser-only failure

Look for Node builtins, server-only secrets, hydration order, or DOM timing assumptions leaking into shared modules.

## Node-only failure

Check environment loading, working-directory assumptions, spawn paths, ESM/CJS interop, and whether tests run transpiled code differently from production.
