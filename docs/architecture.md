# Yappie — Architecture Documentation

## System Overview

```mermaid
graph TB
    subgraph Client
        Browser[Web Browser]
    end

    subgraph Frontend["Frontend (Vercel)"]
        NextJS[Next.js 16<br/>App Router + React 19]
        NextAuth[NextAuth v5<br/>JWT Sessions]
    end

    subgraph Backend["Backend (Coolify)"]
        NestJS[NestJS 11<br/>REST API + WebSocket]
        BullMQ[BullMQ<br/>Job Queue]
        Worker[Audio Processor<br/>Worker]
    end

    subgraph External
        OpenAI[OpenAI API<br/>Whisper + GPT-4o]
        Resend[Resend<br/>Email OTP]
        Jira[Jira Cloud<br/>OAuth 2.0]
    end

    subgraph Data
        Postgres[(PostgreSQL 16)]
        Redis[(Redis 7)]
    end

    Browser -->|HTTPS| NextJS
    NextJS -->|Rewrite Proxy| NestJS
    NextAuth -->|JWT Refresh| NestJS
    NestJS -->|Queries| Postgres
    NestJS -->|OTP + Cache| Redis
    NestJS -->|Enqueue Jobs| BullMQ
    BullMQ -->|Process| Worker
    Worker -->|Transcribe + Generate| OpenAI
    NestJS -->|Send OTP| Resend
    NestJS -->|Export Tickets| Jira
    Worker -->|WebSocket| Browser
```

## Data Model

```mermaid
erDiagram
    User ||--o{ RefreshToken : has
    User ||--o{ AudioRecording : uploads
    User ||--o{ Ticket : owns
    User ||--o{ Project : creates
    User ||--o{ Integration : connects
    User ||--o{ TicketTemplate : defines
    User ||--o{ UsageEvent : generates
    User ||--o{ Subscription : subscribes

    AudioRecording ||--o{ Ticket : generates
    Project ||--o{ AudioRecording : groups
    Project ||--o{ Ticket : categorizes

    User {
        string id PK
        string email UK
        string name
        datetime createdAt
        datetime updatedAt
    }

    RefreshToken {
        string id PK
        string token UK
        string userId FK
        datetime expiresAt
        datetime revokedAt
    }

    AudioRecording {
        string id PK
        string fileName
        string filePath
        int fileSize
        string mimeType
        string status
        string transcription
        float duration
        string userId FK
        string projectId FK
    }

    Ticket {
        string id PK
        string title
        string description
        string status
        string priority
        string jiraIssueKey
        string jiraIssueUrl
        string audioRecordingId FK
        string projectId FK
        string userId FK
    }

    Project {
        string id PK
        string name
        string description
        string context
        string userId FK
    }

    Integration {
        string id PK
        string type
        string accessToken
        string refreshToken
        string cloudId
        string siteName
        string userId FK
    }

    Subscription {
        string id PK
        string plan
        datetime billingCycleStart
        string userId FK
    }
```

## Audio Processing Pipeline

```mermaid
sequenceDiagram
    actor User
    participant Web as Next.js
    participant API as NestJS API
    participant Queue as BullMQ
    participant Worker as Audio Processor
    participant AI as OpenAI
    participant WS as WebSocket
    participant DB as PostgreSQL

    User->>Web: Upload audio file
    Web->>API: POST /audio/upload (multipart)
    API->>API: Validate file (type, size, quota)
    API->>DB: Create AudioRecording (PENDING)
    API->>Queue: Enqueue job (audioId, userId)
    API-->>Web: 201 { id, status: PENDING }

    Queue->>Worker: Process job
    Worker->>DB: Update status → TRANSCRIBING
    Worker->>WS: emit audio:progress (TRANSCRIBING)
    Worker->>AI: Whisper transcribe (audio buffer)
    AI-->>Worker: { text, duration }
    Worker->>DB: Save transcription + duration

    Worker->>DB: Update status → ANALYZING
    Worker->>WS: emit audio:progress (ANALYZING)
    Worker->>AI: GPT decompose (transcription + project context)
    AI-->>Worker: tasks[]
    Worker->>AI: GPT generate tickets (tasks + project context)
    AI-->>Worker: tickets[] (title, description, priority)

    Worker->>DB: $transaction: create all tickets
    Worker->>DB: Update status → COMPLETED
    Worker->>WS: emit audio:completed (ticketCount)

    WS-->>Web: Real-time update
    Web-->>User: Show generated tickets
```

## Authentication Flow (Passwordless OTP)

```mermaid
sequenceDiagram
    actor User
    participant Web as Next.js (/auth)
    participant API as NestJS API
    participant Redis as Redis
    participant Email as Resend

    User->>Web: Enter email
    Web->>API: POST /auth/request-otp { email }
    API->>Redis: Store OTP (4 digits, 10min TTL)
    API->>Redis: Set cooldown (60s)
    API->>Redis: Increment rate counter
    API->>Email: Send OTP email
    API-->>Web: { sent: true }

    User->>Web: Enter 4-digit code
    Web->>API: POST /auth/verify-otp { email, code }
    API->>Redis: Verify code (timingSafeEqual)

    alt Existing User
        API->>Redis: Delete OTP
        API-->>Web: { accessToken, refreshToken, user, isNewUser: false }
        Web->>Web: signIn("credentials", tokens) → set cookie
        Web-->>User: Redirect to dashboard
    else New User
        API->>Redis: Mark verified (5min TTL)
        API-->>Web: { verified: true, isNewUser: true }
        User->>Web: Enter name
        Web->>API: POST /auth/complete-register { email, code, name }
        API->>Redis: Re-verify + delete
        API-->>Web: { accessToken, refreshToken, user }
        Web->>Web: signIn("credentials", tokens) → set cookie
        Web-->>User: Redirect to dashboard
    end
```

