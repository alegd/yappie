# Yappie Authentication System — Complete Documentation

This document describes the complete authentication system of Yappie, a passwordless OTP-based flow. It is intended as a reference for reproducing this auth architecture in other applications.

**Stack:** NestJS 11 + Prisma 7 + Redis 7 (backend), Next.js 16 + NextAuth v5 + React 19 (frontend)

---

# Part 1: Backend (NestJS API)

## 1.1 Architecture Overview

The backend implements a **passwordless OTP + dual-token** authentication system:

1. **OTP (One-Time Password):** 4-digit code sent via email. Stored in Redis with TTL. Used for initial authentication — replaces traditional username/password.
2. **Access Token:** Short-lived JWT (15 minutes). Sent by the client on every API request via `Authorization: Bearer` header.
3. **Refresh Token:** Long-lived opaque token (7 days). Stored in PostgreSQL. Used to obtain new access tokens without re-authenticating.

There are **no passwords** in the system. The User model has only `email` and `name`. Authentication is done exclusively via email OTP.

## 1.2 Data Model

### User

```prisma
model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  createdAt DateTime @default(now()) @map("created_at")
  updatedAt DateTime @updatedAt @map("updated_at")

  refreshTokens RefreshToken[]
  // ... other relations (projects, tickets, etc.)

  @@map("users")
}
```

No `password` field. Authentication is entirely OTP-based.

### RefreshToken

```prisma
model RefreshToken {
  id        String    @id @default(cuid())
  token     String    @unique
  userId    String    @map("user_id")
  userAgent String?   @map("user_agent")
  ipAddress String?   @map("ip_address")
  expiresAt DateTime  @map("expires_at")
  revokedAt DateTime? @map("revoked_at")
  createdAt DateTime  @default(now()) @map("created_at")

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@map("refresh_tokens")
}
```

- `token`: 40-byte cryptographically random hex string (`crypto.randomBytes(40).toString("hex")`)
- `expiresAt`: 7 days from creation
- `revokedAt`: null means active, set when token is rotated or explicitly revoked

### OTP Storage (Redis — no Prisma model)

OTPs are ephemeral and stored in Redis with automatic expiration:

| Key                    | Value                                | TTL            | Purpose                                     |
| ---------------------- | ------------------------------------ | -------------- | ------------------------------------------- |
| `otp:{email}`          | `JSON { code, attempts, verified? }` | 600s (10 min)  | The OTP code and its state                  |
| `otp:cooldown:{email}` | `"1"`                                | 60s            | Prevents requesting a new code too quickly  |
| `otp:rate:{email}`     | counter (integer)                    | 3600s (1 hour) | Limits to 5 OTP requests per email per hour |

## 1.3 Module Structure

```
apps/api/src/
├── auth/
│   ├── auth.module.ts          # Registers JWT, guards, services
│   ├── auth.controller.ts      # HTTP endpoints
│   ├── auth.service.ts         # Core auth logic (OTP + token generation)
│   ├── otp.service.ts          # Redis-backed OTP management
│   ├── guards/
│   │   └── jwt-auth.guard.ts   # Global JWT guard
│   ├── decorators/
│   │   └── public.decorator.ts # @Public() to bypass guard
│   └── dto/
│       ├── request-otp.dto.ts
│       ├── verify-otp.dto.ts
│       ├── complete-register.dto.ts
│       └── refresh.dto.ts
├── email/
│   ├── email.module.ts         # Global module
│   └── email.service.ts        # Resend integration
└── redis/
    ├── redis.module.ts         # Global module, provides ioredis client
    └── redis.constants.ts      # REDIS_CLIENT injection token
```

### AuthModule

```typescript
@Module({
  imports: [
    JwtModule.register({
      secret: process.env.JWT_SECRET,
      signOptions: { expiresIn: "15m" },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    OtpService,
    { provide: APP_GUARD, useClass: JwtAuthGuard }, // Global guard
  ],
  exports: [AuthService, JwtModule],
})
export class AuthModule {}
```

