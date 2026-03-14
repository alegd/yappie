# ADR-001: Turborepo Monorepo

## Status

Accepted

## Context

Yappie consists of multiple applications (API, Web, Mobile) sharing code (types, utilities, configurations). We need a build system that handles dependencies between packages efficiently.

## Decision

Use Turborepo with pnpm workspaces as the monorepo build system.

## Consequences

- **Positive:** Incremental builds with caching, parallel task execution, shared configs via packages
- **Positive:** Single repo for all apps simplifies CI/CD and code sharing
- **Negative:** Learning curve for contributors unfamiliar with monorepo tooling
- **Negative:** pnpm-lock.yaml conflicts on parallel branches
