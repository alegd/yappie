# Yappie — Project Guidelines

## Overview

Yappie is a monorepo (Turborepo + pnpm) that turns audio recordings into Jira tickets using AI. The project consists of:

- `apps/api` — NestJS backend (REST API + WebSocket + BullMQ)
- `apps/web` — Next.js 16 frontend (App Router + React Compiler)
- `apps/mobile` — React Native / Expo (future)
- `packages/shared` — Shared types and utilities
- `packages/config` — ESLint, TypeScript, Vitest configs

## Tech Stack

- **Backend:** NestJS 11, Prisma 7 (PrismaPg adapter), PostgreSQL 16, Redis 7, BullMQ, OpenAI
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, Zustand, Lucide Icons
- **Testing:** Vitest 4, Coverage threshold 80%
- **Node:** 22+ (pinned via .nvmrc)

## Database

Schema is at `apps/api/prisma/schema.prisma`. Use it to understand models and relationships.

---

## General TypeScript Guidelines

### Basic Principles

- Use English for all code and documentation.
- Always declare types for variables, parameters, and return values. Avoid `any`.
- One export per file (prefer named exports).
- Use JSDoc only for public API methods that need clarification. Don't over-document obvious code.

### Nomenclature

- **PascalCase** for classes, components, interfaces, types.
- **camelCase** for variables, functions, methods.
- **kebab-case** for files and directories (except React components which use PascalCase filename).
- **UPPERCASE** for environment variables and constants.
- Start functions with a verb: `getUser`, `createTicket`, `handleClick`.
- Boolean variables use verb prefixes: `isLoading`, `hasError`, `canDelete`.
- Use complete words, not abbreviations. Exceptions: `i/j` (loops), `err` (errors), `req/res` (middleware), `ctx` (context).

### Functions

- Short functions, single purpose, <20 lines.
- Early returns over nested conditionals.
- Prefer higher-order functions (map, filter, reduce) over loops.
- Use arrow functions for simple operations (<3 lines), named functions otherwise.
- Use RO-RO (Receive Object, Return Object) for functions with >2 parameters.

### Data

- Prefer immutability: `readonly`, `as const`.
- Don't use magic numbers — define constants.
- Encapsulate data in types/interfaces, don't abuse primitives.

### Error Handling

- Use exceptions for unexpected errors.
- Handle errors at the boundary (controllers, API client), not deep in business logic.
- Use NestJS built-in exceptions: `NotFoundException`, `BadRequestException`, etc.
- On the frontend, show user-friendly error messages and log details to console.

### Environment Variables

- **No defaults.** Every env var must be explicitly set. If missing, the app fails immediately.
- All env vars are validated with Zod in `apps/api/src/config/env.config.ts`.
- Docker Compose reads vars from the shell/environment, not from `env_file`.
- `.env.example` is the single source of truth for all required variables.

---

## Backend (NestJS) Guidelines

### Architecture

Feature-based modular monolith:

```
apps/api/src/
├── main.ts                    # Entry point (dotenv + bootstrap)
├── app.module.ts              # Root module
├── config/                    # Env validation
├── prisma/                    # PrismaService (global)
├── storage/                   # StorageAdapter interface + LocalAdapter
├── ai/                        # AIService (OpenAI integration)
├── auth/                      # Auth module (JWT, guards, decorators)
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   ├── guards/
│   ├── decorators/
│   └── dto/
├── audio/                     # Audio upload, processing pipeline
├── tickets/                   # Ticket CRUD + filters
├── projects/                  # Project CRUD + context
├── users/                     # User profile + settings
├── templates/                 # Ticket templates
├── analytics/                 # Usage event tracking
└── integrations/
    └── jira/                  # Jira OAuth + export
```

### Patterns

- **Dependency Injection:** Use NestJS DI. For non-class providers, use string tokens with `@Inject()`.
- **Global modules:** PrismaModule, StorageModule, ConfigModule are `@Global()`.
- **Guards:** JwtAuthGuard is global (APP_GUARD). Use `@Public()` decorator to bypass.
- **API versioning:** Global prefix `/api/v1`. Swagger excluded at `/api/docs`.
- **Validation:** `ValidationPipe` with `whitelist: true` on all endpoints.

### Controller Rules

- Controllers are thin — delegate to services.
- Always add `@ApiBearerAuth()` to protected controllers.
- Use proper HTTP status codes: 201 (create), 200 (success), 204 (no content), etc.

### Service Rules

- Services contain business logic.
- One service per module, focused on a single domain.
- Use Prisma for all database operations via injected `PrismaService`.

### Testing (TDD — Mandatory)

- **Write tests FIRST.** Red → Green → Refactor. No exceptions.
- Use Vitest with the shared config from `packages/config/vitest/base.ts`.
- Coverage threshold: 80% (statements, branches, functions, lines).
- Controllers and DTOs are excluded from coverage (boilerplate).
- Test file naming: `*.spec.ts` next to the source file.
- Use Arrange-Act-Assert pattern.
- Mock naming: `mockPrisma`, `mockJwt`, `mockAIService`, etc.
- Test all happy paths AND error paths (not found, unauthorized, validation).

