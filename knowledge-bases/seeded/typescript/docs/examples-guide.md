# TypeScript examples guide

These examples are task playbooks, not toy snippets. Use the nearest one as the default plan scaffold.

## How to use an example

1. Select the closest scenario.
2. Copy its touched-file thinking and validation shape.
3. Adjust for the repo's framework and deployment assumptions.
4. Keep the example's anti-pattern checks in your final review.

## Available scenarios

### Node API with runtime validation

- file: `01-node-api.md`
- use when: Node services, Hono/Express/Fastify handlers, env validation, and schema-first boundaries.
- always confirm: contracts, validation, tests, and operational impact

### React component library

- file: `02-react-component-library.md`
- use when: Typed component APIs, accessibility, Storybook/test expectations, and packaging boundaries.
- always confirm: contracts, validation, tests, and operational impact

### Next.js App Router application

- file: `03-nextjs-app.md`
- use when: Server/client boundaries, data fetching, route handlers, and cache-aware mutations.
- always confirm: contracts, validation, tests, and operational impact

### Monorepo shared types and validation

- file: `04-monorepo-shared-types-and-validation.md`
- use when: Shared contracts, package exports, tsconfig references, codegen, and semver-aware changes.
- always confirm: contracts, validation, tests, and operational impact