The `JwtAuthGuard` is registered as `APP_GUARD` — **every route is protected by default**. Only routes decorated with `@Public()` bypass the JWT check.

### RedisModule

```typescript
@Global()
@Module({
  providers: [
    {
      provide: REDIS_CLIENT,
      useFactory: () => {
        const url = process.env.REDIS_URL;
        if (!url) throw new Error("REDIS_URL environment variable is required");
        return new Redis(url);
      },
    },
  ],
  exports: [REDIS_CLIENT],
})
export class RedisModule {}
```

Global module. Inject with `@Inject(REDIS_CLIENT)`.

### EmailModule

```typescript
@Global()
@Module({
  providers: [
    {
      provide: EmailService,
      useFactory: () => new EmailService(process.env.RESEND_API_KEY!, process.env.EMAIL_FROM!),
    },
  ],
  exports: [EmailService],
})
export class EmailModule {}
```

Uses [Resend](https://resend.com) for email delivery. `EMAIL_FROM` is configurable (e.g., `Yappie <noreply@yappie.gueden.com>`).

## 1.4 Endpoints

All endpoints are under the `/auth` controller. The NestJS global prefix is `/api/v1`, so full paths are `/api/v1/auth/*`.

### POST `/auth/request-otp` — @Public()

Sends a 4-digit OTP code to the provided email.

**Rate limiting:** @Throttle 5/min + Redis cooldown 60s + Redis rate 5/hour

**Request:**

```json
{ "email": "user@example.com" }
```

**Response (always):**

```json
{ "sent": true }
```

**Security:** Does NOT reveal whether the email exists in the database. Always returns `{ sent: true }`.

**Flow:**

1. Check Redis cooldown (`otp:cooldown:{email}`) — 429 if active
2. Check Redis rate limit (`otp:rate:{email}`) — 429 if >= 5
3. Generate 4-digit code: `crypto.randomInt(0, 10000).toString().padStart(4, "0")`
4. Store in Redis: `otp:{email}` → `{ code, attempts: 0 }` with 600s TTL
5. Set cooldown: `otp:cooldown:{email}` with 60s TTL
6. Increment rate counter: `otp:rate:{email}` with 3600s TTL
7. Send email via Resend
8. Return `{ sent: true }`

### POST `/auth/verify-otp` — @Public()

Verifies the OTP code. If the user exists, returns tokens (login). If the user is new, returns `isNewUser: true`.

**Rate limiting:** @Throttle 10/min + Redis 3-attempt limit

**Request:**

```json
{ "email": "user@example.com", "code": "1234" }
```

**Response (existing user — login):**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "a1b2c3...",
  "user": { "id": "clx...", "email": "user@example.com", "name": "John" },
  "isNewUser": false
}
```

**Response (new user — needs registration):**

```json
{ "verified": true, "isNewUser": true }
```

**Error:**

```json
{ "statusCode": 401, "message": "Invalid or expired code" }
```

**Flow:**

1. Get `otp:{email}` from Redis — 401 if not found
2. If `attempts >= 3`: delete key, return 401 "Too many attempts"
3. Compare codes using `crypto.timingSafeEqual` (prevents timing attacks)
4. If no match: increment attempts, return 401
5. If match: mark as verified in Redis, reset TTL to 300s (5-minute window for registration)
6. Look up User by email
7. If user exists: delete OTP from Redis, generate token pair, return tokens + `isNewUser: false`
8. If user does NOT exist: return `{ verified: true, isNewUser: true }`

### POST `/auth/complete-register` — @Public()

Creates a new user after OTP verification. Only called for new users.

**Rate limiting:** @Throttle 5/min

**Request:**

```json
{ "email": "new@example.com", "code": "1234", "name": "Jane" }
```

**Response:**

```json
{
  "accessToken": "eyJ...",
  "refreshToken": "a1b2c3...",
  "user": { "id": "clx...", "email": "new@example.com", "name": "Jane" }
}
```

**Flow:**

1. Get `otp:{email}` from Redis — verify code matches AND `verified: true`
2. If not valid: return 401
3. Check no user with this email exists (race condition guard) — 409 if exists
4. Create User with `{ email, name }`
5. Delete OTP from Redis
6. Generate token pair, return tokens + user

### POST `/auth/refresh` — @Public()

Rotates the refresh token and issues a new access token.

**Request:**

```json
{ "refreshToken": "a1b2c3..." }
```

**Response:**

```json
{
  "accessToken": "eyJ...(new)",
  "refreshToken": "d4e5f6...(new)",
  "user": { "id": "clx...", "email": "user@example.com", "name": "John" }
}
```

**Flow (with 30-second grace window for concurrent requests):**

1. Look up RefreshToken in DB (include User)
2. If not found or expired: 401
3. If already revoked:
   - Within 30s of revocation (grace window): find the latest active token for this user, issue a new access token paired with it
   - Beyond 30s: 401
4. First request (not revoked): revoke current token, generate new token pair

**Why the grace window:** Next.js dispatches concurrent requests (proxy + `/api/auth/session` + server actions) that all carry the same cookie. The first one rotates the token; subsequent ones arrive with the already-revoked token. This is the standard approach used by Auth0, Firebase, and Supabase.

### POST `/auth/logout` — JWT required

Revokes the refresh token.

**Request:**

```json
{ "refreshToken": "a1b2c3..." }
```

**Response:** 204 No Content

### GET `/auth/sessions` — JWT required

Lists active sessions for the current user.

**Response:**

```json
[
  {
    "id": "clx...",
    "userAgent": null,
    "ipAddress": null,
    "createdAt": "2026-03-29T...",
    "expiresAt": "2026-04-05T..."
  }
]
```

### DELETE `/auth/sessions/:sessionId` — JWT required

Revokes a specific session. Response: 204.

### DELETE `/auth/sessions` — JWT required

Revokes all sessions for the current user. Response: 204.

## 1.5 Token Generation

```typescript
private async generateTokens(user: { id: string; email: string; name: string }) {
  // 1. Sign JWT access token (15 min)
  const accessToken = await this.jwtService.signAsync({
    sub: user.id,
    email: user.email,
  });

  // 2. Generate opaque refresh token (40 bytes hex)
  const refreshTokenValue = randomBytes(40).toString("hex");

  // 3. Persist refresh token in DB (7 day TTL)
  await this.prisma.refreshToken.create({
    data: {
      token: refreshTokenValue,
      userId: user.id,
      expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    },
  });

  return { accessToken, refreshToken: refreshTokenValue, user: { id, email, name } };
}
```

## 1.6 OTP Service — Full Specification

### Code Generation

```typescript
crypto.randomInt(0, 10000).toString().padStart(4, "0");
```

Produces a zero-padded 4-digit string (e.g., `"0042"`, `"1234"`).

### Timing-Safe Comparison

```typescript
const storedBuf = Buffer.from(data.code);
const inputBuf = Buffer.from(code.padStart(data.code.length, "0"));
const isMatch = storedBuf.length === inputBuf.length && crypto.timingSafeEqual(storedBuf, inputBuf);
```

Prevents timing attacks where an attacker measures response time to guess digits.

### Rate Limiting (3 layers)

| Layer           | Mechanism                    | Limit             | Scope        |
| --------------- | ---------------------------- | ----------------- | ------------ |
| Attempt limit   | Redis `otp:{email}.attempts` | 3 per code        | Per OTP code |
| Cooldown        | Redis `otp:cooldown:{email}` | 60s between sends | Per email    |
| Hourly rate     | Redis `otp:rate:{email}`     | 5 per hour        | Per email    |
| NestJS throttle | @Throttle decorator          | 5-10 per minute   | Per IP       |

### State Machine

```
Request OTP → [code stored, attempts=0, TTL=600s]
                    ↓
