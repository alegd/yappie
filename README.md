# Yappie

> Turn audio recordings into actionable Jira tickets with AI.

Yappie is an open-source tool that uses OpenAI Whisper and GPT-4o to transcribe audio recordings, decompose them into tasks, and generate structured Jira tickets — ready to export with one click.

## Tech Stack

- **Backend:** NestJS, PostgreSQL 16, Redis 7, BullMQ
- **Frontend:** Next.js 16, React 19, Tailwind CSS 4, React Compiler
- **Mobile:** React Native / Expo
- **AI:** OpenAI Whisper + GPT-4o
- **Infra:** Turborepo, Docker, GitHub Actions, Coolify

## Quick Start

```bash
# Clone
git clone https://github.com/alegd/yappie.git
cd yappie

# Install
pnpm install

# Setup env files
cp apps/api/.env.example apps/api/.env   # fill in your values
cp apps/web/.env.example apps/web/.env   # fill in AUTH_SECRET

# Start backend services (Postgres + Redis)
cd apps/api && docker compose up -d postgres redis

# Run migrations
pnpm --filter @yappie/api exec prisma migrate deploy

# Run dev (from root)
cd ../.. && pnpm dev
```

## Project Structure

```
yappie/
├── apps/
│   ├── api/        # NestJS REST API
│   ├── web/        # Next.js 16 dashboard
│   └── mobile/     # Expo mobile app
├── packages/
│   ├── shared/     # Shared types and utilities
│   └── config/     # ESLint, TypeScript, Vitest configs
└── docs/           # ADRs, C4 diagrams
```

## Scripts

| Command              | Description                             |
| -------------------- | --------------------------------------- |
| `pnpm dev`           | Start all apps in dev mode              |
| `pnpm build`         | Build all packages                      |
| `pnpm lint`          | Lint all packages                       |
| `pnpm test`          | Run all tests                           |
| `pnpm test:coverage` | Run tests with coverage (80% threshold) |
| `pnpm type-check`    | TypeScript type checking                |

## License

[AGPL-3.0](LICENSE)
