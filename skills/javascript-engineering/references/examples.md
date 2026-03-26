# Examples

## Fix a package export bug

1. inspect `package.json` entrypoints and file extensions
2. confirm how consumers import the package today
3. adjust the smallest public surface needed
4. run the real consumer or smoke path after the change

## Fix a browser and server boundary bug

1. identify where shared code touches runtime-specific APIs
2. split the boundary or inject the dependency
3. validate both browser and server entrypoints
4. confirm the bundle or SSR build still passes
