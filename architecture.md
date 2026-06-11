# CareerAI Copilot — System Architecture Document

**Version:** 1.0  
**Date:** June 2026  
**Author:** Kavya  
**Reference:** [`problem_statement.md`](./problem_statement.md)

---

## Table of Contents

1. [Architecture Overview](#1-architecture-overview)
2. [Deployment Topology](#2-deployment-topology)
3. [Monorepo Structure](#3-monorepo-structure)
4. [Frontend Architecture (Next.js 16)](#4-frontend-architecture)
5. [API Layer Architecture](#5-api-layer-architecture)
6. [Job Scraping Service (Python FastAPI)](#6-job-scraping-service)
7. [LLM Pipeline Architecture](#7-llm-pipeline-architecture)
8. [Email Engine Architecture](#8-email-engine-architecture)
9. [Data Architecture](#9-data-architecture)
10. [Caching Architecture (Redis)](#10-caching-architecture)
11. [Authentication & Authorization](#11-authentication--authorization)
12. [Real-Time Communication (WebSocket + SSE)](#12-real-time-communication)
13. [File Storage Architecture](#13-file-storage-architecture)
14. [Context Handoff Protocol](#14-context-handoff-protocol)
15. [Error Handling Strategy](#15-error-handling-strategy)
16. [Security Architecture](#16-security-architecture)
17. [Observability & Monitoring](#17-observability--monitoring)
18. [Scalability & Performance](#18-scalability--performance)
19. [CI/CD Pipeline](#19-cicd-pipeline)
20. [Component Interaction Map](#20-component-interaction-map)

---

## 1. Architecture Overview

CareerAI Copilot is a **distributed, event-driven SaaS platform** built on a **polyglot microservice** pattern. The core insight is that each of the three source repositories represents a distinct bounded context with its own language and runtime:

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│                         CareerAI Copilot — System Topology                       │
│                                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                    BROWSER  (React Client)                                │   │
│  │  Next.js RSC hydration · Zustand · React Query · WebSocket client        │   │
│  └────────────────────────────┬─────────────────────────────────────────────┘   │
│                               │ HTTPS + WSS                                      │
│  ┌────────────────────────────▼─────────────────────────────────────────────┐   │
│  │                    VERCEL EDGE  (CDN + Middleware)                         │   │
│  │  Rate limiting · JWT verification · Auth middleware · Static assets       │   │
│  └────────────┬───────────────────────────────────────┬──────────────────────┘  │
│               │                                       │                           │
│  ┌────────────▼──────────────────┐   ┌───────────────▼──────────────────────┐   │
│  │  NEXT.JS APP SERVER           │   │  PYTHON SCRAPER SERVICE               │   │
│  │  (Vercel Serverless)          │   │  (Railway / Render)                   │   │
│  │                               │   │                                       │   │
│  │  Route Handlers (API)         │   │  FastAPI endpoints                    │   │
│  │  React Server Components      │   │  BaseScraper → 3 platform scrapers    │   │
│  │  NextAuth.js sessions         │   │  asyncio parallel execution           │   │
│  │  Groq LLM calls               │   │  Redis Bull queue worker              │   │
│  │  Nodemailer SMTP               │   │  SQLAlchemy DB writes                 │   │
│  │  Playwright PDF export         │   │                                       │   │
│  └────────────┬──────────────────┘   └───────────────┬──────────────────────┘   │
│               │                                       │                           │
│  ┌────────────▼───────────────────────────────────────▼──────────────────────┐  │
│  │                          DATA LAYER                                         │  │
│  │                                                                             │  │
│  │  ┌─────────────────┐  ┌──────────────────┐  ┌────────────────────────┐    │  │
│  │  │  PostgreSQL      │  │  Redis (Upstash) │  │  Vercel Blob / S3      │    │  │
│  │  │  (Neon)          │  │  Cache + Queue   │  │  Resume files          │    │  │
│  │  │  Primary store   │  │  Sessions        │  │  PDF exports           │    │  │
│  │  └─────────────────┘  └──────────────────┘  └────────────────────────┘    │  │
│  └─────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                   │
│  ┌──────────────────────────────────────────────────────────────────────────┐   │
│  │                        EXTERNAL SERVICES                                   │   │
│  │  Groq API (LLM) · Firecrawl (scraping) · Gmail SMTP · Google OAuth       │   │
│  │  Sentry (errors) · Vercel Analytics · Gemini API (LLM fallback)          │   │
│  └──────────────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────────────┘
```

### Architectural Principles

| Principle | Implementation |
|---|---|
| **Separation of concerns** | Python handles scraping; Node.js handles LLM + email; DB is read-only from client |
| **Context propagation** | Job → Resume → Email context passed via typed interfaces, never re-entered |
| **Human in the loop** | Email sending is impossible without server-side `confirmed: true` |
| **Graceful degradation** | Scraper failure returns partial results; LLM cache miss triggers fresh call; Redis miss falls back to DB |
| **Defense in depth** | Validation at edge (middleware) + API route (Zod) + DB (constraints) |
| **Stateless services** | All services are horizontally scalable; state lives in PostgreSQL + Redis |

---

## 2. Deployment Topology

```
                         ┌─────────────────────────┐
                         │     DNS / Cloudflare     │
                         │   careerai.app           │
                         └──────────┬──────────────┘
                                    │
                    ┌───────────────▼──────────────────┐
                    │        Vercel (Primary)            │
                    │                                    │
                    │  ┌─────────────────────────────┐  │
                    │  │   Edge Middleware             │  │
                    │  │   • JWT verification          │  │
                    │  │   • Rate limiting             │  │
                    │  │   • Geo routing               │  │
                    │  └──────────────┬───────────────┘  │
                    │                 │                   │
                    │  ┌──────────────▼───────────────┐  │
                    │  │  Serverless Functions          │  │
                    │  │  (Next.js API Routes)          │  │
                    │  │  Region: iad1 (US East)        │  │
                    │  └──────────────────────────────┘  │
                    │                                    │
                    │  ┌──────────────────────────────┐  │
                    │  │  Static Assets (CDN)           │  │
                    │  │  JS chunks, fonts, images      │  │
                    │  └──────────────────────────────┘  │
                    └───────────────────────────────────┘
                                    │
          ┌─────────────────────────┼─────────────────────────┐
          │                         │                         │
┌─────────▼──────────┐   ┌──────────▼──────────┐   ┌────────▼────────────┐
│  Railway           │   │  Neon (PostgreSQL)   │   │  Upstash (Redis)    │
│                    │   │                      │   │                     │
│  Python FastAPI    │   │  Primary DB          │   │  Cache + Sessions   │
│  Scraper Service   │   │  Connection pooling  │   │  Bull job queues    │
│  2 replicas        │   │  Read replicas       │   │  Rate limiting      │
│  512MB RAM each    │   │  Auto-pause on idle  │   │  Pub/Sub (WS)       │
└────────────────────┘   └──────────────────────┘   └─────────────────────┘
          │
┌─────────▼──────────┐
│  Vercel Blob       │
│                    │
│  Resume PDFs       │
│  Resume DOCXs      │
│  Exported PDFs     │
│  User avatars      │
└────────────────────┘
```

### Environment Matrix

| Environment | Frontend | Backend | Database | Purpose |
|---|---|---|---|---|
| **Development** | `localhost:3000` | `localhost:8000` | Local PostgreSQL | Local dev |
| **Preview** | Vercel preview URL | Railway preview | Neon preview branch | PR review |
| **Staging** | `staging.careerai.app` | Railway staging | Neon staging | QA + integration |
| **Production** | `careerai.app` | Railway production | Neon production | Live users |

---

## 3. Monorepo Structure

**Build system:** Turborepo with pnpm workspaces.

```
careerai-copilot/                          ← Turborepo root
├── apps/
│   ├── web/                               ← Next.js 16 platform app
│   │   ├── src/
│   │   │   ├── app/                       ← App Router pages & routes
│   │   │   │   ├── (auth)/               ← Public auth routes
│   │   │   │   │   ├── login/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   ├── register/
│   │   │   │   │   │   └── page.tsx
│   │   │   │   │   └── onboarding/
│   │   │   │   │       ├── page.tsx
│   │   │   │   │       └── layout.tsx
│   │   │   │   │
│   │   │   │   ├── (dashboard)/          ← Protected dashboard routes
│   │   │   │   │   ├── layout.tsx        ← Sidebar + navigation shell
│   │   │   │   │   ├── dashboard/
│   │   │   │   │   │   └── page.tsx      ← Stats + kanban + activity
│   │   │   │   │   ├── jobs/
│   │   │   │   │   │   ├── page.tsx      ← Job search + results
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx  ← Job detail modal
│   │   │   │   │   ├── resumes/
│   │   │   │   │   │   ├── page.tsx      ← Resume library
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx  ← Single resume viewer
│   │   │   │   │   ├── analyze/
│   │   │   │   │   │   ├── page.tsx      ← Input form (JD + resume)
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── page.tsx  ← Analysis results
│   │   │   │   │   │       └── editor/
│   │   │   │   │   │           └── page.tsx  ← Diff editor
│   │   │   │   │   ├── emails/
│   │   │   │   │   │   ├── page.tsx      ← Email history
│   │   │   │   │   │   ├── compose/
│   │   │   │   │   │   │   └── page.tsx  ← Email generator form
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       └── page.tsx  ← Review / confirm gate
│   │   │   │   │   ├── analytics/
│   │   │   │   │   │   └── page.tsx      ← Charts + funnel
│   │   │   │   │   └── settings/
│   │   │   │   │       └── page.tsx      ← User profile + credentials
│   │   │   │   │
│   │   │   │   ├── api/                  ← Next.js Route Handlers
│   │   │   │   │   ├── auth/
│   │   │   │   │   │   └── [...nextauth]/route.ts
│   │   │   │   │   ├── profile/
│   │   │   │   │   │   └── route.ts
│   │   │   │   │   ├── jobs/
│   │   │   │   │   │   ├── route.ts          ← GET saved jobs
│   │   │   │   │   │   ├── search/
│   │   │   │   │   │   │   └── route.ts      ← POST trigger search
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── route.ts
│   │   │   │   │   │       ├── save/route.ts
│   │   │   │   │   │       ├── status/route.ts
│   │   │   │   │   │       └── details/route.ts
│   │   │   │   │   ├── resumes/
│   │   │   │   │   │   ├── route.ts
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── route.ts
│   │   │   │   │   │       └── set-base/route.ts
│   │   │   │   │   ├── analyze/
│   │   │   │   │   │   ├── route.ts          ← POST start analysis (SSE)
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── route.ts
│   │   │   │   │   │       └── export/route.ts
│   │   │   │   │   ├── emails/
│   │   │   │   │   │   ├── route.ts
│   │   │   │   │   │   ├── generate/route.ts
│   │   │   │   │   │   └── [id]/
│   │   │   │   │   │       ├── route.ts
│   │   │   │   │   │       ├── send/route.ts ← confirmed: true check
│   │   │   │   │   │       ├── draft-save/route.ts
│   │   │   │   │   │       └── reply/route.ts
│   │   │   │   │   └── analytics/
│   │   │   │   │       ├── overview/route.ts
│   │   │   │   │       ├── funnel/route.ts
│   │   │   │   │       └── ats-trends/route.ts
│   │   │   │   │
│   │   │   │   ├── layout.tsx            ← Root layout (fonts, providers)
│   │   │   │   ├── page.tsx              ← Landing page
│   │   │   │   └── globals.css
│   │   │   │
│   │   │   ├── components/
│   │   │   │   ├── jobs/
│   │   │   │   │   ├── JobCard.tsx
│   │   │   │   │   ├── JobGrid.tsx
│   │   │   │   │   ├── JobFilters.tsx
│   │   │   │   │   ├── JobKanban.tsx
│   │   │   │   │   ├── JobDetailModal.tsx
│   │   │   │   │   └── JobSearchForm.tsx
│   │   │   │   ├── resume/
│   │   │   │   │   ├── ScoreCard.tsx          ← [REUSED from Resume-Shapeshifter]
│   │   │   │   │   ├── SideBySideDiff.tsx     ← [REUSED + EXTENDED]
│   │   │   │   │   ├── GapAnalysis.tsx        ← [REUSED]
│   │   │   │   │   ├── ResumeInput.tsx        ← [REUSED]
│   │   │   │   │   ├── PDFExportButton.tsx    ← [REUSED]
│   │   │   │   │   ├── ResumeLibrary.tsx      ← [NEW]
│   │   │   │   │   └── ResumeVersionList.tsx  ← [NEW]
│   │   │   │   ├── email/
│   │   │   │   │   ├── EmailComposer.tsx
│   │   │   │   │   ├── EmailConfirmGate.tsx   ← Critical UX component
│   │   │   │   │   ├── EmailPreview.tsx
│   │   │   │   │   ├── EmailHistory.tsx
│   │   │   │   │   └── FollowUpWidget.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── StatsCard.tsx
│   │   │   │   │   ├── ActivityFeed.tsx
│   │   │   │   │   ├── FunnelChart.tsx
│   │   │   │   │   ├── ApplicationKanban.tsx
│   │   │   │   │   └── ReminderWidget.tsx
│   │   │   │   └── ui/                        ← Shadcn/UI + custom tokens
│   │   │   │       ├── button.tsx
│   │   │   │       ├── card.tsx
│   │   │   │       ├── dialog.tsx
│   │   │   │       ├── badge.tsx
│   │   │   │       ├── progress.tsx
│   │   │   │       ├── skeleton.tsx
│   │   │   │       ├── toast.tsx
│   │   │   │       └── ...shadcn components
│   │   │   │
│   │   │   ├── lib/
│   │   │   │   ├── db/
│   │   │   │   │   ├── client.ts             ← Prisma client singleton
│   │   │   │   │   ├── schema.prisma         ← Prisma schema (maps to SQL)
│   │   │   │   │   └── queries/
│   │   │   │   │       ├── jobs.ts
│   │   │   │   │       ├── resumes.ts
│   │   │   │   │       ├── analyses.ts
│   │   │   │   │       └── emails.ts
│   │   │   │   ├── groq.ts                   ← [REUSED + Gemini fallback]
│   │   │   │   ├── scraper-client.ts         ← HTTP → Python service
│   │   │   │   ├── email.ts                  ← Nodemailer wrapper
│   │   │   │   ├── redis.ts                  ← Redis client + helpers
│   │   │   │   ├── auth.ts                   ← NextAuth config
│   │   │   │   ├── storage.ts                ← Vercel Blob helpers
│   │   │   │   ├── pdf.ts                    ← [REUSED from RS]
│   │   │   │   ├── pdf-template.ts           ← [REUSED from RS]
│   │   │   │   ├── parser.ts                 ← [REUSED from RS]
│   │   │   │   ├── validators.ts             ← [REUSED from RS]
│   │   │   │   └── schemas/
│   │   │   │       ├── resume.ts             ← [REUSED + user_id, job_id]
│   │   │   │       ├── job.ts                ← [NEW]
│   │   │   │       ├── email.ts              ← [PORTED from Python dataclasses]
│   │   │   │       └── analysis.ts           ← [REUSED from RS]
│   │   │   │
│   │   │   ├── prompts/
│   │   │   │   ├── jd-extraction.ts          ← [REUSED from RS]
│   │   │   │   ├── resume-parser.ts          ← [REUSED from RS]
│   │   │   │   ├── match-scoring.ts          ← [REUSED from RS]
│   │   │   │   ├── bullet-rewriter.ts        ← [REUSED from RS]
│   │   │   │   └── email-generator.ts        ← [NEW — LLM email prompt]
│   │   │   │
│   │   │   ├── store/                        ← Zustand stores
│   │   │   │   ├── job-store.ts
│   │   │   │   ├── resume-store.ts
│   │   │   │   ├── analysis-store.ts
│   │   │   │   └── email-store.ts
│   │   │   │
│   │   │   └── hooks/                        ← React Query hooks
│   │   │       ├── useJobs.ts
│   │   │       ├── useResumes.ts
│   │   │       ├── useAnalysis.ts
│   │   │       └── useEmails.ts
│   │   │
│   │   ├── public/
│   │   ├── next.config.ts
│   │   ├── tailwind.config.ts
│   │   ├── tsconfig.json
│   │   └── package.json
│   │
│   └── scraper/                              ← Python FastAPI microservice
│       ├── main.py                           ← FastAPI app + endpoints
│       ├── scrapers/                         ← [DIRECTLY REUSED from job-agent]
│       │   ├── __init__.py
│       │   ├── base_scraper.py              ← BaseScraper ABC (unchanged)
│       │   ├── remoteok_scraper.py          ← RemoteOK (unchanged)
│       │   ├── naukri_scraper.py            ← Naukri (unchanged)
│       │   └── wellfound_scraper.py         ← Wellfound/Firecrawl (unchanged)
│       ├── utils/
│       │   ├── __init__.py
│       │   ├── data_cleaner.py              ← [DIRECTLY REUSED from job-agent]
│       │   └── relevance_scorer.py          ← [NEW] skill overlap scoring
│       ├── worker.py                         ← Redis Bull queue consumer
│       ├── db.py                             ← SQLAlchemy DB writer
│       ├── config.py                         ← .env config
│       ├── requirements.txt
│       └── Dockerfile
│
├── packages/
│   └── shared-types/                         ← Shared TypeScript types
│       ├── src/
│       │   ├── job.ts                        ← Job, UserJob interfaces
│       │   ├── resume.ts                     ← Resume, ResumeVersion interfaces
│       │   ├── email.ts                      ← EmailDraft, EmailSend interfaces
│       │   ├── user.ts                       ← UserProfile interface
│       │   └── analysis.ts                   ← AnalysisResult, Gap interfaces
│       ├── tsconfig.json
│       └── package.json
│
├── turbo.json                                ← Pipeline: build, test, lint, typecheck
├── pnpm-workspace.yaml
└── package.json
```

---

## 4. Frontend Architecture

### 4.1 Rendering Strategy

```
Page Route               Rendering     Why
─────────────────────────────────────────────────────────────
/                        Static SSG    Landing page, no auth required
/login, /register        Static SSG    Auth pages, minimal JS
/onboarding              SSR           User-specific flow
/dashboard               SSR + RSC     Server-fetches stats on load
/jobs                    CSR           Real-time search, dynamic filters
/analyze                 SSR           Load resume list server-side
/analyze/[id]            SSR + RSC     Server-fetches analysis result
/analyze/[id]/editor     CSR           Highly interactive diff editor
/emails                  SSR + RSC     Server-fetches email list
/emails/[id]             SSR           Single email view
/analytics               SSR + RSC     Pre-computed metrics
```

### 4.2 State Architecture

```
┌──────────────────────────────────────────────────────────────┐
│                    STATE MANAGEMENT LAYERS                    │
│                                                              │
│  Layer 1: URL State (Next.js Router)                        │
│  ─────────────────────────────────────────────────          │
│  Search params, pagination, filter state                     │
│  ?role=engineer&location=remote&page=2                      │
│                                                              │
│  Layer 2: Server State (React Query / TanStack Query)        │
│  ─────────────────────────────────────────────────          │
│  useJobs()       → GET /api/jobs/saved    (cache: 30s)      │
│  useResumes()    → GET /api/resumes       (cache: 60s)      │
│  useAnalysis(id) → GET /api/analyze/:id   (cache: 24h)      │
│  useEmails()     → GET /api/emails        (cache: 30s)      │
│                                                              │
│  Layer 3: Client State (Zustand)                            │
│  ─────────────────────────────────────────────────          │
│  jobStore    → { selectedJob, searchResults, filters }      │
│  resumeStore → { activeResume, uploadProgress }             │
│  analysisStore → { currentAnalysis, streamProgress }        │
│  emailStore  → { draft, confirmationState }                 │
│                                                              │
│  Layer 4: Form State (React Hook Form + Zod)                │
│  ─────────────────────────────────────────────────          │
│  Job search form, resume upload, email composer             │
└──────────────────────────────────────────────────────────────┘
```

### 4.3 Design System Tokens

```css
/* Design system — dark mode first */
:root {
  /* Brand */
  --brand-primary:    #6366F1;  /* Indigo 500 */
  --brand-secondary:  #8B5CF6;  /* Violet 500 */
  --brand-accent:     #06B6D4;  /* Cyan 500 */

  /* Surface (dark mode) */
  --surface-0:  #0A0A0F;  /* Page background */
  --surface-1:  #111118;  /* Card background */
  --surface-2:  #1A1A25;  /* Elevated card */
  --surface-3:  #24243A;  /* Input/hover */

  /* Text */
  --text-primary:   rgba(255,255,255,0.95);
  --text-secondary: rgba(255,255,255,0.60);
  --text-muted:     rgba(255,255,255,0.35);

  /* Semantic */
  --success: #10B981;  /* Emerald 500 */
  --warning: #F59E0B;  /* Amber 500 */
  --error:   #EF4444;  /* Red 500 */
  --info:    #3B82F6;  /* Blue 500 */

  /* Glassmorphism */
  --glass-bg:     rgba(255,255,255,0.04);
  --glass-border: rgba(255,255,255,0.08);
  --glass-blur:   12px;

  /* Typography */
  --font-sans: 'Plus Jakarta Sans', sans-serif;
  --font-mono: 'JetBrains Mono', monospace;
}
```

---

## 5. API Layer Architecture

### 5.1 Route Handler Pattern

Every API route follows this standard pattern:

```typescript
// apps/web/src/app/api/[resource]/route.ts

import { auth } from '@/lib/auth'
import { db } from '@/lib/db/client'
import { redis } from '@/lib/redis'
import { z } from 'zod'
import { NextRequest, NextResponse } from 'next/server'

const RequestSchema = z.object({ /* ... */ })

export async function POST(req: NextRequest) {
  // 1. Authentication check
  const session = await auth()
  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  // 2. Input validation
  const body = await req.json()
  const parsed = RequestSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.flatten() }, { status: 400 })
  }

  // 3. Rate limiting
  const key = `rate:${session.user.id}:${req.nextUrl.pathname}`
  const count = await redis.incr(key)
  if (count === 1) await redis.expire(key, 300)  // 5 min window
  if (count > RATE_LIMIT) {
    return NextResponse.json({ error: 'Rate limit exceeded' }, { status: 429 })
  }

  try {
    // 4. Business logic
    const result = await doBusinessLogic(parsed.data, session.user.id)

    // 5. Analytics event
    await db.analyticsEvents.create({
      data: { userId: session.user.id, eventType: 'ACTION_NAME', metadata: {} }
    })

    return NextResponse.json(result, { status: 200 })
  } catch (error) {
    // 6. Structured error response
    console.error('[API Error]', { path: req.nextUrl.pathname, error })
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
```

### 5.2 Middleware Stack (Vercel Edge)

```
Incoming Request
       ↓
[1] CORS headers (preflight)
       ↓
[2] JWT verification (NextAuth session)
       ↓
[3] Rate limiting check (Redis counter)
       ↓
[4] Auth route guard (redirect if not logged in)
       ↓
[5] Next.js App Router
       ↓
Route Handler
```

```typescript
// middleware.ts
export const config = {
  matcher: ['/(dashboard)/:path*', '/api/:path*']
}

export async function middleware(request: NextRequest) {
  const token = await getToken({ req: request })
  
  // API routes: 401 if not authenticated
  if (request.nextUrl.pathname.startsWith('/api/')) {
    if (!token) return new NextResponse('Unauthorized', { status: 401 })
  }

  // Dashboard routes: redirect to login
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    if (!token) return NextResponse.redirect(new URL('/login', request.url))
  }
  
  return NextResponse.next()
}
```

### 5.3 API Response Envelope

All API responses follow this consistent shape:

```typescript
// Success
{ data: T, meta?: { page, total, ... } }

// Error
{ error: string, details?: Record<string, string[]> }

// Streaming (SSE)
data: { step: "jd_extracted" | "resume_parsed" | "scored" | "rewritten", progress: 0-100 }\n\n
data: { type: "complete", result: AnalysisResult }\n\n
```

---

## 6. Job Scraping Service

### 6.1 FastAPI Service Structure

```python
# apps/scraper/main.py
from fastapi import FastAPI, BackgroundTasks, Header, HTTPException
from pydantic import BaseModel
import asyncio

app = FastAPI(title="CareerAI Scraper Service")

class SearchRequest(BaseModel):
    role: str
    location: str = ""
    experience: str = ""
    session_id: str
    user_id: str
    skills: list[str] = []

@app.post("/scrape")
async def trigger_scrape(
    req: SearchRequest,
    background_tasks: BackgroundTasks,
    x_api_key: str = Header(...)
):
    # Validate internal API key
    if x_api_key != settings.INTERNAL_API_KEY:
        raise HTTPException(status_code=403)
    
    # Queue job in Redis Bull
    await queue.add("scrape", req.dict())
    return {"status": "queued", "session_id": req.session_id}

@app.get("/health")
async def health():
    return {"status": "ok", "scrapers": ["remoteok", "naukri", "wellfound"]}
```

### 6.2 Worker — Parallel Scraping with asyncio

```python
# apps/scraper/worker.py

async def run_scrape_job(job_data: dict):
    role = job_data["role"]
    location = job_data["location"]
    session_id = job_data["session_id"]
    user_id = job_data["user_id"]
    user_skills = job_data.get("skills", [])

    # Run all 3 scrapers in parallel (asyncio + thread pool)
    loop = asyncio.get_event_loop()
    tasks = [
        loop.run_in_executor(None, RemoteOKScraper().scrape, role, location),
        loop.run_in_executor(None, NaukriScraper().scrape, role, location),
        loop.run_in_executor(None, WellfoundScraper().scrape, role, location),
    ]
    
    results = await asyncio.gather(*tasks, return_exceptions=True)
    
    all_jobs = []
    for source_name, result in zip(["RemoteOK", "Naukri", "Wellfound"], results):
        if isinstance(result, Exception):
            logger.error(f"{source_name} scraper failed: {result}")
            continue  # Graceful degradation
        all_jobs.extend(result)
    
    # Clean + deduplicate (reused from job-agent)
    cleaned = clean_and_deduplicate(all_jobs)
    
    # Score relevance against user skills
    scored = [score_relevance(job, user_skills) for job in cleaned]
    sorted_jobs = sorted(scored, key=lambda j: j["relevance_score"], reverse=True)
    
    # Write to PostgreSQL
    await db.upsert_jobs(sorted_jobs, session_id, user_id)
    
    # Notify Next.js via Redis Pub/Sub (WebSocket delivery)
    await redis.publish(f"search:{session_id}", json.dumps({
        "status": "complete",
        "count": len(sorted_jobs)
    }))
```

### 6.3 Relevance Scorer (New Module)

```python
# apps/scraper/utils/relevance_scorer.py

def score_relevance(job: dict, user_skills: list[str]) -> dict:
    """
    Score how well a job matches user skills.
    Uses Jaccard similarity on normalized skill tokens.
    Returns job dict with relevance_score: 0-100 added.
    """
    job_skills_raw = job.get("skills", "")
    job_skills = set(normalize_skills(job_skills_raw))
    user_skills_set = set(normalize_skills(" ".join(user_skills)))
    
    if not job_skills or not user_skills_set:
        job["relevance_score"] = 50  # neutral default
        return job
    
    # Jaccard similarity
    intersection = len(job_skills & user_skills_set)
    union = len(job_skills | user_skills_set)
    jaccard = intersection / union if union > 0 else 0
    
    # Title boost: if role appears in title, +20 points
    # Recency boost: if posted < 7 days, +10 points
    score = int(jaccard * 70) + title_boost(job) + recency_boost(job)
    job["relevance_score"] = min(score, 100)
    return job
```

### 6.4 Scraping Request Flow

```
User submits job search form
         ↓
POST /api/jobs/search (Next.js API)
         ↓
Validate input (Zod)
         ↓
Check cache: Redis key "job_search:{role_hash}:{loc_hash}:{user_id}"
   ├─ HIT → return cached job IDs (list from DB)
   └─ MISS ↓
Create search_sessions record in PostgreSQL
         ↓
POST https://scraper.careerai.app/scrape
  Headers: { X-Api-Key: INTERNAL_KEY }
  Body: { role, location, session_id, user_id, skills }
         ↓
Returns: { status: "queued" }
         ↓
Next.js opens WebSocket subscription: "search:{session_id}"
         ↓
Returns to client: { session_id, status: "queued" }
         ↓
─── ASYNC in Python service ───
Worker pulls job from Redis queue
         ↓
asyncio.gather(RemoteOK, Naukri, Wellfound)
         ↓
clean + deduplicate + score
         ↓
PostgreSQL: UPSERT jobs, INSERT user_jobs
         ↓
Redis PUBLISH "search:{session_id}" → { status: "complete", count: 47 }
─── END ASYNC ───
         ↓
Next.js WebSocket handler receives message
         ↓
Broadcasts to client WebSocket connection
         ↓
Client: job cards populate in real-time
```

---

## 7. LLM Pipeline Architecture

### 7.1 Pipeline Overview

```
POST /api/analyze
  body: { resume_id, job_id, optimization_mode }
              ↓
┌─────────────────────────────────────────────────┐
│              STEP 0: Cache Check                 │
│  key = sha256(resume_text + jd_text)            │
│  Redis TTL: 24h                                 │
│  HIT → stream cached result immediately         │
│  MISS → proceed to LLM pipeline                 │
└─────────────────────────────────────────────────┘
              ↓ MISS
┌─────────────────────────────────────────────────┐
│  STEP 1: JD Extraction (~500ms)                 │
│                                                 │
│  Prompt: jd-extraction.ts                       │
│  Model:  llama-3.3-70b-versatile (Groq)         │
│  Input:  raw JD text                            │
│  Output: JDMetadata (Zod-validated)             │
│  SSE:    { step: "jd_extracted", progress: 25 } │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│  STEP 2: Resume Parsing (~600ms)                │
│                                                 │
│  Prompt: resume-parser.ts                       │
│  Model:  llama-3.3-70b-versatile (Groq)         │
│  Input:  raw resume text                        │
│  Output: ResumeProfile (Zod-validated)          │
│  SSE:    { step: "resume_parsed", progress: 50} │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│  STEP 3: Match Scoring (~800ms)                 │
│                                                 │
│  Prompt: match-scoring.ts                       │
│  Input:  JDMetadata + ResumeProfile             │
│  Output: Scores + Gap[] (Zod-validated)         │
│  SSE:    { step: "scored", progress: 75 }       │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│  STEP 4: Bullet Rewriting (~1200ms)             │
│                                                 │
│  Prompt: bullet-rewriter.ts                     │
│  Input:  ResumeProfile + JDMetadata + Gaps      │
│  Output: BulletRewrite[] (confidence + flags)   │
│  Guard:  NEVER invent dates/companies/metrics   │
│  SSE:    { step: "rewritten", progress: 100 }   │
└─────────────────────────────────────────────────┘
              ↓
┌─────────────────────────────────────────────────┐
│  POST-PIPELINE                                   │
│  • Zod validate full AnalysisResult             │
│  • Write to resume_analyses (PostgreSQL)        │
│  • Write to Redis cache (TTL: 24h)              │
│  • SSE: { type: "complete", result: ... }       │
└─────────────────────────────────────────────────┘
```

### 7.2 Groq Client with Gemini Fallback

```typescript
// apps/web/src/lib/groq.ts

import Groq from 'groq-sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

const groq = new Groq({ apiKey: process.env.GROQ_API_KEY })
const gemini = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY!)

export async function callLLM(
  prompt: string,
  systemPrompt: string,
  schema: object
): Promise<unknown> {
  // Try Groq first
  try {
    const response = await groq.chat.completions.create({
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt }
      ],
      response_format: { type: 'json_object' },
      temperature: 0.1,
      max_tokens: 4096,
    })
    return JSON.parse(response.choices[0].message.content!)
  } catch (groqError) {
    console.warn('[LLM] Groq failed, falling back to Gemini:', groqError)
    
    // Fallback to Gemini
    const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' })
    const result = await model.generateContent(
      `${systemPrompt}\n\nRespond only with valid JSON.\n\n${prompt}`
    )
    return JSON.parse(result.response.text())
  }
}
```

### 7.3 Email Generation Prompt Architecture

```typescript
// apps/web/src/prompts/email-generator.ts
// NEW — not in any source repo

export function buildEmailPrompt(context: {
  senderName: string
  senderRole: string
  topAchievements: string[]
  targetCompany: string
  targetRole: string
  recruiterName?: string
  tone: 'professional' | 'friendly' | 'bold'
  callToAction: string
  wordLimit: number
}): { system: string; user: string } {
  return {
    system: `You are an expert career coach writing personalized cold outreach emails.
    
STRICT RULES:
- Never mention companies, projects, or metrics not in the provided achievements
- Never invent interview dates, meetings, or follow-up timelines
- Keep strictly within the word limit
- The email must feel personal, not templated
- Do NOT start with "I hope this email finds you well"
- Do NOT use phrases like "I am writing to express my interest"`,
    
    user: `Write a ${context.tone} cold email from ${context.senderName} to ${context.recruiterName ?? 'the hiring team'} at ${context.targetCompany} for the ${context.targetRole} role.

Key achievements to highlight (choose 2 most relevant):
${context.topAchievements.map((a, i) => `${i + 1}. ${a}`).join('\n')}

Call to action: ${context.callToAction}
Word limit: ${context.wordLimit} words

Return JSON: { "subject": string, "body": string, "wordCount": number, "warnings": string[] }`
  }
}
```

---

## 8. Email Engine Architecture

### 8.1 Email Generation Flow

```
POST /api/emails/generate
  body: { job_id, analysis_id, tone, recipient_name, recipient_email, ... }
              ↓
Load context from DB:
  - Job: title, company from jobs table
  - Analysis: top_achievements from resume_analyses.bullet_rewrites
  - User: name, role, portfolio_url from users table
              ↓
Build email prompt (email-generator.ts)
              ↓
callLLM(prompt) → { subject, body, wordCount, warnings }
              ↓
Zod validate EmailDraftSchema
              ↓
INSERT emails (status: 'draft') → returns draft_id
              ↓
Return to client: { draft_id, subject, body, wordCount, warnings }
```

### 8.2 Email Confirmation & Send Flow

```
Client: User reads email draft
              ↓
User clicks "YES — Send This Email"
              ↓
POST /api/emails/:id/send
  body: { confirmed: true }   ← REQUIRED
              ↓
Server-side checks:
  [1] Session valid (auth middleware)
  [2] Email belongs to this user (DB query)
  [3] confirmed === true (NOT just truthy — strict equality)
  [4] Email status === 'draft' (not already sent)
  [5] Daily send limit < 20 (Redis counter)
              ↓
All checks pass → Nodemailer send
              ↓
Gmail SMTP: smtp.gmail.com:587 (STARTTLS)
  auth: { user: env.SMTP_USER, pass: decryptedAppPassword }
  from: user's email (or platform noreply)
  to: recipient_email
  subject: email.subject
  text: email.body (plain)
  html: email.body (formatted)
              ↓
UPDATE emails SET status='sent', sent_at=NOW()
              ↓
UPDATE user_jobs SET status='email_sent'
              ↓
SET follow_up reminder: emails.follow_up_due_at = NOW() + 7 days
              ↓
INSERT analytics_events { event_type: 'email_sent' }
              ↓
Return: { status: 'sent', sent_at: ISO }
```

### 8.3 Nodemailer Configuration

```typescript
// apps/web/src/lib/email.ts

import nodemailer from 'nodemailer'
import { decrypt } from './crypto'

export async function sendEmail(params: {
  to: string
  toName: string
  subject: string
  body: string
  userSmtpPassword: string  // AES-256 encrypted in DB
}) {
  const transporter = nodemailer.createTransporter({
    host: 'smtp.gmail.com',
    port: 587,
    secure: false,  // STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: decrypt(params.userSmtpPassword),
    },
    tls: { rejectUnauthorized: true }
  })

  await transporter.verify()  // Throws if credentials invalid

  const info = await transporter.sendMail({
    from: `"CareerAI Copilot" <${process.env.SMTP_USER}>`,
    replyTo: params.replyTo,
    to: `${params.toName} <${params.to}>`,
    subject: params.subject,
    text: params.body,
    html: formatEmailAsHTML(params.body),
  })

  return info.messageId
}
```

### 8.4 Gmail Draft Save (IMAP)

```typescript
// Save as draft to user's Gmail instead of sending
export async function saveAsGmailDraft(draft: EmailDraft, imapConfig: IMAPConfig) {
  const imap = new Imap({
    user: imapConfig.user,
    password: decrypt(imapConfig.encryptedPassword),
    host: 'imap.gmail.com',
    port: 993,
    tls: true,
  })

  // Build RFC 2822 compliant message
  const rawMessage = buildRawEmail(draft)
  
  // Append to [Gmail]/Drafts
  await imap.append(rawMessage, {
    mailbox: '[Gmail]/Drafts',
    flags: ['\\Draft'],
    date: new Date(),
  })
}
```

---

## 9. Data Architecture

### 9.1 Entity Relationship Diagram

```
users
  │
  ├──< resumes (user_id)
  │      └──< resume_analyses (resume_id)
  │               ├── job_id ──> jobs
  │               └──< emails (analysis_id)
  │
  ├──< user_jobs (user_id)
  │      └── job_id ──> jobs
  │
  ├──< emails (user_id)
  │      ├── job_id ──> jobs
  │      └── analysis_id ──> resume_analyses
  │
  ├──< search_sessions (user_id)
  │
  └──< analytics_events (user_id)

jobs
  (global table — not per-user)
  (user-specific data in user_jobs bridge)
```

### 9.2 Key Query Patterns

```sql
-- Dashboard: user stats summary
SELECT
  COUNT(DISTINCT uj.job_id) FILTER (WHERE uj.status != 'saved') AS applications,
  COUNT(DISTINCT e.id) FILTER (WHERE e.status = 'sent') AS emails_sent,
  COUNT(DISTINCT uj.job_id) FILTER (WHERE uj.status = 'interviewing') AS interviews,
  AVG(ra.optimized_score) AS avg_ats_score,
  AVG(e.reply_received::int) * 100 AS reply_rate
FROM users u
LEFT JOIN user_jobs uj ON uj.user_id = u.id
LEFT JOIN emails e ON e.user_id = u.id
LEFT JOIN resume_analyses ra ON ra.user_id = u.id
WHERE u.id = $userId;

-- Job search results with user status
SELECT j.*, uj.status, uj.notes, uj.applied_at
FROM jobs j
LEFT JOIN user_jobs uj ON uj.job_id = j.id AND uj.user_id = $userId
WHERE j.id = ANY($jobIds)
ORDER BY j.relevance_score DESC;

-- ATS score trends
SELECT
  DATE_TRUNC('week', created_at) AS week,
  AVG(original_score) AS avg_before,
  AVG(optimized_score) AS avg_after,
  COUNT(*) AS analyses
FROM resume_analyses
WHERE user_id = $userId
GROUP BY week
ORDER BY week;
```

### 9.3 Prisma Schema

```prisma
// apps/web/src/lib/db/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String   @id @default(cuid())
  email         String   @unique
  name          String?
  avatarUrl     String?
  linkedinUrl   String?
  portfolioUrl  String?
  targetRoles   String[]
  preferredLocs String[]
  salaryMin     Int?
  salaryMax     Int?
  workTypes     String[]
  skills        String[]
  experienceLvl String?
  createdAt     DateTime @default(now())
  updatedAt     DateTime @updatedAt

  resumes         Resume[]
  userJobs        UserJob[]
  resumeAnalyses  ResumeAnalysis[]
  emails          Email[]
  searchSessions  SearchSession[]
  analyticsEvents AnalyticsEvent[]
}

model Resume {
  id        String   @id @default(cuid())
  userId    String
  name      String
  rawText   String
  fileUrl   String?
  isBase    Boolean  @default(false)
  createdAt DateTime @default(now())

  user      User             @relation(fields: [userId], references: [id], onDelete: Cascade)
  analyses  ResumeAnalysis[]
}

model Job {
  id              String   @id @default(cuid())
  jobTitle        String
  company         String
  location        String?
  salary          String?
  experience      String?
  skills          String[]
  jobUrl          String
  fullDescription String?
  postedDate      String?
  source          String
  relevanceScore  Int      @default(0)
  scrapedAt       DateTime

  userJobs UserJob[]
  analyses ResumeAnalysis[]
  emails   Email[]

  @@unique([jobUrl, source])
}

model UserJob {
  id        String    @id @default(cuid())
  userId    String
  jobId     String
  status    String    @default("saved")
  notes     String?
  appliedAt DateTime?
  createdAt DateTime  @default(now())
  updatedAt DateTime  @updatedAt

  user User @relation(fields: [userId], references: [id], onDelete: Cascade)
  job  Job  @relation(fields: [jobId], references: [id])

  @@unique([userId, jobId])
}

model ResumeAnalysis {
  id                  String   @id @default(cuid())
  userId              String
  resumeId            String
  jobId               String?
  originalScore       Int?
  optimizedScore      Int?
  skillCoverage       Int?
  keywordPresence     Int?
  responsibilityFit   Int?
  seniorityMatch      Int?
  gaps                Json?
  tailoredResumeText  String?
  bulletRewrites      Json?
  createdAt           DateTime @default(now())

  user   User    @relation(fields: [userId], references: [id], onDelete: Cascade)
  resume Resume  @relation(fields: [resumeId], references: [id])
  job    Job?    @relation(fields: [jobId], references: [id])
  emails Email[]
}

model Email {
  id              String    @id @default(cuid())
  userId          String
  jobId           String?
  analysisId      String?
  toEmail         String?
  toName          String?
  subject         String
  body            String
  tone            String?
  wordCount       Int?
  warnings        String[]
  status          String    @default("draft")
  sentAt          DateTime?
  replyReceived   Boolean   @default(false)
  replyReceivedAt DateTime?
  followUpDueAt   DateTime?
  createdAt       DateTime  @default(now())

  user     User            @relation(fields: [userId], references: [id], onDelete: Cascade)
  job      Job?            @relation(fields: [jobId], references: [id])
  analysis ResumeAnalysis? @relation(fields: [analysisId], references: [id])
}
```

---

## 10. Caching Architecture

### 10.1 Redis Cache Strategy

```
┌────────────────────────────────────────────────────────────────┐
│                      REDIS CACHE KEYS                          │
│                                                                │
│  Purpose              Key Pattern                    TTL       │
│  ─────────────────────────────────────────────────────────   │
│  Job search results   job:{role_h}:{loc_h}:{uid}    1 hour    │
│  LLM analysis         analysis:{resume_h}:{jd_h}    24 hours  │
│  User profile         profile:{user_id}              15 min    │
│  Email draft          draft:{email_id}               7 days    │
│  Session              session:{session_id}            24 hours  │
│                                                                │
│  Rate Limiting        Key Pattern                    Window    │
│  ─────────────────────────────────────────────────────────   │
│  Job search           rate:search:{user_id}          5 min     │
│  Resume analysis      rate:analyze:{user_id}         24 hours  │
│  Email send           rate:email:{user_id}           24 hours  │
│  API global           rate:api:{user_id}:{path}      1 min     │
│                                                                │
│  Pub/Sub Channels     Channel                                  │
│  ─────────────────────────────────────────────────────────   │
│  Scraping progress    search:{session_id}                      │
│  Analysis progress    analyze:{analysis_id}                    │
└────────────────────────────────────────────────────────────────┘
```

### 10.2 Cache Invalidation Rules

```typescript
// Invalidate on mutations
on: resume_updated    → delete cache key: analysis:{any}:{jd_h} where resume_h matches
on: profile_updated   → delete cache key: profile:{user_id}
on: job_search_fresh  → delete cache key: job:{role_h}:{loc_h}:{user_id} (force re-scrape)
```

---

## 11. Authentication & Authorization

### 11.1 Auth Flow

```
User visits /login
      ↓
NextAuth.js credentials provider
  → POST /api/auth/callback/credentials
      ↓
bcrypt.compare(password, hash)
      ↓
JWT created: { sub: userId, email, name, exp: 24h }
JWT stored: httpOnly cookie (secure, SameSite=strict)
      ↓
Refresh token: stored in DB (7 days)
      ↓
Client: session available via useSession()
      ↓
API Routes: const session = await auth() (server-side)
```

### 11.2 Google OAuth Flow

```
User clicks "Continue with Google"
      ↓
NextAuth → Google OAuth 2.0 consent screen
      ↓
Google callback: /api/auth/callback/google
      ↓
NextAuth: upsert user in DB (email as unique key)
      ↓
JWT created + httpOnly cookie
      ↓
Redirect → /onboarding (if new user) or /dashboard
```

### 11.3 Row-Level Security Pattern

Every DB query includes explicit `userId` filter:

```typescript
// CORRECT — always scope to current user
const analyses = await db.resumeAnalysis.findMany({
  where: {
    userId: session.user.id,  // ← ALWAYS required
    jobId: jobId,
  }
})

// WRONG — never do this
const analyses = await db.resumeAnalysis.findMany({
  where: { jobId: jobId }  // ← Missing userId = security hole
})
```

---

## 12. Real-Time Communication

### 12.1 WebSocket (Job Search Progress)

```
Client                    Next.js Server           Python Scraper
  │                            │                        │
  │── GET /api/jobs/search ───▶│                        │
  │◀── { session_id } ─────────│                        │
  │                            │                        │
  │── WS: /api/ws?sid=... ────▶│                        │
  │                            │── POST /scrape ────────▶│
  │                            │◀── { queued } ──────────│
  │                            │                        │
  │                            │     [Scrapers run]      │
  │                            │                        │
  │                            │◀── Redis PUBLISH ───────│
  │                            │   "search:{session_id}" │
  │◀── WS: { status, count } ──│                        │
  │                            │                        │
  │◀── WS: { jobs: [...] } ────│                        │
```

```typescript
// apps/web/src/app/api/ws/route.ts
export function GET(req: NextRequest) {
  const { socket, response } = Deno.upgradeWebSocket(req)
  const sessionId = req.nextUrl.searchParams.get('sid')

  // Subscribe to Redis channel for this search session
  const subscriber = redis.duplicate()
  subscriber.subscribe(`search:${sessionId}`, (message) => {
    socket.send(message)
  })

  socket.onclose = () => subscriber.unsubscribe()
  return response
}
```

### 12.2 Server-Sent Events (LLM Analysis Progress)

```typescript
// apps/web/src/app/api/analyze/route.ts
export async function POST(req: NextRequest) {
  const encoder = new TextEncoder()
  
  const stream = new ReadableStream({
    async start(controller) {
      const send = (data: object) => {
        controller.enqueue(encoder.encode(`data: ${JSON.stringify(data)}\n\n`))
      }

      // Step 1: JD Extraction
      send({ step: 'jd_extracted', progress: 25 })
      const jdMeta = await extractJD(jdText)

      // Step 2: Resume Parsing
      send({ step: 'resume_parsed', progress: 50 })
      const resumeProfile = await parseResume(resumeText)

      // Step 3: Match Scoring
      send({ step: 'scored', progress: 75 })
      const scores = await scoreMatch(jdMeta, resumeProfile)

      // Step 4: Bullet Rewriting
      send({ step: 'rewritten', progress: 100 })
      const rewrites = await rewriteBullets(resumeProfile, jdMeta, scores.gaps)

      // Final result
      const result = buildAnalysisResult(jdMeta, resumeProfile, scores, rewrites)
      await saveAnalysis(result)
      
      send({ type: 'complete', result })
      controller.close()
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    }
  })
}
```

---

## 13. File Storage Architecture

### 13.1 Resume Upload Flow

```
Client: User selects PDF/DOCX file
      ↓
POST /api/resumes (multipart/form-data)
      ↓
Server: validate file type (PDF/DOCX only) + size (< 5MB)
      ↓
Extract text:
  PDF  → pdf-parse (Node.js)       [reused from RS]
  DOCX → mammoth (Node.js)         [reused from RS]
      ↓
Upload raw file to Vercel Blob:
  path: resumes/{userId}/{resumeId}/{filename}
  returns: presigned URL (private, 1h expiry)
      ↓
INSERT resumes { raw_text, file_url, userId }
      ↓
Return: { id, name, raw_text_preview }
```

### 13.2 PDF Export Flow

```
POST /api/analyze/:id/export
      ↓
Load tailored_resume_text from resume_analyses
      ↓
pdf-template.ts: build HTML string from resume profile
      ↓
Playwright: launch Chromium headless
  page.setContent(html)
  page.pdf({ format: 'A4', printBackground: true })
      ↓
PDF buffer returned
      ↓
Either:
  a) Upload to Blob → return download URL
  b) Stream directly as attachment: Content-Disposition: attachment
```

---

## 14. Context Handoff Protocol

This is the core innovation of the platform — automatic data flow between the three tools.

### 14.1 Job → Resume Shapeshifter

```typescript
// packages/shared-types/src/job.ts
export interface JobToResumeContext {
  job_id: string
  job_title: string
  company: string
  full_description: string     // Full JD text fetched via Firecrawl
  required_skills: string[]    // Parsed from JD
  job_url: string
  source: string
}

// Flow: user clicks "Tailor Resume" on job card
// → router.push(`/analyze?job_id=${job.id}`)
// → /analyze page loads: useJob(job_id) → auto-fills JD textarea
// → user selects resume from library
// → clicks "Analyze"
```

### 14.2 Resume Analysis → Email Generator

```typescript
// packages/shared-types/src/analysis.ts
export interface ResumeToEmailContext {
  analysis_id: string
  tailored_resume_summary: string
  top_achievements: string[]     // Top 3 rewritten bullets (highest confidence)
  ats_score_before: number
  ats_score_after: number
  target_job: {
    id: string
    title: string
    company: string
    location: string
  }
}

// Flow: user clicks "Generate Outreach Email" on analysis page
// → router.push(`/emails/compose?analysis_id=${id}`)
// → /emails/compose loads: useAnalysis(id) → auto-fills company, role, achievements
// → user adds recruiter name/email + tone preference
// → LLM generates personalized email
```

### 14.3 Application Tracker Update Chain

```
Action                           → user_jobs.status update
──────────────────────────────────────────────────────────
User saves job                   → 'saved'
User clicks "Tailor Resume"      → 'resume_tailored'
User downloads tailored resume   → 'applied' (if user confirms)
Email sent (confirmed)           → 'email_sent'
User marks reply received        → 'replied'
User marks interview scheduled   → 'interviewing'
User marks offer received        → 'offer'
User marks rejected              → 'rejected'
```

---

## 15. Error Handling Strategy

### 15.1 Error Hierarchy

```
ApplicationError (base)
├── AuthenticationError (401)   — session invalid or expired
├── AuthorizationError (403)    — user doesn't own resource
├── ValidationError (400)       — Zod parse failure
├── RateLimitError (429)        — rate limit exceeded
├── NotFoundError (404)         — resource not found
├── LLMError (502)              — Groq + Gemini both failed
├── ScraperError (502)          — Python service unavailable
├── EmailSendError (502)        — SMTP failure
└── StorageError (503)          — Blob upload failure
```

### 15.2 Graceful Degradation Matrix

| Service Failure | User Experience | Recovery |
|---|---|---|
| RemoteOK scraper fails | Shows Naukri + Wellfound results | Retry available |
| Naukri scraper fails | Shows RemoteOK + Wellfound results | Retry available |
| Wellfound scraper fails | Shows RemoteOK + Naukri results | Retry available |
| ALL scrapers fail | "Search failed — try again" toast | Manual retry |
| Groq API fails | Falls back to Gemini automatically | Transparent |
| Gemini also fails | "Analysis failed — try again" toast | Manual retry |
| Redis unavailable | Reads from PostgreSQL directly | Transparent (slower) |
| PDF export fails | "Download failed — copy text instead" | Clipboard fallback |
| SMTP send fails | "Email not sent — saved as draft" | Gmail Draft available |

### 15.3 Client-Side Error Boundaries

```tsx
// Global error boundary at layout level
export default function DashboardLayout({ children }) {
  return (
    <ErrorBoundary
      fallback={<ErrorFallback />}
      onError={(error) => Sentry.captureException(error)}
    >
      <Suspense fallback={<DashboardSkeleton />}>
        {children}
      </Suspense>
    </ErrorBoundary>
  )
}
```

---

## 16. Security Architecture

### 16.1 Threat Model

| Threat | Vector | Defense |
|---|---|---|
| Unauthorized API access | Missing/invalid JWT | Edge middleware JWT check |
| Data leakage between users | Missing userId filter | Row-level userId scoping on all queries |
| SMTP credential theft | DB breach | AES-256 encrypted app passwords |
| Automated email spam | No rate limit | Hard 20/day server-side counter |
| Mass email send (UI bypass) | Direct API call | `confirmed: true` server-side enforcement |
| XSS in email body | User-injected HTML | Body rendered as plain text, HTML sanitized |
| Path traversal on files | Malicious file URLs | Presigned Blob URLs, no file system access |
| LLM prompt injection | Malicious resume/JD | Server-side prompt construction, user input in quotes |
| API key exposure | Client-side leak | All keys in server-only env vars |
| Brute force login | Password guessing | bcrypt + rate limiting on /api/auth/* |

### 16.2 Secret Management

```bash
# Runtime secrets — NEVER committed to source
# Stored in Vercel Environment Variables (encrypted)

GROQ_API_KEY          ← Server-only
GOOGLE_GEMINI_API_KEY ← Server-only
FIRECRAWL_API_KEY     ← Server-only (Python service only)
DATABASE_URL          ← Server-only
REDIS_URL             ← Server-only
NEXTAUTH_SECRET       ← Server-only
SCRAPER_SERVICE_API_KEY ← Server-only

# SMTP app passwords stored in DB, encrypted at rest with:
# AES-256-GCM, key stored in env var: ENCRYPTION_KEY
```

---

## 17. Observability & Monitoring

### 17.1 Logging Architecture

```
All API Route Handlers →
  console.log({
    level: 'info' | 'error' | 'warn',
    path: req.nextUrl.pathname,
    method: req.method,
    userId: session?.user?.id,
    durationMs: Date.now() - start,
    status: response.status,
    ...(error && { error: error.message, stack: error.stack })
  })
  
→ Vercel Log Drains → Datadog / Axiom (structured JSON)
```

### 17.2 Sentry Integration

```typescript
// Capture with rich context
Sentry.captureException(error, {
  user: { id: session.user.id, email: session.user.email },
  tags: {
    component: 'llm-pipeline',
    step: 'bullet-rewriter',
    model: 'groq-llama-3.3-70b'
  },
  extra: {
    jobId: params.jobId,
    resumeId: params.resumeId,
    promptTokens: usage.promptTokens
  }
})
```

### 17.3 Key Metrics to Alert On

| Metric | Threshold | Alert |
|---|---|---|
| LLM pipeline latency | > 15 seconds | PagerDuty P2 |
| Scraper success rate | < 70% | Slack warning |
| Email send failure rate | > 5% | PagerDuty P1 |
| API error rate | > 2% | Slack warning |
| Redis latency | > 100ms | Slack warning |
| DB connection pool exhaustion | > 90% | PagerDuty P1 |

---

## 18. Scalability & Performance

### 18.1 Performance Budget

| Resource | Target | Measurement |
|---|---|---|
| LCP (Largest Contentful Paint) | < 2.5s | Lighthouse |
| CLS (Cumulative Layout Shift) | < 0.1 | Lighthouse |
| FID (First Input Delay) | < 100ms | Lighthouse |
| JS bundle size | < 200KB gzipped | webpack-bundle-analyzer |
| API response time (p95) | < 500ms | Vercel Analytics |
| LLM pipeline (all 4 steps) | < 8 seconds | Custom metric |

### 18.2 Bundle Optimization

```typescript
// next.config.ts
export default {
  experimental: {
    optimizeCss: true,
  },
  images: {
    formats: ['image/avif', 'image/webp'],
  },
  // Dynamic imports for heavy components
}

// Heavy components loaded lazily
const SideBySideDiff = dynamic(() => import('@/components/resume/SideBySideDiff'), {
  loading: () => <DiffSkeleton />
})

const FunnelChart = dynamic(() => import('@/components/dashboard/FunnelChart'), {
  loading: () => <ChartSkeleton />
})
```

### 18.3 Database Performance

```sql
-- Critical indexes for query patterns
CREATE INDEX idx_user_jobs_user_id ON user_jobs(user_id);
CREATE INDEX idx_user_jobs_status ON user_jobs(user_id, status);
CREATE INDEX idx_resume_analyses_user ON resume_analyses(user_id, created_at DESC);
CREATE INDEX idx_emails_user_status ON emails(user_id, status);
CREATE INDEX idx_emails_follow_up ON emails(follow_up_due_at) WHERE status = 'sent';
CREATE INDEX idx_analytics_user_type ON analytics_events(user_id, event_type, created_at);
CREATE INDEX idx_jobs_source ON jobs(source, scraped_at DESC);
```

---

## 19. CI/CD Pipeline

```yaml
# .github/workflows/ci.yml
name: CI

on: [push, pull_request]

jobs:
  quality:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v3
      - run: pnpm install --frozen-lockfile
      - run: pnpm turbo typecheck      # TypeScript checks
      - run: pnpm turbo lint           # ESLint
      - run: pnpm turbo test           # Vitest unit tests
      - run: pnpm turbo build          # Next.js build (catch build errors)

  e2e:
    runs-on: ubuntu-latest
    needs: quality
    steps:
      - uses: actions/checkout@v4
      - run: pnpm install
      - run: npx playwright install chromium
      - run: pnpm turbo e2e             # Playwright E2E tests

  deploy-preview:
    if: github.event_name == 'pull_request'
    needs: quality
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx vercel --token=${{ secrets.VERCEL_TOKEN }} --env preview

  deploy-production:
    if: github.ref == 'refs/heads/main'
    needs: [quality, e2e]
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - run: npx vercel --prod --token=${{ secrets.VERCEL_TOKEN }}
      - run: |  # Deploy Python scraper to Railway
          railway deploy --service scraper
```

---

## 20. Component Interaction Map

Full end-to-end interaction map showing how all components communicate:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE COMPONENT INTERACTION MAP                         │
│                                                                               │
│  BROWSER                                                                      │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Page: /jobs                                                          │    │
│  │  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────────┐  │    │
│  │  │ JobSearchForm │  │  JobGrid     │  │  Zustand: jobStore        │  │    │
│  │  │ (React HF)    │  │  + Filters   │  │  { results, selected }    │  │    │
│  │  └──────┬───────┘  └──────▲───────┘  └───────────────────────────┘  │    │
│  └─────────│──────────────────│────────────────────────────────────────┘    │
│            │ submit           │ update                                        │
│            ▼                  │                                               │
│  ┌──────────────────────────────────────────────────────────────────────┐   │
│  │  NEXT.JS API  /api/jobs/search  →  /api/ws?sid=...                   │   │
│  │                                                                        │   │
│  │  1. Rate limit check (Redis)                                          │   │
│  │  2. POST → Python Scraper Service                                     │   │
│  │  3. Subscribe Redis channel "search:{session_id}"                    │   │
│  │  4. Push updates via WebSocket → Browser                              │   │
│  └────────────────────────┬───────────────────────────────────────────┘   │
│                            │ HTTP                                             │
│  ┌─────────────────────────▼──────────────────────────────────────────┐    │
│  │  PYTHON SCRAPER SERVICE (Railway)                                    │    │
│  │                                                                      │    │
│  │  asyncio.gather(RemoteOK, Naukri, Wellfound)                        │    │
│  │       → normalize() → deduplicate() → score_relevance()             │    │
│  │       → PostgreSQL UPSERT                                            │    │
│  │       → Redis PUBLISH "search:{session_id}"                         │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ═══════════════════ USER CLICKS "TAILOR RESUME" ═══════════════════        │
│                                                                               │
│  BROWSER → router.push('/analyze?job_id=xxx')                                │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Page: /analyze  (SSR: pre-load resume list)                         │    │
│  │  ┌─────────────────┐   ┌──────────────────────────────────────────┐ │    │
│  │  │ ResumeInput      │   │  JDInput (auto-filled from job_id)      │ │    │
│  │  │ (select library) │   │  job.full_description → textarea         │ │    │
│  │  └────────┬─────────┘   └──────────────────────────────────────────┘ │    │
│  └───────────│──────────────────────────────────────────────────────────┘    │
│              │ POST /api/analyze (SSE stream)                                 │
│              ▼                                                                │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  NEXT.JS API  /api/analyze                                           │    │
│  │                                                                      │    │
│  │  Redis cache check → MISS                                            │    │
│  │  SSE: jd_extracted (25%) → Groq prompt 1                            │    │
│  │  SSE: resume_parsed (50%) → Groq prompt 2                           │    │
│  │  SSE: scored (75%)       → Groq prompt 3                            │    │
│  │  SSE: rewritten (100%)   → Groq prompt 4 (hallucination guard)     │    │
│  │  → PostgreSQL INSERT resume_analyses                                 │    │
│  │  → Redis WRITE analysis cache (TTL: 24h)                            │    │
│  │  SSE: { type: "complete", result: AnalysisResult }                  │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ═══════════════════ USER CLICKS "GENERATE EMAIL" ══════════════════        │
│                                                                               │
│  BROWSER → router.push('/emails/compose?analysis_id=xxx')                    │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  Page: /emails/compose                                               │    │
│  │  Auto-filled: company, role, top_achievements                        │    │
│  │  User fills: recruiter name/email, tone, CTA                        │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                   │ POST /api/emails/generate                 │
│                                   ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  NEXT.JS API  /api/emails/generate                                   │    │
│  │                                                                      │    │
│  │  Load context: job + analysis + user profile from PostgreSQL        │    │
│  │  Build email prompt (email-generator.ts)                            │    │
│  │  callLLM() → { subject, body, wordCount, warnings }                │    │
│  │  INSERT emails { status: 'draft' }                                  │    │
│  │  Return draft to client                                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
│                                                                               │
│  ═══════════════════ USER APPROVES & SENDS ══════════════════════            │
│                                                                               │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  EmailConfirmGate component → user clicks "YES — Send"               │    │
│  └───────────────────────────────┬─────────────────────────────────────┘    │
│                                   │ POST /api/emails/:id/send               │
│                                   │ body: { confirmed: true }                │
│                                   ▼                                           │
│  ┌─────────────────────────────────────────────────────────────────────┐    │
│  │  NEXT.JS API  /api/emails/:id/send                                   │    │
│  │                                                                      │    │
│  │  GUARD 1: session valid                                              │    │
│  │  GUARD 2: email.userId === session.user.id                          │    │
│  │  GUARD 3: confirmed === true (strict equality)                      │    │
│  │  GUARD 4: email.status === 'draft'                                  │    │
│  │  GUARD 5: daily send count < 20                                     │    │
│  │                                                                      │    │
│  │  ↓ All pass                                                         │    │
│  │  Nodemailer → Gmail SMTP (smtp.gmail.com:587, STARTTLS)             │    │
│  │  → UPDATE emails SET status='sent', sent_at=NOW()                   │    │
│  │  → UPDATE user_jobs SET status='email_sent'                         │    │
│  │  → SET follow_up_due_at = NOW() + 7 days                           │    │
│  │  → INSERT analytics_events { event_type: 'email_sent' }            │    │
│  │  → Return { status: 'sent', sent_at }                              │    │
│  └─────────────────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix A — Technology Decision Log

| Decision | Chosen | Alternatives Considered | Rationale |
|---|---|---|---|
| Monorepo tool | Turborepo | Nx, Lerna | Better DX, faster builds, simpler config |
| Package manager | pnpm | npm, yarn | Disk efficiency, strict dependency isolation |
| DB ORM | Prisma | Drizzle, Kysely | Type-safe queries, migration tooling, schema visualization |
| State management | Zustand + React Query | Redux, Jotai | Zustand for sync state; RQ for server state — minimal boilerplate |
| Email client | Nodemailer | SendGrid, Resend | Port Python SMTP logic directly; no third-party for sending |
| Job queue | Redis Bull (BullMQ) | pg-boss, Temporal | Already using Redis; BullMQ is battle-tested |
| Styling | Tailwind + Shadcn | CSS Modules, Styled Components | Shadcn already in RS repo; maximum component reuse |
| Testing | Vitest + Playwright | Jest + Cypress | Vitest extends existing RS test setup; Playwright for E2E |

## Appendix B — Port Mapping Reference

| Service | Local Port | Prod |
|---|---|---|
| Next.js dev | 3000 | Vercel |
| Python FastAPI | 8000 | Railway (443) |
| PostgreSQL | 5432 | Neon (5432 pooled) |
| Redis | 6379 | Upstash (TLS 6380) |
| Playwright PDF worker | 3001 | Co-located with Next.js |

## Appendix C — Source Repository Code Reuse Summary

| File/Module | Source | Destination | Change Type |
|---|---|---|---|
| `scrapers/base_scraper.py` | job-agent | `apps/scraper/scrapers/` | Zero change |
| `scrapers/remoteok_scraper.py` | job-agent | `apps/scraper/scrapers/` | Zero change |
| `scrapers/naukri_scraper.py` | job-agent | `apps/scraper/scrapers/` | Zero change |
| `scrapers/wellfound_scraper.py` | job-agent | `apps/scraper/scrapers/` | Zero change |
| `utils/data_cleaner.py` | job-agent | `apps/scraper/utils/` | Zero change |
| `src/lib/schemas.ts` (Zod) | Resume-Shapeshifter | `apps/web/src/lib/schemas/` | Add `userId`, `jobId` fields |
| `src/prompts/*.ts` (4 prompts) | Resume-Shapeshifter | `apps/web/src/prompts/` | Add company context field |
| `src/components/ScoreCard.tsx` | Resume-Shapeshifter | `apps/web/src/components/resume/` | Minor theme tokens |
| `src/components/SideBySideDiff.tsx` | Resume-Shapeshifter | `apps/web/src/components/resume/` | Add inline edit mode |
| `src/components/GapAnalysis.tsx` | Resume-Shapeshifter | `apps/web/src/components/resume/` | Zero change |
| `src/components/PDFExportButton.tsx` | Resume-Shapeshifter | `apps/web/src/components/resume/` | Zero change |
| `src/lib/groq.ts` | Resume-Shapeshifter | `apps/web/src/lib/` | Add Gemini fallback |
| `src/lib/pdf-template.ts` | Resume-Shapeshifter | `apps/web/src/lib/` | Zero change |
| `src/lib/pdf.ts` | Resume-Shapeshifter | `apps/web/src/lib/` | Zero change |
| `src/lib/parser.ts` | Resume-Shapeshifter | `apps/web/src/lib/` | Zero change |
| `src/lib/validators.ts` | Resume-Shapeshifter | `apps/web/src/lib/` | Zero change |
| `email_generator.py` (EmailStrategy ABC) | cold-email | `apps/web/src/lib/email-strategy.ts` | Port Python → TypeScript |
| `models.py` (Contact, CandidateProfile) | cold-email | `packages/shared-types/src/email.ts` | Port → TS interface |
| `email_sender.py` | cold-email | `apps/web/src/lib/email.ts` | Port Python SMTP → Nodemailer |

---

*This document provides the complete technical architecture for CareerAI Copilot.*  
*For business requirements and problem context, see [`problem_statement.md`](./problem_statement.md).*  
*For implementation progress, see [`task.md`](./task.md) (created during Phase 1).*

**Document Status:** ✅ Complete  
**Last Updated:** June 2026
