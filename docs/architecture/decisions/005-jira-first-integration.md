# ADR-005: Jira-First Integration Strategy

## Status

Accepted

## Context

Generated tickets need to be exported to a project management tool. Jira is the most widely used tool in enterprise environments.

## Decision

Build Jira as the primary (and initially only) integration target via Atlassian OAuth 2.0.

## Consequences

- **Positive:** Covers the largest market segment, OAuth 2.0 is well-documented
- **Positive:** Validates the core workflow before expanding to other tools
- **Negative:** Jira API complexity (field mappings, project schemas vary)
- **Negative:** Other tools (Linear, GitHub Issues, Asana) deferred to future work
