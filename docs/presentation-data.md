# Yappie — Datos para la Presentación

## Métricas del Código

| Métrica                              | Valor                                                      |
| ------------------------------------ | ---------------------------------------------------------- |
| **Commits totales**                  | 284                                                        |
| **Tests unitarios + integración**    | 478 (169 API + 309 Web)                                    |
| **Tests E2E (Playwright)**           | 3 spec files (auth+upload, projects CRUD, tickets actions) |
| **Total tests**                      | 481                                                        |
| **Endpoints documentados (Swagger)** | 41                                                         |
| **Archivos totales (.ts/.tsx)**      | 237 (95 API + 135 Web + 7 shared/config)                   |
| **Líneas de código**                 | ~7,500 (2,962 API + 4,534 Web + 4 Shared)                  |

### Test Coverage

| App     | Statements | Branches | Functions | Lines |
| ------- | ---------- | -------- | --------- | ----- |
| **API** | 95.7%      | 87.0%    | 93.9%     | 96.4% |
| **Web** | 89.4%      | 81.7%    | 87.0%     | 89.8% |

## Screenshots / Exports Necesarios

> Estos los necesitás capturar tú desde la app funcionando.

- [ ] Screenshot del dashboard con audios y tickets
- [ ] GIF o screenshots del flujo: auth → upload audio → tickets generados → export a Jira
- [ ] Screenshot de Swagger (`http://localhost:3001/api/docs`)
- [ ] Screenshot del CI verde en GitHub Actions
- [ ] Screenshot de Sentry dashboard (si configurado)
- [ ] Logo final (ya en `apps/web/public/logo.svg` y `logo.png`)

### Diagramas disponibles en el repo

- **Pipeline de audio:** `docs/architecture.md` → sección "Audio Processing Pipeline"
- **Auth flow:** `docs/architecture.md` → sección "Authentication Flow"
- **Deployment:** `docs/architecture.md` → sección "Deployment Architecture"
- **Data model:** `docs/architecture.md` → sección "Data Model"
- **Sistema completo:** `docs/architecture.md` → sección "System Overview"

Todos los diagramas son Mermaid — se renderizan en GitHub automáticamente.

## Datos del Producto

| Dato                   | Valor                                |
| ---------------------- | ------------------------------------ |
| **URL de producción**  | https://yappie.gueden.com            |
| **URL del API**        | https://api.yappie.gueden.com        |
| **Health check**       | https://api.yappie.gueden.com/health |
| **Repositorio GitHub** | https://github.com/alegd/yappie      |
| **Licencia**           | AGPL-3.0                             |

### Stack Tecnológico

| Capa           | Tecnología                                                           |
| -------------- | -------------------------------------------------------------------- |
| Frontend       | Next.js 16, React 19, Tailwind CSS 4, NextAuth v5, SWR               |
| Backend        | NestJS 11, Prisma 7, PostgreSQL 16, Redis 7, BullMQ                  |
| AI             | OpenAI Whisper (transcripción), GPT-4o (descomposición + generación) |
| Email          | Resend (OTP passwordless)                                            |
| Infra          | Docker, Vercel (web), Coolify (API), GitHub Actions CI               |
| Testing        | Vitest, Testing Library, Playwright                                  |
| Observabilidad | Sentry (error tracking)                                              |

### Usuarios Beta / Feedback

> Completar con tus datos reales:
>
> - ¿Cuántos usuarios se han registrado?
> - ¿Hay feedback de los primeros usuarios?
> - ¿Métricas de uso? (audios subidos, tickets generados, exports a Jira)

### Tiempo de Desarrollo

| Semana   | Foco                                                       |
| -------- | ---------------------------------------------------------- |
| Semana 1 | Setup monorepo, CI/CD, Docker, arquitectura                |
| Semana 2 | Auth + base de datos (TDD)                                 |
| Semana 3 | Pipeline de audio + AI (Whisper + GPT)                     |
| Semana 4 | Jira integration + templates                               |
| Semana 5 | Frontend web completo                                      |
| Semana 6 | E2E tests + quotas + polish                                |
| Semana 7 | Seguridad (OWASP) + observabilidad (Sentry)                |
| Semana 8 | Deploy + passwordless auth + documentación + onboarding UX |

**Total: 8 semanas** (5 marzo — 29 marzo 2026)

### Funcionalidades Principales

1. **Passwordless auth** — OTP por email, sin contraseñas
2. **Pipeline de audio** — Upload → Whisper transcription → GPT decomposition → tickets
3. **Contexto de proyecto** — AI usa el contexto del proyecto para generar tickets más precisos
4. **Real-time** — WebSocket notifica progreso del procesamiento
5. **Jira integration** — OAuth 2.0, export individual y bulk, tokens encriptados (AES-256-GCM)
6. **Onboarding guiado** — Checklist para nuevos usuarios (Jira → proyecto → upload)
7. **Quotas** — Planes FREE/PRO con límites por ciclo de facturación
8. **Seguridad** — OWASP Top 10 auditado, Helmet, CORS, rate limiting, env validation
9. **Dark/light theme** — Sistema-aware
10. **i18n ready** — next-intl configurado

### Diferenciadores

- **Passwordless** — no hay que gestionar contraseñas ni "olvidé mi contraseña"
- **AI context-aware** — el contexto del proyecto mejora la calidad de los tickets generados
- **One-click export** — el proyecto ya sabe a qué Jira project exportar
- **Real-time feedback** — el usuario ve el progreso del procesamiento en vivo
- **Open source** — AGPL-3.0, código público
