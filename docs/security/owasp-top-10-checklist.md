# OWASP Top 10 (2023 API Security) — Security Checklist

Last audit: 2026-03-29

## A01: Broken Object Level Authorization (BOLA)

| Control                       | Status | Details                                                                                         |
| ----------------------------- | ------ | ----------------------------------------------------------------------------------------------- |
| Global JWT auth guard         | ✅     | `JwtAuthGuard` via `APP_GUARD` on all endpoints                                                 |
| Public endpoints opt-in       | ✅     | `@Public()` on: request-otp, verify-otp, complete-register, refresh, health                     |
| Resource ownership validation | ✅     | All services check `userId` before returning data                                               |
| Pagination filtered by userId | ✅     | Prisma queries include `where: { userId }`                                                      |
| Session revocation ownership  | ✅     | `revokeSession` uses compound `where: { id, userId }` + throws 404 if not found                 |
| Jira OAuth state validation   | ⚠️     | State param is userId, should be cryptographic nonce (low risk — OAuth callback is server-side) |

## A02: Broken Authentication

| Control                     | Status | Details                                       |
| --------------------------- | ------ | --------------------------------------------- |
| Passwordless OTP            | ✅     | No passwords stored — email OTP only          |
| OTP brute force protection  | ✅     | 3 attempts per code, then deleted             |
| OTP cooldown                | ✅     | 60s between sends per email                   |
| OTP rate limit              | ✅     | 5 requests per email per hour                 |
| Timing-safe comparison      | ✅     | `crypto.timingSafeEqual` for OTP verification |
| Refresh token entropy       | ✅     | `randomBytes(40)` = 320 bits                  |
| Refresh token rotation      | ✅     | Revoked on use, new pair issued               |
| Grace period for concurrent | ✅     | 30s window for recently-revoked tokens        |
| JWT expiry                  | ✅     | 15-minute access tokens                       |
| No JWT fallback secret      | ✅     | App fails if `JWT_SECRET` is not set          |

## A03: Broken Object Property Level Authorization

| Control                     | Status | Details                                                                                    |
| --------------------------- | ------ | ------------------------------------------------------------------------------------------ |
| ValidationPipe whitelist    | ✅     | `whitelist: true` strips unknown fields                                                    |
| Proper DTOs everywhere      | ✅     | class-validator decorators on all `@Body()` params (tickets, templates, auth, Jira export) |
| No sensitive field exposure | ✅     | User responses exclude internal fields                                                     |

## A04: Unrestricted Resource Consumption

| Control              | Status | Details                                                                               |
| -------------------- | ------ | ------------------------------------------------------------------------------------- |
| Global rate limiting | ✅     | ThrottlerModule: 3/s, 20/10s, 60/min (disabled in test via NODE_ENV)                  |
| Auth rate limiting   | ✅     | @Throttle per endpoint: 5/min request-otp, 10/min verify-otp, 5/min complete-register |
| Upload rate limiting | ✅     | 10 uploads/min per user                                                               |
| File size limits     | ✅     | 50MB max audio file                                                                   |
| Pagination capped    | ✅     | All list endpoints capped to 1-100 via `Math.max(1, Math.min(limit, 100))`            |
| Bulk export limit    | ✅     | `ExportBulkDto` with `@ArrayMaxSize(50)`                                              |
| Quota enforcement    | ✅     | QuotasService checks before upload                                                    |

## A05: Broken Function Level Authorization

| Control                | Status | Details                                                               |
| ---------------------- | ------ | --------------------------------------------------------------------- |
| Default deny           | ✅     | `JwtAuthGuard` as `APP_GUARD` — all routes protected                  |
| Minimal public surface | ✅     | Only auth endpoints, health check, and Jira OAuth callback are public |
| No admin endpoints     | ✅     | Single-role system, no admin functions exposed                        |

## A06: Unrestricted Access to Sensitive Business Flows

