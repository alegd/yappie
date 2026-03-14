# ADR-003: OpenAI for Audio Processing and Ticket Generation

## Status

Accepted

## Context

Core feature: transcribe audio recordings and generate structured Jira tickets. We need reliable speech-to-text and language model capabilities.

## Decision

Use OpenAI Whisper for transcription and GPT-4o for task decomposition and ticket generation.

## Consequences

- **Positive:** Industry-leading transcription accuracy, structured JSON output via function calling
- **Positive:** Single vendor for both STT and LLM reduces integration complexity
- **Negative:** External API dependency, cost per request, rate limits
- **Negative:** Vendor lock-in; mitigated by adapter pattern in AIService
