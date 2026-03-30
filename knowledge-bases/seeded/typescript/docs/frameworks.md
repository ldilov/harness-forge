# TypeScript framework and ecosystem guide

Use this file to choose the right pattern before changing code. Do not read it as generic background material; treat it as a decision guide.

## Node services

Use for APIs, workers, CLIs, and background jobs. Pair TypeScript types with runtime schema validation at all trust boundaries. Prefer explicit module-format decisions and small entrypoints.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## React

Use for UI-heavy repos and component systems. Keep props narrow, avoid giant context bags, and validate external data before it reaches UI state.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## Next.js App Router

Use for full-stack apps that benefit from server components, route handlers, and streaming. Keep server-only code out of client trees and treat caching as part of behavior, not an optimization afterthought.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## Monorepos

Use project references, workspace-aware scripts, and explicit package exports. Avoid hidden deep imports and keep build/test commands runnable from both workspace root and package scope.

### Agent prompts

- What are the runtime boundaries here?
- Which files define public contracts?
- What must be tested to prove behavior changed safely?

## Source index

- TypeScript 5.9 release notes: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-5-9.html
- TSConfig reference: https://www.typescriptlang.org/tsconfig/
- React docs: https://react.dev/
- Next.js App Router docs: https://nextjs.org/docs/app
- Next.js AI agents guide: https://nextjs.org/docs/app/guides/ai-agents
