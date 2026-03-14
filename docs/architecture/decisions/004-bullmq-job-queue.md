# ADR-004: BullMQ for Job Queue Processing

## Status

Accepted

## Context

Audio processing pipeline (transcription + decomposition + ticket generation) is long-running and should not block HTTP requests. We need reliable async job processing with retry support.

## Decision

Use BullMQ with Redis as the job queue for the audio processing pipeline.

## Consequences

- **Positive:** Redis-backed reliability, automatic retries, dead letter queues
- **Positive:** Progress tracking via events, integrates natively with NestJS
- **Negative:** Requires Redis infrastructure
- **Negative:** Job debugging requires Redis monitoring tools
