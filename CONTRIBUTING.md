# Contributing to Yappie

## Getting Started

1. Fork the repo and clone it
2. Run `pnpm install`
3. Start services: `docker compose up -d postgres redis`
4. Copy `.env.example` to `.env` and fill in your values
5. Run `pnpm dev`

## Development Workflow

### TDD (Red-Green-Refactor)

We follow strict TDD for all backend services:

1. **RED:** Write a failing test that describes the expected behavior
2. **GREEN:** Write the minimum code to make the test pass
3. **REFACTOR:** Clean up the code while keeping tests green

Coverage minimum is **80%** — PRs that drop below this threshold are rejected by CI.

### Branch Naming

Create a branch per Jira ticket:

```
feature/YAP-XX   # New features
fix/YAP-XX       # Bug fixes
docs/YAP-XX      # Documentation
```

### Commit Convention

We use [Conventional Commits](https://www.conventionalcommits.org/):

```
feat: add audio upload endpoint
fix: handle expired refresh tokens
docs: update API documentation
test: add auth service integration tests
refactor: extract token factory utility
chore: update dependencies
```

Include the Jira ticket key in the commit body:

```
feat: add audio upload endpoint

YAP-28
```

### Pre-commit Hooks

Husky runs lint-staged on every commit:

- ESLint with auto-fix on `.ts/.tsx/.js/.jsx`
- Prettier formatting on all supported files

### Pull Requests

- One PR per Jira ticket
- All CI checks must pass (lint, type-check, test with coverage, build)
- Keep PRs focused and small

## Architecture

See [docs/architecture/decisions/](docs/architecture/decisions/) for Architecture Decision Records.