```typescript
// Test structure
describe("ServiceName", () => {
  let service: ServiceName;
  let mockDep: ReturnType<typeof createMockDep>;

  beforeEach(() => {
    mockDep = createMockDep();
    service = new ServiceName(mockDep as never);
  });

  describe("methodName", () => {
    it("should do X when Y", async () => {
      // Arrange
      mockDep.method.mockResolvedValue(expected);
      // Act
      const result = await service.methodName(input);
      // Assert
      expect(result).toEqual(expected);
    });
  });
});
```

---

## Frontend (Next.js) Guidelines

### Architecture

Feature-based structure:

```
apps/web/src/
├── app/                       # Routes ONLY (thin pages)
│   ├── layout.tsx
│   ├── page.tsx               # → imports from features/
│   ├── (auth)/                # Route group
│   │   ├── login/page.tsx     # → <LoginForm />
│   │   └── register/page.tsx  # → <RegisterForm />
│   └── (dashboard)/
│       ├── layout.tsx         # Auth guard + Sidebar
│       └── dashboard/
│           ├── page.tsx       # → <AudioList />
│           ├── tickets/
│           ├── projects/
│           ├── analytics/
│           └── settings/
├── components/                # Shared across features
│   ├── ui/                    # Button, Input, Card, Badge...
│   └── layout/                # Sidebar, Navbar
├── features/                  # Feature modules
│   ├── auth/                  # auth-store, login-form, register-form
│   ├── audio/                 # audio-list, audio-upload, audio-detail
│   ├── tickets/               # ticket-list, ticket-card
│   ├── projects/              # project-list, project-form
│   ├── analytics/             # analytics-dashboard
│   ├── settings/              # settings-page
│   └── landing/               # landing-page
└── lib/                       # Utilities
    ├── api.ts                 # API client (fetch-based)
    └── utils.ts               # cn() helper
```

### Core Rules

- **Pages are thin.** Only routing — import and render a feature component. Max 5 lines.
- **Components in `components/`** are shared by 2+ features. If it's only used by one feature, it stays in `features/`.
- **No `useMemo`/`useCallback`.** React Compiler handles memoization.
- **Named exports** for all components and functions.
- **`"use client"` only where needed** (event handlers, hooks, browser APIs).

### Component Patterns

```typescript
// Functional components with TypeScript interfaces
interface AudioCardProps {
  audio: AudioRecording;
  onSelect: (id: string) => void;
}

export function AudioCard({ audio, onSelect }: AudioCardProps) {
  const handleClick = () => onSelect(audio.id);

  return (
    <div onClick={handleClick} onKeyDown={handleClick} tabIndex={0} role="button">
      {audio.fileName}
    </div>
  );
}
```

### State Management

- **Zustand** for global state (auth, UI preferences).
- **Local state** (`useState`) for component-specific state.
- Minimize `useEffect` — prefer derived state.

### Data Fetching

- Use the `api` client from `lib/api.ts` (fetch-based, no axios).
- API requests go through Next.js rewrites proxy (`/api/*` → backend). No CORS issues.
- Handle loading and error states in every data-fetching component.

### Styling

- **Tailwind CSS 4** with `cn()` helper (clsx + tailwind-merge).
- Never use `var()` in className.
- Use Tailwind classes for all styling. `style` prop only for dynamic values.
- Dark theme by default (zinc-950 background, zinc-100 text).

### Accessibility

- All interactive elements must have: `tabIndex`, `aria-label`, keyboard handlers.
- Use semantic HTML (`button`, `nav`, `main`, `section`).
- Form inputs must have associated `label` elements.

### Testing (Mandatory)

- Write tests for components and features.
- Use Vitest + Testing Library.
- Test user interactions, not implementation details.
- Coverage threshold applies to `features/` and `components/`.

---

## Git Workflow

- **Feature branches:** `feature/YAP-XX` from main.
- **Bug fixes:** `fix/YAP-XX` from main.
- **Refactors:** `refactor/YAP-XX` from main.
- **Conventional commits:** `feat:`, `fix:`, `refactor:`, `docs:`, `test:`, `chore:`.
- Include Jira ticket key in commit body.
- Never commit directly to main.
- Pre-commit hook runs ESLint + Prettier via lint-staged.

## API Design

- All endpoints under `/api/v1/`.
- Use native `fetch` for HTTP calls (no axios).
- JWT Bearer auth on all protected endpoints.
- Pagination: `?page=1&limit=10` returning `{ data, total, page, limit }`.
- Errors return `{ message, statusCode }`.

## Docker

- `docker-compose.yml` for local development only.
- No defaults in env vars — fail fast.
- Postgres on non-standard port (54320 default) to avoid conflicts with local instances.
- Redis on 6379.
