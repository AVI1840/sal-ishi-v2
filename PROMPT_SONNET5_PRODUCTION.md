# PROMPT_SONNET5_PRODUCTION — Master Execution Instruction

> **This document supersedes `PROMPT_CLAUDE5_PRODUCTION.md`.**
> Approved by the product owner on 02/07/2026 after a full architecture review.
> Execute it sprint by sprint, in order. Do not skip the Definition of Done gates.

## Role

You are the senior full-stack engineer taking **Sal Ishi (סל אישי)** from a polished demo to a pilot-grade production system. Pilot: 5 Jerusalem neighborhoods, ~2,000 clients total (286 active in Pisgat Ze'ev at start), 3–4 companions (מלוות חברתיות), launch in the coming weeks. This is real infrastructure for a national reform (Government Decisions 127 & 150) — but it is a **pilot**, so every choice must be buildable now, not a 24-month vision.

The platform is a **National Personalization Platform for Public Services**. Nursing is the first use case only. Keep the core domain-agnostic; nursing-specific concepts live in a program extension.

## What exists today (do not re-derive; verified 02/07/2026)

- React 18 + TypeScript strict + Vite 6 + Tailwind 3.4 + Radix SPA, deployed to GitHub Pages via HashRouter
- 33 pages / 5 personas (`/citizen`, `/coordinator`, `/executive`, `/providers`, plus 11 demo/hackathon/national pages)
- Real deterministic 5-layer matching engine: `src/lib/matchingEngine.ts` (349 lines) — prevention 30%, motivation 25%, profile fit 20%, social proof 15%, proximity 10%; explainable output (`MatchResult.explanations`)
- 102 real services: `src/data/serviceCatalog.ts` + `src/data/services-research/services-catalog.json`
- 75 synthetic citizens hardcoded in `src/data/mockData.ts` (314 lines); types in `src/data/types.ts` (410 lines)
- Wallet is a static display ("9/32 units") — no ledger, no deduction, no booking lifecycle
- `src/lib/ai.ts`: scripted chat responses with optional `VITE_AI_ENDPOINT` SSE passthrough (Bedrock Lambda never provisioned)
- `src/lib/storage.ts`: localStorage namespace `libi:v1`
- No auth, no API, no tests, no lint; TanStack Query installed but unused
- Sibling repos: `libi-ai-main` (FastAPI reference — **mine, don't resurrect**: subsidy tiers in `packages/marketplace/marketplace/subsidy/engine.py`, schema ideas in `infrastructure/docker/init-db.sql`), `SAL-ISHI-SIUD` (best RDI/SDI deterioration screens — port the concepts)

## Locked decisions (product owner — do not re-litigate)

| # | Decision | Detail |
|---|----------|--------|
| D1 | **AWS Serverless, region `il-central-1`** | Cognito + DynamoDB + Lambda (Node.js 20, TypeScript) + API Gateway + CloudFront. IaC with **AWS CDK (TypeScript)**, one `cdk deploy` per env. Data residency in Israel is mandatory. |
| D2 | **Pseudonymization** | The system NEVER stores: teudat zehut, full name, exact address, phone. It stores: internal `personId` (ULID), first name or alias, neighborhood (not street), birth year (not date). The linkage table (personId ↔ real identity) is maintained by companions **outside the system** (procedure documented in README). Enforce at the type/schema level — the fields must not exist. |
| D3 | **BTL Design System + Standard 5568** | Supersedes the old "keep #1B3A5C / Heebo" instruction. Font **Rubik** only; primary `#0368b0`, accent `#0068f5`, background `#F0F8FF`, text `#0c3058`; blue-tinted shadows `rgba(6,77,173,...)` — never black; `dir="rtl"` + `lang="he"`; touch targets ≥44×44px; focus `2px solid #0068f5`; WCAG 2.1 AA. Canonical source: `C:\Users\btl\Desktop\עיצוב אפליקציות לארגון\זיפ עיצוב\portable\BTL-DESIGN-SYSTEM-ALL-IN-ONE.md` + `tokens\*.json` + `theme\btl-theme.css`. When executing UI work in Claude Code, load skills `btl-ui-design-system` and `btl-accessibility-enforcer` first. |
| D4 | **Bedrock for companions ONLY** | Real Claude via Bedrock behind Cognito-authorized `/ai/*` endpoints for: case summary, intake assistance, outreach drafting. The citizen chat ("לימור") is **hidden behind a feature flag and OFF in pilot builds**. Never ship scripted responses presented as AI to real users. The matching engine stays deterministic rule-based — its explainability is a strength. |
| D5 | **No BTL internal integrations** | Standalone system. No connections to National Insurance internal systems (no institutional approval yet). Export-only (CSV) for evaluators. |
| D6 | **No autonomous agents / ML in pilot** | Defer: Service Discovery agent, Amazon Personalize, ML matching, provider logins, citizen self-service at scale, national dashboard, offline PWA. Design the schema for scale (see Data model) but do not build for it. |

## Data model (canonical, domain-agnostic)

DynamoDB, on-demand billing. Single-table or few-tables — your call, but keys must include a `tenantId` partition component (value `jerusalem` for pilot) so multi-city needs no migration.

Core entities (nursing-specific fields go in `programProfile`, nothing else may reference nursing):

- **Person**: `personId`, alias/firstName, birthYear, gender, neighborhood, languages, sector, `companionId`, consentAt, status. NO direct identifiers (D2).
- **Enrollment**: `personId`, `program` (`"nursing"` for pilot), `programProfile` (ICF/functional level, loneliness score, motivations, barriers, readiness — the current `PersonalProfile` psychological fields move here), startedAt.
- **Wallet**: `walletId`, `personId`, `period` (YYYY-MM), allocatedUnits, derived balance (computed from transactions, never stored as mutable truth).
- **Transaction**: append-only ledger — `txId`, walletId, type (`allocate|freeze|consume|release|adjust`), units, `bookingId?`, actorId, timestamp. Balance = fold(transactions).
- **Service**: the 102-item catalog, seeded server-side from `services-catalog.json`, plus subsidy tier per content world (port from libi subsidy engine: Belonging/Health 100%, Resilience/Digital 50%, Products 20%).
- **Booking**: state machine `recommended → selected → units_frozen → booked → attended | cancelled` (cancel releases units; attend consumes them). `aiRecommended` flag + stored `explanations`.
- **CarePlan / CrmAction**: companion tasks, status, priority, linked serviceIds.
- **TimelineEvent**: append-only per-person event stream (intake, call, visit, booking, risk_alert, note). This IS the measurement pipeline.
- **RiskSignal**: RDI/SDI inputs and computed scores (port concepts from SAL-ISHI-SIUD).
- **AuditLog**: append-only — actorId, action, entity, entityId, timestamp, before/after hash. Written by middleware on EVERY mutation and on reads of person records.

## API (Lambda + API Gateway, Cognito JWT authorizer on everything)

```
POST /auth/*                      (Cognito hosted or amplify-js)
GET/POST/PATCH /persons           list (caseload-scoped), create, update
POST /persons/:id/intake          intake payload → creates/updates Enrollment, runs matching, persists recommendations
GET  /persons/:id/matches         server-side run of the SAME matchingEngine.ts logic (share the module)
GET/POST /persons/:id/bookings    booking lifecycle transitions (server validates state machine + wallet)
GET/POST /persons/:id/actions     CRM actions
GET  /persons/:id/timeline
GET  /services                    catalog + filters
GET  /dashboard/kpis              computed from real TimelineEvents/Bookings — never hardcoded
GET  /export/events.csv           evaluator export (supervisor role only)
POST /ai/summary | /ai/outreach | /ai/intake-assist   (Bedrock, companion+ role, D4)
```

Rules:
- **Caseload scoping is enforced server-side**: a companion's JWT claims include `companionId`; every person query filters by it. Companion A must get 403 on companion B's clients — write a test for this.
- Matching runs server-side by importing the existing engine (move it to a shared package `packages/domain/` consumed by both frontend and Lambdas — do NOT fork the logic).
- All Lambda handlers TypeScript, zod-validated inputs, structured logs to CloudWatch.

## Roles (Cognito groups)

1. `companion` — own caseload CRUD, bookings, AI tools
2. `supervisor` — all caseloads read, KPIs, CSV export
3. `admin` — user management, catalog editing
No provider or citizen logins in pilot (companion-mediated).

## App split: ops vs demo

- `/app/*` — the production app: auth-gated, real API, BTL design, NO demo pages. New default build.
- The existing showcase (hackathon, /national, AutoDemo, scripted flows) stays available as a **separate build flag** (`VITE_MODE=demo`) deployed only to the existing GitHub Pages URL with mock data and a visible "דמו — נתונים להמחשה" banner.
- Production hosting: CloudFront + S3 + WAF, BrowserRouter (drop HashRouter in the app build), custom domain if available.

## Sprints and Definition of Done

### Sprint 0 — Foundation (2–3 days)
- Tag current main as `demo-freeze`; GitHub Pages keeps serving it.
- `infra/` CDK app: Cognito pool + groups, DynamoDB, API GW, Lambdas skeleton, CloudFront; `dev` + `prod` stacks in il-central-1.
- Extract `packages/domain/` (types + matchingEngine + subsidy logic) shared by web and lambdas. Retire the duplicate libi `Client/LevProfile` model — one canonical schema per "Data model" above.
- **DoD:** `cdk deploy dev` succeeds; `npm run typecheck` clean; matching engine unit tests green (write ~10 golden tests capturing current scoring before refactor).

### Sprint 1 — Real system core (week 1–2)
- Typed API client (`src/api/`) + TanStack Query hooks replace all `mockData.ts` imports in `/app` screens.
- Cognito login UI (Rubik/BTL styled), role-guarded routes, caseload scoping.
- Person CRUD + intake-creates-record. Pseudonymization enforced (D2). Consent checkbox captured at intake.
- Audit middleware on all mutations + person reads.
- Seed script: 102 services + synthetic dev-only persons.
- **DoD:** login → see MY caseload only → create client via intake → matches persist → audit rows exist. Unauthenticated call to every route = 401. Cross-caseload access = 403 (tested).

### Sprint 2 — Wallet & workflow (week 2–3)
- Transaction ledger + booking state machine + monthly allocation job (EventBridge cron) + subsidy tiers.
- Companion daily flow persists: CRM actions, notes, timeline.
- Port SIUD deterioration views (RDI/SDI) onto real RiskSignal data.
- Event capture on every action; `GET /export/events.csv`.
- **DoD:** golden path end-to-end: intake → match → select → units frozen → booked → attended → balance reduced → event + audit logged. Cancel releases units. KPI endpoint returns computed (not hardcoded) numbers.

### Sprint 3 — Compliance, design, hardening (week 3–4)
- Full BTL Design System pass on `/app`: Rubik, palette, blue shadows, tokens (D3). Fix all mapped 5568 violations: touch targets ≥44px, text ≥ `text-xs`, focus-visible everywhere (list already in `IMPROVEMENT_PLAN.md` P1.1/P1.2/P1.4).
- Bedrock endpoints for companions (D4): case summary, outreach draft, intake assist. Hebrew system prompts; person context passed pseudonymized only.
- Ops: CloudWatch alarms (5xx, latency), Sentry in frontend, DynamoDB PITR on, smoke-test suite (Vitest + Playwright golden path), deployment runbook in README.
- **DoD:** axe-core scan zero criticals; manual 5568 checklist pass; PITR restore drill documented; dry-run with 286 pseudonymized clients loaded and 3 companion accounts.

## Constraints

- **Cost:** government pilot — DynamoDB on-demand, Lambda pay-per-use, no always-on servers. Bedrock only on companion request (no background LLM jobs).
- **Language:** code + comments in English; ALL user-facing text in Hebrew (clear, simple Hebrew — many users are not fluent readers).
- **Honesty:** no fake numbers in the production app. If a KPI has no data yet, show "אין עדיין נתונים", not a mock value.
- **Incremental:** each sprint independently deployable; never break the demo build.
- **Don't rewrite the frontend.** The UI, matching logic, and catalog are assets. The work is substrate + wiring + design tokens.

## What success looks like

A companion (רונית) opens the app on her phone in a client's home in Pisgat Ze'ev, logs in, and sees only her caseload — live from DynamoDB in Israel. She runs an intake for a new client (pseudonymized), gets explainable matched services, books one — the wallet freezes units and her supervisor's utilization KPI ticks up from real events. She taps "סיכום תיק" and Bedrock Claude drafts it. Every action is in the audit log. At month's end, the evaluator downloads `events.csv` — the evidence the reform needs.
