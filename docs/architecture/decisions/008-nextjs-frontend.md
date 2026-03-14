# ADR-008: Next.js 16 for Frontend

## Status

Accepted

## Context

We need a React framework that supports server-side rendering, static generation, and modern React features including React Compiler.

## Decision

Use Next.js 16 with App Router, Turbopack, Tailwind CSS 4, and React Compiler.

## Consequences

- **Positive:** Turbopack stable by default, React Compiler eliminates manual memoization
- **Positive:** App Router with Server Components reduces client-side JavaScript
- **Negative:** Rapid Next.js release cycle may require frequent updates
- **Negative:** React Compiler is relatively new, debugging optimized code may be harder