| Control               | Status | Details                                                                     |
| --------------------- | ------ | --------------------------------------------------------------------------- |
| Upload quota check    | ✅     | QuotaGuard blocks upload if limit exceeded                                  |
| Jira export ownership | ✅     | ExportService verifies ticket belongs to user                               |
| Export rate limiting  | ✅     | Single export 20/min, bulk 5/min                                            |
| OTP email enumeration | ✅     | `request-otp` always returns `{ sent: true }` regardless of email existence |

## A07: Server Side Request Forgery (SSRF)

| Control                          | Status | Details                                            |
| -------------------------------- | ------ | -------------------------------------------------- |
| No user-supplied URLs in fetch   | ✅     | All external URLs hardcoded (Atlassian, OpenAI)    |
| Jira API URLs constructed safely | ✅     | Template literals with cloudId from OAuth response |
| OpenAI calls via SDK             | ✅     | No URL manipulation                                |
| Next.js rewrites scoped          | ✅     | Only `/api/v1/*` proxied                           |

## A08: Security Misconfiguration

| Control                     | Status | Details                                                                      |
| --------------------------- | ------ | ---------------------------------------------------------------------------- | --- | ----------- |
| Security headers (Helmet)   | ✅     | CSP, HSTS, X-Frame-Options via Helmet.js                                     |
| Frontend security headers   | ✅     | X-Content-Type-Options, X-Frame-Options, Referrer-Policy, Permissions-Policy |
| CORS whitelist              | ✅     | Restricted to `FRONTEND_URL` (no fallback default)                           |
| Swagger disabled in prod    | ✅     | `if (NODE_ENV !== "production")` guard                                       |
| Env validation at startup   | ✅     | `validateEnv()` called in `main.ts` before app creation                      |
| dotenv loaded first         | ✅     | `config()` before any import reads `process.env`                             |
| No env fallback defaults    | ✅     | All `process.env.*` accesses have no `                                       |     | ` fallbacks |
| Error messages generic      | ✅     | Auth errors don't leak user existence                                        |
| Jira tokens encrypted       | ✅     | AES-256-GCM via CryptoService                                                |
| Error boundaries (frontend) | ✅     | `error.tsx` for dashboard and auth routes                                    |

## A09: Improper Inventory Management

| Control                 | Status | Details                                                 |
| ----------------------- | ------ | ------------------------------------------------------- |
| API versioned           | ✅     | All endpoints under `/api/v1/` prefix                   |
| No deprecated endpoints | ✅     | Old login/register removed after passwordless migration |
| Clean module structure  | ✅     | Each controller in exactly one module                   |

## A10: Unsafe Consumption of APIs

| Control                   | Status | Details                                                     |
| ------------------------- | ------ | ----------------------------------------------------------- |
| AI responses validated    | ✅     | Zod schemas for task/ticket parsing in AIService            |
| AI parse failure handled  | ✅     | Returns empty array on malformed response                   |
| Jira API responses        | ⚠️     | Not validated with schemas (tech debt — YAP-106)            |
| Resend response           | ⚠️     | Not checked for errors (tech debt — YAP-106)                |
| External request timeouts | ⚠️     | No timeout on Jira/OpenAI fetch calls (tech debt — YAP-106) |

## Summary

| Category                 | Status | Notes                                                 |
| ------------------------ | ------ | ----------------------------------------------------- |
| A01 BOLA                 | ✅     | All ownership checks in place                         |
| A02 Broken Auth          | ✅     | Passwordless OTP with full rate limiting              |
| A03 Property Auth        | ✅     | Proper DTOs everywhere                                |
| A04 Resource Consumption | ✅     | Rate limits + pagination caps + file limits           |
| A05 Function Auth        | ✅     | Global JWT guard, minimal public surface              |
| A06 Business Flows       | ✅     | Quotas + ownership + rate limits                      |
| A07 SSRF                 | ✅     | No user-supplied URLs                                 |
| A08 Misconfiguration     | ✅     | Swagger off in prod, env validation, security headers |
| A09 Inventory            | ✅     | Clean versioned API                                   |
| A10 Unsafe APIs          | ⚠️     | Jira/Resend responses not validated (YAP-106)         |

**Remaining tech debt tracked in [YAP-106](https://zendinit.atlassian.net/browse/YAP-106).**
