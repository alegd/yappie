# ADR-007: Test-Driven Development (TDD)

## Status

Accepted

## Context

Quality and reliability are critical for a project that generates tickets from audio. We need a methodology that ensures comprehensive test coverage from the start.

## Decision

Adopt strict TDD (Red-Green-Refactor) for all backend services. Minimum 80% coverage enforced in CI.

## Consequences

- **Positive:** High confidence in refactoring, documentation through tests
- **Positive:** Coverage thresholds prevent regression, MSW enables reliable API mocking
- **Negative:** Slower initial development velocity
- **Negative:** Requires discipline to write tests first, not after