Verify (wrong) → [attempts++, if >=3 delete]
Verify (right) → [verified=true, TTL reset to 300s]
                    ↓
Complete Register → [OTP deleted, user created]
   or
Login (existing) → [OTP deleted, tokens returned]
```

## 1.7 JWT Guard

Every route is protected by default via `APP_GUARD`. The guard:

1. Checks for `@Public()` metadata → bypass if present
2. Extracts `Bearer <token>` from `Authorization` header
3. Verifies JWT via `jwtService.verifyAsync(token)`
4. Sets `request.user = payload` (contains `{ sub, email, iat, exp }`)

```typescript
@Public()  // ← this decorator skips the guard
@Post("request-otp")
requestOtp(@Body() dto: RequestOtpDto) { ... }
```

## 1.8 Email Service

Uses [Resend](https://resend.com) for transactional email delivery.

```typescript
await this.resend.emails.send({
  from: this.from, // From EMAIL_FROM env var
  to: email,
  subject: `Your Yappie code: ${code}`,
  html: `...centered code template...`,
});
```

The sender address is configurable via `EMAIL_FROM` environment variable (e.g., `Yappie <noreply@yappie.gueden.com>`).

**Requirements:**

- Resend account with verified domain
- DNS records (TXT + MX) configured for the sender domain
- `RESEND_API_KEY` and `EMAIL_FROM` environment variables

## 1.9 Environment Variables

| Variable                 | Required | Description                                            |
| ------------------------ | -------- | ------------------------------------------------------ |
| `JWT_SECRET`             | Yes      | Secret for signing JWT access tokens                   |
| `JWT_EXPIRATION`         | Yes      | Access token TTL (e.g., "15m")                         |
| `JWT_REFRESH_EXPIRATION` | Yes      | Refresh token TTL (e.g., "7d")                         |
| `REDIS_URL`              | Yes      | Redis connection URL                                   |
| `RESEND_API_KEY`         | Yes      | Resend API key for sending emails                      |
| `EMAIL_FROM`             | Yes      | Sender address (e.g., "Yappie \<noreply@domain.com\>") |

---

# Part 2: Frontend (Next.js + NextAuth)

## 2.1 Architecture Overview

The frontend uses **NextAuth v5** (Auth.js) with a **CredentialsProvider** and **JWT strategy**:

1. **User enters email** → frontend calls backend `request-otp`
2. **User enters OTP** → frontend calls backend `verify-otp`
3. **If new user, enters name** → frontend calls backend `complete-register`
4. **Frontend receives tokens** → passes them to `signIn("credentials")` which stores them in a signed JWT cookie
5. **Subsequent requests** → NextAuth reads the cookie, attaches the access token to API calls
6. **Token expiry** → NextAuth's `jwt` callback auto-refreshes via backend `refresh` endpoint

### Two Fetcher Pattern

The app has TWO fetchers for different auth contexts:

| Fetcher         | File                    | Use Case                    | Auth                      |
| --------------- | ----------------------- | --------------------------- | ------------------------- |
| `publicFetcher` | `lib/public-fetcher.ts` | OTP flow (no session yet)   | No Bearer token           |
| `apiFetcher`    | `lib/api-fetcher.ts`    | All authenticated API calls | Bearer token from session |

**Why two?** `apiFetcher` is a server action that always attaches `Authorization: Bearer` and redirects to logout on 401. The OTP flow has no session and uses 401 as a normal error response for invalid codes. `publicFetcher` is a lightweight client-side fetch wrapper.

## 2.2 File Structure

```
apps/web/src/
├── config/
│   └── auth.config.ts              # NextAuth configuration
├── features/auth/
│   └── auth-flow.tsx                # Multi-step auth component
├── app/
│   ├── [locale]/(auth)/
│   │   ├── layout.tsx               # AuthProviders (session + theme)
│   │   ├── auth/page.tsx            # Renders <AuthFlow />
│   │   └── logout/page.tsx          # Calls signOut()
│   └── api/
│       ├── auth/[...nextauth]/route.ts  # NextAuth handler
│       └── data/[...path]/route.ts      # API proxy
├── components/
│   └── auth-providers.tsx           # SessionProvider + ThemeProvider
├── lib/
│   ├── public-fetcher.ts           # Unauthenticated API client
│   ├── api-fetcher.ts              # Authenticated API client (server action)
│   ├── jwt-utils.ts                # JWT decode + expiry check
│   └── constants/
│       ├── pages.ts                # Route constants (AUTH_PAGE, etc.)
│       └── endpoints.ts            # API endpoint constants
├── proxy.ts                         # Middleware (route protection)
└── next-auth.d.ts                   # Type augmentation
```

## 2.3 NextAuth Configuration

### CredentialsProvider — Token Relay

The `authorize` function does NOT call any API. It simply relays the tokens that the frontend already obtained from `verify-otp` or `complete-register`:

```typescript
Credentials({
  credentials: {
    accessToken: {},
    refreshToken: {},
    userId: {},
    email: {},
    name: {},
  },
  async authorize(credentials) {
    if (!credentials?.accessToken) return null;
    return {
      id: credentials.userId as string,
      email: credentials.email as string,
      name: credentials.name as string,
      accessToken: credentials.accessToken as string,
      refreshToken: credentials.refreshToken as string,
    };
  },
});
```

### JWT Callback — Token Storage & Auto-Refresh

```typescript
async jwt({ token, user }) {
  // First sign-in: store tokens from authorize()
  if (user) {
    return {
      ...token,
      accessToken: user.accessToken,
      refreshToken: user.refreshToken,
      accessTokenExp: decodeJwtExp(user.accessToken) / 1000,
      userId: user.id,
    };
  }

  // Subsequent calls: check expiry, refresh if needed
  if (isTokenExpired(token)) {
    return refreshJwt(token);  // Mutex-protected refresh
  }

  return token;
}
```

### Mutex-Protected Refresh

Concurrent requests from the same Next.js process share a single in-flight refresh call:

```typescript
let pendingRefresh: Promise<...> | null = null;

