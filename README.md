# CareerAI Copilot — Unified Job Hunting Suite

CareerAI Copilot is a distributed, event-driven SaaS platform designed to streamline and automate the modern job hunting pipeline. It leverages a Next.js web application for frontend logic and user profiles, combined with a Python FastAPI microservice for high-throughput, parallelized job scraping.

For a deep dive into the technical details and architecture, check out the full [architecture.md](file:///c:/Users/kavya/Documents/AI%20Career%20Accelerator%20Platform/architecture.md).

---

## 🚀 Key Features

1. **Intelligent Job Board**: Scraping engine pulls live job listings matching your role/location from remote channels (RemoteOK, Naukri, Wellfound) and scores compatibility based on Jaccard skill overlaps.
2. **Resume Tailoring Engine**: Deep parsing of JDs and resumes via Llama 3/Gemini models, generating truthful bullet-point rewrites and structural gap analyses.
3. **Automated Cold Outreach**: Direct cold-email drafting based on optimized resumes, including safety verification layers ("Human in the Loop" gate) before sending.
4. **Comprehensive Analytics**: Funnel tracking of your application states (Saved, Resume Tailored, Applied, Interviewing, Offer).

---

## 🏗️ System Architecture & Monorepo Structure

```
careerai-copilot/                     ← Monorepo Root (Turborepo + pnpm)
├── apps/
│   ├── web/                         ← Next.js 16 Web Application (TypeScript)
│   └── scraper/                     ← Python FastAPI Scraping Microservice
├── packages/
│   └── shared-types/                ← Shared TypeScript interfaces
├── render.yaml                      ← Render Blueprint deployment config
├── architecture.md                  ← Detailed system design documentation
└── package.json                     ← Root workspaces configuration
```

- **Frontend & Core APIs**: Next.js App Router (deployed to **Vercel**).
- **Backend Scraping Worker**: FastAPI + uvicorn runtime (deployed to **Render**).
- **Database**: PostgreSQL hosted on **Neon**.
- **Message Queue & Caching**: Redis hosted on **Upstash**.
- **AI Engine**: Llama 3 (via Groq) with fallback to Google Gemini.

---

## 🛠️ Local Development Setup

### Prerequisites
- Node.js `^20.x` or `^22.x`
- `pnpm` package manager
- Python `^3.10`

### 1. Configure Environment Variables
Create a `.env` file in the root directory and add the following keys:
```env
# API Keys
GROQ_API_KEY=your_groq_api_key
GOOGLE_GEMINI_API_KEY=your_gemini_api_key

# Databases
DATABASE_URL="postgresql://user:password@host/db?sslmode=require"
REDIS_URL="redis://localhost:6379"

# NextAuth Configuration
NEXTAUTH_SECRET=supersecretnextauthsecretkey321
NEXTAUTH_URL=http://localhost:3000

# Internal Communication Token
SCRAPER_SERVICE_API_KEY=careerai_internal_secret_key_987
```

### 2. Install Dependencies & Generate Prisma Client
Run the following in the root folder:
```bash
# Install Node workspace dependencies
pnpm install

# Generate Prisma Client
pnpm --filter web exec prisma generate --schema=src/lib/db/schema.prisma
```

### 3. Start Development Servers
Run the Next.js web application:
```bash
pnpm --filter web dev
```
In a separate terminal, run the FastAPI scraper service:
```bash
cd apps/scraper
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

---

## 🌐 Production Deployment

### 1. Frontend (Vercel)
- Create a project on Vercel importing this repository.
- Root directory: `apps/web`.
- Inject environment variables. Keep `SCRAPER_SERVICE_URL` empty until Render is deployed.

### 2. Backend (Render)
- Deploy using the provided Blueprint config ([render.yaml](file:///c:/Users/kavya/Documents/AI%20Career%20Accelerator%20Platform/render.yaml)) to launch the scraper service.
- Copy the public endpoint URL of your scraper service.

### 3. Connection
- Add `SCRAPER_SERVICE_URL` pointing to your Render service URL inside Vercel's Environment Variables and trigger a redeployment.
