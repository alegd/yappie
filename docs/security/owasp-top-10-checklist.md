# OWASP Top 10 (2021) — Security Checklist

Audit date: 2026-03-26

## A01: Broken Access Control

| Control                       | Status | Details                                                            |
| ----------------------------- | ------ | ------------------------------------------------------------------ |
| Global JWT auth guard         | ✅     | `JwtAuthGuard` via `APP_GUARD` on all endpoints                    |
| Public endpoints opt-in       | ✅     | `@Public()` decorator on register, login, refresh, health          |
| Resource ownership validation | ✅     | All services check `userId` before returning data                  |
| Pagination filtered by userId | ✅     | Prisma queries include `where: { userId }`                         |
| Session API ownership check   | ❌     | `DELETE /sessions/:userId` does not validate caller owns userId    |
| Jira OAuth state validation   | ⚠️     | State param is predictable (userId), should be cryptographic nonce |

**Action items:**

- [x] Fix session revocation to validate `req.user.sub === userId`
- [ ] Generate cryptographic nonce for Jira OAuth state (future)

## A02: Cryptographic Failures

| Control                  | Status | Details                               |
| ------------------------ | ------ | ------------------------------------- |
| Password hashing         | ✅     | bcryptjs with 10 salt rounds          |
| Refresh token entropy    | ✅     | `randomBytes(40)` = 320 bits          |
| JWT signing              | ✅     | HS256 with configurable secret        |
| HTTPS enforcement        | ✅     | Helmet sets HSTS header               |
| Tokens encrypted at rest | ❌     | Jira tokens stored as plaintext in DB |

**Action items:**

- [ ] Encrypt Jira tokens with AES-256-GCM (YAP-60)

## A03: Injection

| Control               | Status | Details                                                                    |
| --------------------- | ------ | -------------------------------------------------------------------------- |
| Parameterized queries | ✅     | Prisma ORM, no raw SQL                                                     |
| Input validation      | ✅     | `ValidationPipe({ whitelist: true })` strips unknown fields                |
| DTO validation        | ✅     | class-validator decorators on all DTOs                                     |
| Env validation        | ✅     | Zod schema in `env.config.ts`                                              |
| AI prompt injection   | ⚠️     | User text passed to OpenAI without sanitization (low risk, OpenAI handles) |

## A04: Insecure Design

| Control                | Status | Details                                                        |
| ---------------------- | ------ | -------------------------------------------------------------- |
| Rate limiting (global) | ✅     | ThrottlerModule: 3/s, 20/10s, 60/min                           |
| Rate limiting (upload) | ✅     | 10 uploads/min per user                                        |
| Rate limiting (auth)   | ❌     | Login/register use global limit only                           |
| File size limits       | ✅     | 50MB max audio file                                            |
| Quota enforcement      | ✅     | QuotasService checks before upload                             |
| CSRF protection        | ⚠️     | JWT strategy (no cookies for API), but no explicit CSRF tokens |

**Action items:**

- [x] Add auth-specific rate limiting
- [ ] Add pagination limit bounds (max 100)

## A05: Security Misconfiguration

| Control                   | Status | Details                                             |
| ------------------------- | ------ | --------------------------------------------------- |
| Security headers (Helmet) | ✅     | CSP, HSTS, X-Frame-Options, etc.                    |
| CORS whitelist            | ✅     | Restricted to `FRONTEND_URL`                        |
| WebSocket CORS            | ✅     | Restricted to `FRONTEND_URL`                        |
| Debug mode disabled       | ✅     | No debug flags in production                        |
| Error messages generic    | ✅     | Auth errors don't leak internals                    |
| Swagger in production     | ⚠️     | `/api/docs` accessible (consider disabling in prod) |

## A06: Vulnerable Components

| Control                 | Status | Details                           |
| ----------------------- | ------ | --------------------------------- |
| Dependencies up to date | ✅     | NestJS 11, Next.js 16, Prisma 7   |
| Lockfile present        | ✅     | `pnpm-lock.yaml` committed        |
| next-auth stability     | ⚠️     | v5.0.0-beta.30 (beta, not stable) |
| No known CVEs           | ✅     | Checked 2026-03-26                |

## A07: Identification and Authentication Failures

| Control                     | Status | Details                                       |
| --------------------------- | ------ | --------------------------------------------- |
| Password hashing            | ✅     | bcryptjs, cost 10                             |
| Password minimum length     | ✅     | 8 characters via DTO validation               |
| Token rotation              | ✅     | Refresh token revoked on use, new pair issued |
| Grace period for concurrent | ✅     | 30s window for recently-revoked tokens        |
| Session tracking            | ✅     | userAgent + ipAddress stored                  |
| Session revocation          | ✅     | Individual + bulk revocation endpoints        |
| Multi-factor auth           | ❌     | Not implemented (future)                      |
| Account lockout             | ❌     | No lockout after failed attempts              |

## A08: Software and Data Integrity Failures

| Control            | Status | Details                                |
| ------------------ | ------ | -------------------------------------- |
| Lockfile integrity | ✅     | pnpm lockfile committed                |
| Pre-commit hooks   | ✅     | ESLint + Prettier via Husky            |
| Pre-push hooks     | ✅     | Test coverage + build validation       |
| CI pipeline        | ✅     | GitHub Actions with lint/test/coverage |

## A09: Security Logging and Monitoring Failures

| Control                | Status | Details                               |
| ---------------------- | ------ | ------------------------------------- |
| Application logging    | ✅     | NestJS Logger in processors, gateways |
| Audio pipeline logging | ✅     | Step-by-step with audioId + userId    |
| WebSocket auth logging | ✅     | Logs connections + rejections         |
| Failed login logging   | ❌     | No audit log for failed auth attempts |
| Security event logging | ❌     | No dedicated security audit trail     |

**Action items:**

- [ ] Add audit logging for security events (future)

## A10: Server-Side Request Forgery (SSRF)

| Control                          | Status | Details                                   |
| -------------------------------- | ------ | ----------------------------------------- |
| No user-supplied URLs in fetch   | ✅     | All external URLs hardcoded               |
| Jira API URLs constructed safely | ✅     | Template literals with cloudId from OAuth |
| OpenAI calls via SDK             | ✅     | No URL manipulation                       |
| Next.js rewrites scoped          | ✅     | Only `/api/v1/*` proxied                  |
| Request timeouts                 | ❌     | No timeout on Jira/OpenAI fetch calls     |

**Action items:**

- [ ] Add request timeouts to external API calls (future)

## Summary

| Category                      | Status | Priority                   |
| ----------------------------- | ------ | -------------------------- |
| A01 Broken Access Control     | ⚠️     | Fixed in this PR           |
| A02 Cryptographic Failures    | ✅     | Token encryption in YAP-60 |
| A03 Injection                 | ✅     | —                          |
| A04 Insecure Design           | ⚠️     | Fixed in this PR           |
| A05 Security Misconfiguration | ✅     | —                          |
| A06 Vulnerable Components     | ✅     | —                          |
| A07 Auth Failures             | ✅     | —                          |
| A08 Data Integrity            | ✅     | —                          |
| A09 Logging                   | ⚠️     | Future ticket              |
| A10 SSRF                      | ✅     | —                          |
