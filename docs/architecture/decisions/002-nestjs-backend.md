# ADR-002: NestJS for Backend API

## Status

Accepted

## Context

We need a structured backend framework that supports dependency injection, modularity, and integrates well with TypeScript for building a REST API with WebSocket support.

## Decision

Use NestJS with Express adapter as the backend framework.

## Consequences

- **Positive:** Built-in DI, modular architecture, excellent TypeScript support
- **Positive:** Rich ecosystem (Swagger, WebSockets, BullMQ, Passport)
- **Negative:** Decorator-heavy, can feel over-engineered for simple endpoints
- **Negative:** Larger bundle size compared to minimal frameworks like Fastify standalone