async function refreshJwt(token: JWT): Promise<JWT> {
  if (pendingRefresh) {
    // Another request is already refreshing — reuse its result
    const result = await pendingRefresh;
    return { ...token, ...result };
  }

  pendingRefresh = refreshAccessToken(token.refreshToken);
  try {
    const result = await pendingRefresh;
    return { ...token, ...result };
  } finally {
    pendingRefresh = null;
  }
}
```

This prevents multiple concurrent requests from each triggering a refresh, which would cause the 30-second grace window on the backend to be needed less frequently.

### Session Callback

```typescript
async session({ session, token }) {
  session.accessToken = token.accessToken;
  session.user.id = token.userId;
  if (token.error) session.error = token.error;
  return session;
}
```

### Type Augmentation

```typescript
// next-auth.d.ts
declare module "next-auth" {
  interface User {
    accessToken?: string;
    refreshToken?: string;
  }
  interface Session {
    accessToken: string;
    error?: string;
    user: { id: string; name: string; email: string };
  }
}
declare module "next-auth/jwt" {
  interface JWT {
    accessToken?: string;
    refreshToken?: string;
    accessTokenExpires?: number;
    userId?: string;
    error?: string;
  }
}
```

## 2.4 AuthFlow Component — Multi-Step UI

A `"use client"` component with 3 steps managed by local state:

### State

```typescript
type Step = "email" | "otp" | "name";
const [step, setStep] = useState<Step>("email");
const [email, setEmail] = useState("");
const [otp, setOtp] = useState<string[]>(["", "", "", ""]);
const [name, setName] = useState("");
const [loading, setLoading] = useState(false);
const [error, setError] = useState("");
const [cooldown, setCooldown] = useState(0);
```

### Step 1: Email

- Single input field with placeholder "you@example.com"
- "Continue" button
- Calls `publicFetcher(AUTH_REQUEST_OTP, { data: { email } })`
- On success: moves to OTP step, starts 60s cooldown timer

### Step 2: OTP

- 4 individual digit inputs
- **Auto-advance:** typing a digit auto-focuses the next input
- **Paste support:** pasting "1234" distributes digits across all 4 inputs
- **Backspace:** on empty input, focuses previous input
- **Auto-submit:** when all 4 digits filled, automatically calls verify
- "Resend code" link (disabled during cooldown)
- Calls `publicFetcher(AUTH_VERIFY_OTP, { data: { email, code } })`
- **Existing user:** calls `signIn("credentials", { ...tokens })` → redirect to dashboard
- **New user:** moves to Name step

### Step 3: Name (registration only)

- Name input with label
- "Create account" button
- Calls `publicFetcher(AUTH_COMPLETE_REGISTER, { data: { email, code, name } })`
- Then `signIn("credentials", { ...tokens })` → redirect to dashboard

### Cooldown Timer

```typescript
useEffect(() => {
  if (cooldown <= 0) return;
  const timer = setInterval(() => setCooldown((c) => c - 1), 1000);
  return () => clearInterval(timer);
}, [cooldown]);
```

## 2.5 Public Fetcher

Lightweight client-side fetcher for unauthenticated endpoints:

```typescript
const API_BASE = "/api";

