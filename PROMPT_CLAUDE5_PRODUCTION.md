# Production MVP — Sal Ishi Platform

## Role
You are a senior full-stack architect building a production-grade MVP for "Sal Ishi" (סל אישי) — a government AI platform that matches preventive care services to elderly citizens (65+) in Israel. This is real infrastructure for a national reform (Government Decisions 127 & 150), not a hackathon toy.

## Context

**What exists today:**
- A polished frontend demo: React 18 + TypeScript + Vite + Tailwind + Radix UI
- 5 working interfaces: Citizen app, Coordinator dashboard, Executive dashboard, Provider portal, Landing page
- 102 real services mapped with 5-dimension scoring (prevention, motivation, profile, proximity, social proof)
- Matching algorithm implemented client-side (`src/lib/matchingEngine.ts`)
- 75 citizen profiles with mock data (`src/data/mockData.ts`)
- 5 AI agents defined as UI only (no real execution)
- GitHub: https://github.com/AVI1840/sal-ishi-v2
- Live demo: https://avi1840.github.io/sal-ishi-v2/

**What's missing for production:**
1. No backend — all data is hardcoded in TypeScript files
2. No authentication — anyone sees everything
3. No persistence — nothing saves between sessions
4. No real AI — chat is fake, agents don't run
5. No multi-tenancy — can't support multiple coordinators with separate caseloads

**The pilot:**
- 286 citizens aged 65-92, Pisgat Ze'ev neighborhood, Jerusalem
- 3 social coordinators (מלוות חברתיות), each managing ~75 citizens
- 24 service providers
- Sectors: secular, Arab, ultra-orthodox, mixed
- Partners: National Insurance Institute (ביטוח לאומי) + Ministry of Finance (משרד האוצר)

**Tech stack (frontend — keep as-is):**
- React 18, TypeScript strict, Vite 6, Tailwind 3.4, Radix UI
- Recharts, react-router-dom (HashRouter), TanStack Query, Sonner
- Design: RTL Hebrew, brand color #1B3A5C, font Heebo, WCAG AA

## Mission

Build the **server-side infrastructure** that turns this frontend into a working product.
The coordinators need to use this tool daily starting next month.

### Deliverable: A serverless backend on AWS with these capabilities:

**1. Data Layer (DynamoDB)**
- Citizens table: profile, risk scores (RDI/SDI), service history, notes
- Services table: the 102 services with dimensions, availability, provider info
- Bookings table: citizen×service assignments, status, dates
- Interactions table: coordinator notes, calls, visits (CRM)
- Seed it with the existing mock data from `src/data/mockData.ts` and `src/data/serviceCatalog.ts`

**2. API Layer (Lambda + API Gateway)**
- REST API with these endpoints:
  - `GET/POST /citizens` — list, create, update citizen profiles
  - `GET /citizens/:id/matches` — run matching algorithm server-side, return scored services
  - `GET/POST /citizens/:id/bookings` — service assignments
  - `GET/POST /citizens/:id/interactions` — CRM notes
  - `GET /services` — catalog with filters (category, neighborhood, cost)
  - `GET /dashboard/kpis` — coordinator KPIs (computed from real data)
  - `POST /intake` — new citizen intake (saves profile + triggers matching)
  - `POST /chat` — proxy to Bedrock Claude with system prompt containing citizen context + services catalog

**3. Authentication (Cognito or simple JWT)**
- 3 roles: coordinator, executive, provider
- Each coordinator sees only their caseload
- Executives see aggregate data
- Providers see only their bookings

**4. AI Integration (Bedrock)**
- `/chat` endpoint: Claude with a system prompt that knows the citizen's profile + matched services. Answers questions, explains recommendations, suggests next steps.
- `/intake/transcribe` endpoint: accepts audio, returns transcript (Amazon Transcribe) + extracted motivations/barriers (Claude analysis)
- Matching algorithm runs server-side with same 5-layer logic but real citizen data

**5. One Real Agent (Service Discovery)**
- Lambda triggered weekly (EventBridge)
- Fetches from 5 predefined URLs (municipality sites, welfare orgs)
- Uses Bedrock to classify: is this a relevant service? What category? What dimensions?
- Writes new services to DynamoDB
- Notifies coordinators of new additions

### Frontend Changes (minimal)
- Replace `mockData.ts` imports with TanStack Query hooks calling the API
- Wire `/citizen/chat` to real Bedrock endpoint
- Wire coordinator dashboard KPIs to `/dashboard/kpis`
- Add login screen (simple email+password)
- Keep all existing UI components unchanged

## Architecture

```
┌─────────────────────────────────────────────────┐
│  Frontend (React, GitHub Pages / CloudFront)     │
└──────────────────────┬──────────────────────────┘
                       │ HTTPS
┌──────────────────────▼──────────────────────────┐
│  API Gateway (REST, CORS, JWT authorizer)        │
└──────────────────────┬──────────────────────────┘
                       │
┌──────────────────────▼──────────────────────────┐
│  Lambda Functions (Node.js 20, TypeScript)        │
│  - citizens.ts   - services.ts   - chat.ts      │
│  - bookings.ts   - dashboard.ts  - intake.ts    │
│  - agent-discovery.ts (EventBridge weekly)       │
└───┬──────────────┬──────────────┬───────────────┘
    │              │              │
┌───▼───┐   ┌─────▼─────┐   ┌───▼────┐
│DynamoDB│   │  Bedrock  │   │Transcribe│
│5 tables│   │  Claude   │   │  (audio) │
└────────┘   └───────────┘   └──────────┘
```

## Constraints

- **Budget:** This is a government pilot, not a startup. Minimize cost. DynamoDB on-demand, Lambda pay-per-use, Bedrock pay-per-token. No always-on servers.
- **Token efficiency:** Don't rewrite the frontend. Add infrastructure alongside it. Reference existing files, don't duplicate data.
- **IaC:** Use AWS CDK (TypeScript) or SAM template. One command to deploy.
- **Security:** No API keys in frontend code. JWT tokens. CORS locked to the domain.
- **Language:** Code comments in English. All user-facing text in Hebrew.
- **Incremental:** Structure so it can be deployed partially. Start with data+API, add AI later.

## Output Expected

1. `/infra` folder with CDK/SAM stack definition
2. `/api` folder with Lambda handlers (TypeScript)
3. `/api/seed.ts` — script to seed DynamoDB from existing mock data
4. Updated frontend hooks (a few files, replacing mock imports with API calls)
5. `.env.example` with required AWS config
6. `README.md` section: "Production Deployment" with exact commands
7. Total: one `cdk deploy` or `sam deploy` to bring the whole backend up

## What Success Looks Like

A coordinator (רונית) opens the app, logs in, sees HER 75 citizens with real data from DynamoDB. She clicks a citizen, sees AI-matched services. She opens the chat and asks "מה מתאים לרבקה שמתלוננת על בדידות?" — and gets a real answer from Bedrock based on Rivka's profile and available services in Pisgat Ze'ev.

That's the MVP. That's what justifies this platform to the organization.
