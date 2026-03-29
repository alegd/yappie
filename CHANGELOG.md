# Changelog

All notable changes to this project are documented here, organized by development week.

## Week 8 — Deploy + Docs + Security (2026-03-27 to 2026-03-29)

### Added

- **Passwordless auth** — OTP via email replaces password-based login/register
  - RedisModule (ioredis) for OTP storage with TTL, cooldown, and rate limiting
  - EmailService (Resend) for sending OTP codes
  - OtpService with timing-safe comparison (`crypto.timingSafeEqual`)
  - Single `/auth` page with multi-step flow (email → OTP → name for new users)
  - NextAuth CredentialsProvider as token relay (no API call in authorize)
  - `publicFetcher` for unauthenticated OTP requests
- **Production Dockerfile** — multi-stage build (deps → build → runtime) with non-root user
- **Production docker-compose** — API + PostgreSQL + Redis with named volumes
- **Docker entrypoint** — automatic `prisma migrate deploy` before starting
- **Healthcheck endpoint** — `GET /health` checks database and Redis status
- **CodeRabbit** — automated PR review configuration (`.coderabbit.yaml`)
- **Error boundaries** — `error.tsx` for dashboard and auth route segments
- **Security headers** — X-Frame-Options, X-Content-Type-Options, Referrer-Policy, Permissions-Policy
- **Loading skeletons** — Suspense boundaries for all dashboard routes
- **Logos and favicons** — full icon set for all platforms

### Changed

- Removed `password` field from User model (destructive migration)
- Removed `bcryptjs` dependency
- Removed login/register pages → single `/auth` entry point
- Updated E2E tests for OTP flow (reads codes from Redis)
- Node.js standardized to v22 across `.nvmrc`, CI, and Dockerfile

### Security (OWASP Top 10 Audit)

- Fixed BOLA in `revokeSession` — now checks userId ownership
- Removed JWT `"dev-secret"` fallback — app fails if `JWT_SECRET` missing
- Created proper DTOs for tickets, templates, and Jira bulk export (ValidationPipe whitelist)
- Activated `validateEnv()` at startup — dead code no more
- Audio pipeline: `$transaction` for atomic ticket creation, idempotency check
- BullMQ: 3 retries with exponential backoff, `removeOnComplete`
- Pagination capped to 1-100 on all list endpoints
- Swagger disabled in production
- Removed all env var fallback defaults (fail fast)
- Replaced empty `catch {}` blocks with `toast.error` notifications
- `dotenv` loaded before module initialization

### Performance

- Migrated fonts from `@fontsource` to `next/font/google` (preloading, subsetting)
- Dynamic imports for recharts (~500KB) and socket.io-client (~300KB)
- Sentry sample rates configurable via env vars with guarded init
- Moved Providers from root layout to route group layouts (landing = RSC)
- Parallelized bulk approve/delete with `Promise.allSettled`

## Week 7 — Security + Observability (2026-03-24 to 2026-03-26)

### Added

- Sentry error tracking for API (NestJS SDK) and frontend (Next.js SDK)
- CryptoService (AES-256-GCM) for encrypting Jira tokens at rest
- CacheService for analytics overview (5min TTL) and Jira projects (10min TTL)
- ThrottleExceptionFilter for structured 429 responses
- Auth rate limiting: 5/min register, 10/min login
- OWASP Top 10 audit document

### Security

- Helmet.js for security headers
- CORS restricted to frontend origin
- Session ownership validation on audio recordings
- Encrypted Jira OAuth tokens at rest

## Week 6 — E2E Tests + Polish (2026-03-21 to 2026-03-23)

### Added

- Playwright E2E tests: auth + upload, projects CRUD, tickets actions
- QuotasService with plan-based limits (FREE/PRO) and rolling 30-day billing
- QuotaGuard on audio upload + consumption tracking
- QuotaBanner warning at 90%/100% usage
- QuotaUsage progress bar in settings
- AppSelect component (Radix UI) replacing native selects
- Pre-push hook: test coverage + next build

### Changed

- Auth refresh with 30-second grace period for concurrent token rotation
- Settings refactored into section components

## Week 5 — Frontend Web (2026-03-17 to 2026-03-20)

### Added

- Landing page with hero, features, how-it-works, and CTA sections
- Auth pages (login, register) with API client and auth store
- Dashboard layout with sidebar navigation
- Audio list with upload, status tracking, and detail view
- Ticket list with DataTable, filters, approve, delete, and Jira export
- Project list with CRUD and form validation (Zod + react-hook-form)
- Analytics dashboard with recharts bar chart
- Settings page with profile, templates, integrations, and quota sections
- Real-time WebSocket updates during audio processing
- next-intl i18n with `[locale]` routing
- Dark/light theme with next-themes
- Shared UI components: Button, Input, Card, Badge, DataTable, Skeleton

## Week 4 — Jira + Templates (2026-03-14 to 2026-03-16)

### Added

- JiraService with native fetch and OAuth 2.0 (authorization code flow)
- ExportService for individual and bulk ticket export to Jira
- TemplatesService CRUD with default template support
- AnalyticsService with event tracking and overview aggregation
- Global rate limiting with `@nestjs/throttler`
- Project context injection for AI-powered ticket generation

## Week 3 — Audio Pipeline + AI Core (2026-03-11 to 2026-03-13)

### Added

- AudioService: upload, file validation (type + size), status transitions
- AIService: Whisper transcription (verbose_json), GPT decomposition, ticket generation
- TicketsService: CRUD with filters, ownership checks, approve workflow
- StorageService with LocalStorageAdapter (interface for future S3 swap)
- BullMQ AudioProcessor pipeline: transcribe → decompose → generate → save
- WebSocket gateway for real-time processing progress

## Week 2 — Auth + Database (2026-03-08 to 2026-03-10)

### Added

- Prisma schema with User, RefreshToken, Project, AudioRecording, Ticket models
- AuthService: register, login, JWT access tokens (15min), refresh tokens (7 days)
- JwtAuthGuard as global APP_GUARD with `@Public()` decorator bypass
- UsersService with profile management
- ProjectsService CRUD with ownership checks
- Swagger auto-generated API documentation
- Seed script with demo user and project

## Week 1 — Setup + Architecture (2026-03-05 to 2026-03-07)

### Added

- Turborepo monorepo with pnpm workspaces
- NestJS 11 API scaffold with base modules
- Next.js 16 with App Router, Tailwind CSS 4, React Compiler
- ESLint flat config, Prettier, Husky, lint-staged
- Vitest with coverage enforcement (80% threshold)
- Docker Compose for local development (PostgreSQL + Redis)
- GitHub Actions CI pipeline (lint, type-check, test, build)
- Zod environment variable validation
- Architecture Decision Records (ADRs)
- C4 diagrams and audio pipeline sequence diagram