## Token Refresh Flow

```mermaid
sequenceDiagram
    participant Browser
    participant NextAuth as NextAuth JWT Callback
    participant API as NestJS API
    participant DB as PostgreSQL

    Browser->>NextAuth: Any authenticated request
    NextAuth->>NextAuth: Check accessTokenExp < Date.now()

    alt Token expired
        NextAuth->>NextAuth: Acquire mutex (pendingRefresh)
        NextAuth->>API: POST /auth/refresh { refreshToken }
        API->>DB: Find RefreshToken + User
        API->>DB: Revoke old token
        API->>DB: Create new token pair
        API-->>NextAuth: { new accessToken, new refreshToken }
        NextAuth->>NextAuth: Update JWT cookie
        NextAuth->>NextAuth: Release mutex
    else Token valid
        NextAuth->>NextAuth: Continue with existing token
    end

    NextAuth-->>Browser: Response with valid session
```

## Jira Integration Flow

```mermaid
sequenceDiagram
    actor User
    participant Web as Next.js
    participant API as NestJS API
    participant Jira as Jira Cloud

    Note over User,Jira: OAuth 2.0 Connection
    User->>Web: Click "Connect Jira"
    Web->>API: GET /integrations/jira/auth
    API-->>Web: { url: "https://auth.atlassian.com/..." }
    Web-->>User: Redirect to Atlassian
    User->>Jira: Authorize Yappie
    Jira-->>API: GET /callback?code=xxx&state=userId
    API->>Jira: Exchange code for tokens
    API->>API: Encrypt tokens (AES-256-GCM)
    API-->>Web: Redirect to /settings?jira=connected

    Note over User,Jira: Ticket Export
    User->>Web: Click "Export to Jira"
    Web->>API: POST /integrations/jira/export/:ticketId
    API->>API: Decrypt Jira tokens
    API->>Jira: Check token expiry, refresh if needed
    API->>Jira: POST /rest/api/3/issue (create issue)
    Jira-->>API: { key: "YAP-123", url: "..." }
    API-->>Web: { jiraIssueKey, jiraIssueUrl }
    Web-->>User: Show Jira link on ticket
```

## Deployment Architecture

```mermaid
graph TB
    subgraph Internet
        DNS[yappie.gueden.com]
    end

    subgraph Vercel
        Web[Next.js App<br/>SSR + Static]
    end

    subgraph Coolify["Coolify (Docker)"]
        API[NestJS API<br/>Multi-stage Docker]
        Postgres[(PostgreSQL 16<br/>Named Volume)]
        Redis[(Redis 7<br/>Named Volume)]
        Uploads[(Uploads<br/>Named Volume)]
    end

    subgraph GitHub
        Repo[Repository]
        CI[GitHub Actions<br/>CI Pipeline]
    end

    DNS -->|Web| Vercel
    DNS -->|API| Coolify
    Web -->|Rewrite /api/v1/*| API
    API --> Postgres
    API --> Redis
    API --> Uploads
    Repo -->|Push| CI
    CI -->|Webhook| Coolify
    Repo -->|Auto-deploy| Vercel
```

## Module Dependency Graph

```mermaid
graph TD
    App[AppModule]

    App --> Auth[AuthModule]
    App --> Audio[AudioModule]
    App --> Tickets[TicketsModule]
    App --> Projects[ProjectsModule]
    App --> Integrations[IntegrationsModule]
    App --> Analytics[AnalyticsModule]
    App --> Users[UsersModule]
    App --> Templates[TemplatesModule]
    App --> Quotas[QuotasModule]

    subgraph Global Modules
        Prisma[PrismaModule]
        RedisM[RedisModule]
        EmailM[EmailModule]
        Storage[StorageModule]
        Crypto[CryptoModule]
        Common[CommonModule]
    end

    Auth --> Prisma
    Auth --> RedisM
    Auth --> EmailM
    Audio --> Prisma
    Audio --> Storage
    Audio --> Tickets
    Audio --> Analytics
    Audio --> Quotas
    Integrations --> Prisma
    Integrations --> Crypto
```

## Frontend Component Architecture

```mermaid
graph TD
    subgraph "Root Layout (RSC)"
        Theme[ThemeWrapper]
    end

    subgraph "Dashboard Layout"
        Providers[Providers<br/>Session + SWR + i18n + Theme + Toaster]
        DashContent[DashboardContent<br/>Sidebar + Main]
    end

    subgraph "Auth Layout"
        AuthProv[AuthProviders<br/>Session + Theme]
    end

    subgraph "Feature Modules"
        AuthFlow[AuthFlow<br/>Email → OTP → Name]
        AudioList[AudioList]
        AudioUpload[AudioUpload]
        TicketList[TicketList]
        TicketDetail[TicketDetail]
        ProjectList[ProjectList]
        ProjectForm[ProjectForm]
        AnalyticsDash[AnalyticsDashboard]
        Settings[SettingsPage]
    end

    Theme --> Providers
    Theme --> AuthProv
    Providers --> DashContent
    DashContent --> AudioList
    DashContent --> AudioUpload
    DashContent --> TicketList
    DashContent --> TicketDetail
    DashContent --> ProjectList
    DashContent --> ProjectForm
    DashContent --> AnalyticsDash
    DashContent --> Settings
    AuthProv --> AuthFlow
```
