# Sal Ishi — Infrastructure (AWS CDK)

Horizon 1 (pilot) infrastructure, per `../PROMPT_SONNET5_PRODUCTION.md` Sprint 0
and `../docs/REFERENCE_ARCHITECTURE.md`. Region-pinned to **il-central-1** —
do not change this without a documented legal/data-residency review (D1).

## What's here vs. what's still a stub

**Real, deployable:**
- `lib/identity-stack.ts` — Cognito User Pool, 3 role groups (companion/supervisor/admin), app client, `companionId` custom claim.
- `lib/data-stack.ts` — 9 DynamoDB tables matching `../src/domain/schema.ts`, on-demand billing, PITR on.
- `lib/api-stack.ts` — HTTP API, Cognito JWT authorizer on every route except `/health`, CORS.
- `lambda/persons/list.ts` — caseload-scoped list (queries the `byCompanion` GSI off the caller's JWT claim, never a client-supplied filter).
- `lambda/persons/create.ts` — pseudonymized intake write (zod-validated, rejects any PII field outright) + audit log.
- `lambda/bookings/transition.ts` — booking state-machine transition + wallet ledger write, validated against `BOOKING_TRANSITIONS`.
- `lambda/services/list.ts` — catalog read.

**Wired but intentionally stubbed (returns `501 not_implemented`)** — each is a named Sprint 1/2 task in `PROMPT_SONNET5_PRODUCTION.md`:
- `POST /persons/{id}/intake` — should create an Enrollment + run the matching engine server-side (Sprint 1).
- `GET /persons/{id}/matches` — server-side run of `src/domain/matchingEngine.ts` (Sprint 1; needs the engine adapted from `PersonalProfile` to `Enrollment.programProfile`, see the note at the top of `matchingEngine.ts`).
- `GET/POST /persons/{id}/actions`, `GET /persons/{id}/timeline` — CRM/timeline persistence (Sprint 2).
- `GET /dashboard/kpis` — must be computed from real TimelineEvents, never hardcoded (Sprint 2).
- `GET /export/events.csv` — evaluator export, supervisor role only (Sprint 2).
- `POST /ai/summary|outreach|intake-assist` — Bedrock-backed, companion role only, D4 (Sprint 3).

**Not done at all yet, do not assume otherwise:**
- Seed script for the 102-service catalog and dev-only synthetic persons.
- CloudFront + WAF + custom domain in front of the HTTP API / SPA.
- CloudWatch alarms, Sentry wiring, deployment runbook (Sprint 3).
- Any actual `cdk deploy` — this has never been run against a real AWS account from this workspace.

## Prerequisites

- An AWS account with `il-central-1` enabled, and credentials configured locally (`aws configure` or SSO).
- Node 20+, and `npm install` run inside `infra/`.
- `npx cdk bootstrap aws://<account-id>/il-central-1` once per account, before the first deploy.

## Commands

```bash
cd infra
npm install
npm run build        # tsc typecheck
npx cdk synth         # render CloudFormation, no AWS calls required beyond account/region lookup
npm run deploy:dev    # cdk deploy --all -c stage=dev
```

## Design notes worth knowing before extending this

- **Shared schema, not a shared package.** `src/domain/schema.ts` is imported by Lambda handlers via a relative path (`../../../src/domain/schema`), not a published npm package — this repo isn't an npm workspace (see the tradeoff note in the Sprint 0 build log). `NodejsFunction` bundles it fine via esbuild. If this becomes awkward as more handlers are added, promoting `src/domain/` to a real workspace package is a mechanical follow-up, not a redesign.
- **`matchingEngine.ts` still expects the legacy `PersonalProfile` shape** (from `src/data/types.ts`), not the new pseudonymized `Enrollment.programProfile`. It was moved, not rewritten, in Sprint 0 specifically so the golden tests in `src/domain/__tests__/matchingEngine.golden.test.ts` could pin today's behavior before that adaptation happens. Do the adaptation in Sprint 1 against those tests, not blind.
- **Caseload scoping is claim-based, not request-based.** Every handler that touches a person must read `companionId` from the JWT (`getCallerCompanionId` in `lambda/shared/audit.ts`), never from the request body or a query parameter. Write a 403 test for cross-caseload access before Sprint 1 closes (explicit DoD item).
- **Wallet balance is never stored.** It's always `foldWalletBalance(transactions)` over the `WalletLedger` table. If you ever find yourself writing a `balance` field, stop — that's the bug this design prevents.