export async function publicFetcher<T>(endpoint: string, options = {}): Promise<T> {
  const { method = "POST", data } = options;

  const response = await fetch(`${API_BASE}${endpoint}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: data ? JSON.stringify(data) : undefined,
  });

  const json = await response.json();

  if (!response.ok) {
    throw new Error(json.message || "Request failed");
  }

  return json;
}
```

Requests go through Next.js rewrites: `/api/v1/*` → backend API.

## 2.6 API Proxy

Two proxy layers:

### Next.js Rewrites (`next.config.ts`)

```typescript
async rewrites() {
  return [
    { source: "/api/v1/:path*", destination: `${API_URL}/api/v1/:path*` },
  ];
}
```

Used by `publicFetcher` for OTP endpoints. Client-side requests to `/api/v1/auth/request-otp` are proxied to the backend.

### Data Proxy Route (`/api/data/[...path]/route.ts`)

Server-side proxy for authenticated requests. `apiFetcher` (server action) attaches the Bearer token and routes through this proxy. The browser never talks to the NestJS API directly.

## 2.7 Middleware — Route Protection

```typescript
// proxy.ts
export default auth(function proxy(req) {
  const isAuthenticated = !!req.auth?.user;

  // Authenticated user on /auth → redirect to home
  if (authPages.includes(nextUrl.pathname) && isAuthenticated) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // Unauthenticated user on protected page → redirect to /auth
  if (!isPublicPage && !isAuthenticated) {
    return NextResponse.redirect(new URL(`/auth?callbackUrl=...`, req.url));
  }

  return intlMiddleware(req);
});
```

**Public pages:** only `/` (home). Everything else requires authentication.

**Auth pages:** `/auth` — if already authenticated, redirect to home.

## 2.8 Auth Providers

The auth layout wraps children with a lightweight provider set:

```tsx
export function AuthProviders({ children }) {
  return (
    <SessionProvider>
      <ThemeProvider attribute="class" defaultTheme="dark" enableSystem>
        {children}
      </ThemeProvider>
    </SessionProvider>
  );
}
```

Only `SessionProvider` (for `signIn`) and `ThemeProvider`. No SWR, no i18n, no toaster — those are in the dashboard layout.

---

# Part 3: Complete Auth Flows

## 3.1 Login Flow (Existing User)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser    │     │   Next.js    │     │  NestJS API  │
└──────┬──────┘     └──────┬───────┘     └──────┬──────┘
       │                    │                     │
       │ POST /api/v1/auth/request-otp           │
       │ { email }         │                     │
       │───────────────────│────────────────────>│
       │                    │                     │ Generate OTP
       │                    │                     │ Store in Redis
       │                    │                     │ Send email via Resend
       │                    │  { sent: true }     │
       │<───────────────────│<────────────────────│
       │                    │                     │
       │ [User checks email, gets code]           │
       │                    │                     │
       │ POST /api/v1/auth/verify-otp            │
       │ { email, code }   │                     │
       │───────────────────│────────────────────>│
       │                    │                     │ Verify OTP (timing-safe)
       │                    │                     │ Find user by email
       │                    │                     │ Delete OTP from Redis
       │                    │                     │ Generate JWT + refresh token
       │                    │                     │
       │  { accessToken, refreshToken, user,      │
       │    isNewUser: false }                    │
       │<───────────────────│<────────────────────│
       │                    │                     │
       │ signIn("credentials", { tokens })       │
       │───────────────────>│                     │
       │                    │ authorize() relays   │
       │                    │ jwt() stores tokens  │
       │                    │ Set cookie           │
       │ Redirect → /dashboard/audios             │
       │<───────────────────│                     │
```

## 3.2 Registration Flow (New User)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser    │     │   Next.js    │     │  NestJS API  │
└──────┬──────┘     └──────┬───────┘     └──────┬──────┘
       │                    │                     │
       │ POST /api/v1/auth/request-otp           │
       │ { email }         │                     │
       │───────────────────│────────────────────>│
       │                    │  { sent: true }     │
       │<───────────────────│<────────────────────│
       │                    │                     │
       │ POST /api/v1/auth/verify-otp            │
       │ { email, code }   │                     │
       │───────────────────│────────────────────>│
       │                    │                     │ Verify OTP
       │                    │                     │ No user found
       │                    │                     │ Mark OTP as verified
       │                    │                     │ Reset TTL to 300s
       │  { verified: true, isNewUser: true }     │
       │<───────────────────│<────────────────────│
       │                    │                     │
       │ [Show name input step]                   │
       │                    │                     │
       │ POST /api/v1/auth/complete-register     │
       │ { email, code, name }                   │
       │───────────────────│────────────────────>│
       │                    │                     │ Re-verify OTP + verified flag
       │                    │                     │ Create user
       │                    │                     │ Delete OTP from Redis
       │                    │                     │ Generate tokens
       │  { accessToken, refreshToken, user }     │
       │<───────────────────│<────────────────────│
       │                    │                     │
       │ signIn("credentials", { tokens })       │
       │───────────────────>│                     │
       │ Redirect → /dashboard/audios             │
       │<───────────────────│                     │
```

## 3.3 Token Refresh Flow (Automatic)

```
┌─────────────┐     ┌──────────────┐     ┌─────────────┐
│   Browser    │     │   Next.js    │     │  NestJS API  │
└──────┬──────┘     └──────┬───────┘     └──────┬──────┘
       │                    │                     │
       │ Any authenticated request               │
       │───────────────────>│                     │
       │                    │ jwt() callback runs  │
       │                    │ Check: accessTokenExp │
       │                    │   < Date.now()?      │
       │                    │                     │
       │                    │ YES → refresh needed │
       │                    │                     │
       │                    │ POST /api/v1/auth/refresh
       │                    │ { refreshToken }    │
       │                    │────────────────────>│
       │                    │                     │ Revoke old refresh token
       │                    │                     │ Generate new token pair
       │                    │ { new accessToken,  │
       │                    │   new refreshToken } │
       │                    │<────────────────────│
       │                    │                     │
       │                    │ Update JWT cookie    │
       │                    │ with new tokens      │
       │                    │                     │
       │                    │ Continue with request │
       │ Response           │ using new accessToken│
       │<───────────────────│────────────────────>│
```

## 3.4 Concurrent Request Handling

When multiple requests arrive simultaneously with an expired access token:

```
Request A ──┐
Request B ──┤──→ jwt() callback ──→ pendingRefresh exists?
Request C ──┘                           │
                                   NO (first) → call refresh API
                                        │         (mutex: pendingRefresh = promise)
                                   YES (others) → await pendingRefresh
                                        │
                                   All 3 get same new tokens
                                   pendingRefresh = null
```

On the backend, if the first request already rotated the token and requests B/C arrive with the revoked token:

```
Request B/C → refresh(revokedToken)
            → revokedAt is set
            → msSinceRevoked < 30,000ms (grace window)
            → Find latest active token for this user
            → Return new access token + existing refresh token
```

---

# Part 4: Security Considerations

## 4.1 OTP Security

| Threat                                          | Mitigation                                                                  |
| ----------------------------------------------- | --------------------------------------------------------------------------- |
| Brute force (10,000 possibilities for 4 digits) | 3 attempts max per code, then code is deleted                               |
| Code spam (requesting many codes)               | 60s cooldown + 5/hour rate limit + @Throttle per IP                         |
| Timing attack on code comparison                | `crypto.timingSafeEqual` for constant-time comparison                       |
| Email enumeration                               | `request-otp` always returns `{ sent: true }` regardless of email existence |
| Replay attack                                   | OTP deleted from Redis immediately after successful verification            |
| Registration window abuse                       | Verified OTP gets fresh 300s TTL, then auto-expires                         |

## 4.2 Token Security

| Threat                         | Mitigation                                           |
| ------------------------------ | ---------------------------------------------------- |
| Access token theft             | Short-lived (15 min), JWT signature verification     |
| Refresh token theft            | Stored in DB, rotated on each use, 7-day expiry      |
| Concurrent token rotation race | 30-second grace window + mutex on frontend           |
| Session hijacking              | Refresh tokens can be revoked via session management |
| Cookie tampering               | NextAuth signs the JWT cookie                        |

## 4.3 Network Security

| Layer             | Protection                                      |
| ----------------- | ----------------------------------------------- |
| Browser → Next.js | HTTPS (Vercel/domain SSL)                       |
| Next.js → NestJS  | Internal network (rewrite proxy) or HTTPS       |
| Email delivery    | Resend handles TLS, DKIM via domain DNS records |

---

# Part 5: Reproducing This System

## 5.1 Backend Checklist

1. **Install dependencies:** `ioredis`, `resend`, `@nestjs/jwt`, `@nestjs/throttler`
2. **Create RedisModule:** global, provides ioredis client via injection token
3. **Create EmailModule:** global, wraps Resend with configurable sender
4. **Create OtpService:** Redis-backed with generate, verify, markVerified, isVerified, delete
5. **Create AuthService:** requestOtp, verifyOtp, completeRegister, generateTokens, refresh, logout
6. **Create AuthController:** map endpoints with @Public(), @Throttle()
7. **Create JwtAuthGuard:** global APP_GUARD with @Public() bypass
8. **Prisma models:** User (no password), RefreshToken (with expiry + revocation)
9. **Environment variables:** JWT_SECRET, REDIS_URL, RESEND_API_KEY, EMAIL_FROM

## 5.2 Frontend Checklist

1. **Install dependencies:** `next-auth@5` (beta)
2. **Configure NextAuth:** CredentialsProvider as token relay, JWT strategy, auto-refresh in jwt callback
3. **Create publicFetcher:** lightweight client-side fetch for unauthenticated endpoints
4. **Create AuthFlow component:** multi-step (email → OTP → name), auto-advance OTP inputs
5. **Configure middleware:** protect all routes except home, redirect to /auth
6. **Configure rewrites:** proxy `/api/v1/*` to backend
7. **Type augmentation:** extend NextAuth User, Session, JWT interfaces
8. **Auth providers:** SessionProvider + ThemeProvider for auth layout
