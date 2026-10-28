<div dir="rtl">

# Sal Ishi — Reference Architecture for AI-Powered Public Services

> **Status:** target-state design document. Horizon 1 = what is committed and being built now (see `PROMPT_SONNET5_PRODUCTION.md`, the source of truth for the pilot). Horizons 2–3 in this document are **not yet built** — they are the roadmap this architecture earns its way toward, one proven horizon at a time. This document supersedes the hackathon-scoped `AWS_ARCHITECTURE.md` and `AWS_AGENTS_ARCHITECTURE.md` for anything beyond the hackathon demo.

</div>

## 0. What "re:Invent-worthy" means here

Not the flashiest AI. The most **defensible** one. A government platform earns a keynote slot by proving three things simultaneously that most GenAI demos never have to prove together:

1. **AWS Well-Architected** — it survives an AWS Solutions Architect's review, not just a browser demo.
2. **Government Digital Platform** — it survives a privacy regulator, an accessibility auditor, and a change of minister.
3. **AI-Native, not AI-theater** — the AI is a bounded, observable, human-supervised layer over a deterministic, explainable system of record — never the system of record itself.

The narrative hook for AWS: *"We didn't reach for agents on day one. We reached for a sovereign, pseudonymized, deterministic core — and earned the right to add AI-assist, then RAG, then agentic orchestration, one proven horizon at a time."* That restraint, backed by a real 3-neighborhood pilot with real citizens, is the differentiator — most public-sector AI pitches skip straight to "5 autonomous agents" with zero production users.

## 1. Design principles (cross-cutting, all horizons)

| Principle | Statement |
|---|---|
| **Sovereignty by default** | All compute and data in `il-central-1`. No cross-region replication of personal data without an explicit, logged, legally-reviewed exception. |
| **Pseudonymization by construction** | The schema has no field for teudat zehut, full name, or exact address. This isn't a policy — it's a type system constraint (see [[sal-ishi-pilot-decisions]]). Re-identification requires the companion's external linkage table, which the platform never touches. |
| **Deterministic core, AI-assist at the edges** | The matching engine, wallet ledger, and booking state machine are deterministic and unit-tested. LLMs draft, summarize, and explain — they never move a unit or make an eligibility decision unsupervised. |
| **Explainability is a first-class output** | Every recommendation carries its `explanations[]`. Every AI-drafted text is labeled as AI-drafted and requires companion approval before it reaches a citizen. |
| **Domain-agnostic core, program extensions** | Nursing lives in a `programProfile` extension of `Person`/`Enrollment`. Disability, employment, rehabilitation are new programs on the same platform, not new platforms. |
| **Multi-tenant from day one, enforced when needed** | `tenantId` (region) and `program` are partition-key components from Sprint 0, even though the pilot has one tenant. Horizon 2 turns on tenant isolation enforcement; Horizon 3 turns on program plurality. |
| **No institutional integration without approval** | The platform is standalone. Every external boundary is an authenticated export/import API, never a live write into BTL internal systems, until institutional approval exists. |
| **Every AI action is a logged, reversible event** | No silent writes. Guardrails + audit log + human approval gate around anything an LLM touches. |
| **Cost is a design input, not an afterthought** | Serverless, pay-per-use, model-tiering (Haiku for cheap/frequent, Sonnet for reasoning) from the first line of infrastructure code. |

## 2. Horizons

| | **Horizon 1 — Pilot** (weeks, committed) | **Horizon 2 — Regional scale** (6–12 months, conditional on H1 evidence) | **Horizon 3 — National, multi-domain, AI-native** (18–36 months, conditional on H2 + institutional approval) |
|---|---|---|---|
| Scope | 5 Jerusalem neighborhoods, ~2,000 clients, nursing only | All Jerusalem + 2–3 more cities, nursing only | National, multiple programs (disability, employment, rehab), cross-ministry consent-based data sharing |
| Tenancy | 1 tenant, schema ready for more | Multiple tenants (regions), isolation enforced & tested | Multiple tenants × multiple programs |
| AI | Deterministic matching + Bedrock for companions only (summary, outreach draft, intake assist) | + RAG over service catalog/policy docs (OpenSearch Serverless); companion co-pilot with citation | + Bounded agentic workflows (proposal-only, human-approved) for service discovery & deterioration triage; AgentCore-managed |
| Identity | Cognito, 3 roles, single region | Cognito + per-tenant admin delegation | Federated identity for cross-ministry actors (SAML/OIDC to gov IdP, if/when approved) |
| Data | DynamoDB + S3, PITR | + OpenSearch Serverless (vectors), read replicas for reporting | + Cross-domain data mesh with consent ledger |
| Gate to next horizon | 90-day pilot evidence: utilization ↑, deterioration signals captured, zero privacy incidents, 5568 audit passed | Regional isolation & load tests passed; unit economics proven at 10× scale | Institutional approval + inter-ministerial data-sharing agreement in place |

Everything below is described **per horizon** so nothing here contradicts the locked pilot decisions — it extends them.

## 3. Layered target architecture

```
┌────────────────────────────────────────────────────────────────────────────┐
│  CHANNELS            Companion PWA (H1)   Citizen app (H2)   Exec console (H2) │
├────────────────────────────────────────────────────────────────────────────┤
│  EDGE & IDENTITY      CloudFront + WAF (H1)   Cognito (H1, +federation H3)     │
├────────────────────────────────────────────────────────────────────────────┤
│  API                  API Gateway, JWT authorizer, per-route RBAC (H1)         │
├────────────────────────────────────────────────────────────────────────────┤
│  DOMAIN SERVICES       Person/Enrollment · Wallet/Booking · Matching (deterministic) · CRM/Timeline   — all H1, Lambda + packages/domain shared lib │
├────────────────────────────────────────────────────────────────────────────┤
│  AI PLATFORM           Bedrock Gateway+Guardrails, companion-only (H1)         │
│                        RAG Knowledge Base over catalog/policy (H2)             │
│                        Bounded agentic proposals, human-approved (H3)          │
│                        Evaluation harness + tracing (H2)                       │
├────────────────────────────────────────────────────────────────────────────┤
│  DATA                  DynamoDB (H1) · S3 (H1) · Audit log store (H1)          │
│                        OpenSearch Serverless vectors (H2) · Reporting replicas (H2) │
├────────────────────────────────────────────────────────────────────────────┤
│  FOUNDATIONS           CDK IaC · CI/CD · CloudWatch+Sentry · least-privilege IAM · tenant partitioning (schema H1, enforced H2)  │
└────────────────────────────────────────────────────────────────────────────┘
```

A rendered version of this diagram is attached in-conversation. Detail per layer is in the Well-Architected mapping below.

## 4. AWS Well-Architected mapping

### 4.1 Operational Excellence
- **H1:** CDK (TypeScript) stacks for `dev`/`prod`, one command deploy. Structured JSON logs from every Lambda. Runbook in repo README. `packages/domain/` shared between web and Lambda so matching logic is never forked. Smoke-test suite (Vitest + Playwright) gates deploys.
- **H2:** Per-tenant deploy pipelines; blue/green API Gateway stages; automated rollback on error-rate alarm; game-day drills (kill a Lambda, restore from PITR, verify).
- **H3:** Multi-account landing zone (AWS Organizations) — separate accounts per environment/region for blast-radius containment at national scale.

### 4.2 Security
- **H1:** Cognito JWT on every route; caseload scoping enforced server-side (companion JWT claim → query filter, tested for cross-caseload 403). Pseudonymization at the schema level (D2). Append-only audit log on every mutation and every read of a person record. TLS everywhere, WAF in front of CloudFront, secrets in Secrets Manager, least-privilege IAM per Lambda (no `dynamodb:*`, no `bedrock:*` wildcards — scoped to the exact table/model). Bedrock Guardrails: PII redaction (Israeli ID, phone, address patterns) on every AI input/output, content-safety filters, Hebrew profanity list.
- **H2:** Per-tenant IAM boundaries; automated PII-pattern scanning of new code (CI check) to prevent identifier fields from re-entering the schema; penetration test before scale-up.
- **H3:** Consent ledger for any cross-ministry data flow; field-level encryption for any newly-approved sensitive attribute; formal threat model refresh per new program domain.

### 4.3 Reliability
- **H1:** Serverless-only (no server to fail); DynamoDB on-demand with Point-in-Time Recovery; multi-AZ by default in `il-central-1`; idempotent Lambda handlers (retries safe); booking/wallet transactions use DynamoDB conditional writes to prevent double-spend of units under retry.
- **H2:** Cross-AZ load validated under regional-scale traffic; read replicas for reporting so KPI queries never contend with transactional writes; documented RTO/RPO per tenant.
- **H3:** Multi-region **read** failover for national availability (data residency still `il-central-1` as primary of record — no cross-region write replication of personal data without legal sign-off).

### 4.4 Performance Efficiency
- **H1:** Matching engine stays O(clients×services) in a single Lambda invocation per intake/request — 2,000 clients × 102 services is trivial; no premature ML infrastructure. Model tiering: Haiku-class model for short companion drafts, Sonnet-class for case summaries needing more reasoning.
- **H2:** OpenSearch Serverless for vector search once the catalog/policy corpus is large enough that keyword matching in `matchingEngine.ts` stops being sufficient — introduced as a **retrieval aid for companions**, not a replacement for the deterministic scorer.
- **H3:** Provisioned-concurrency only where a proven latency SLA requires it (e.g., a citizen-facing path, if H2 evidence justifies opening one); otherwise stay serverless.

### 4.5 Cost Optimization
- **H1:** 100% pay-per-use (Lambda, DynamoDB on-demand, Bedrock per-token). No idle infrastructure. Target: report actual cost-per-client-per-month from CloudWatch billing tags from week one — this number is the platform's most important non-functional metric for scale-up approval.
- **H2:** Savings Plans only once usage is predictable across tenants; S3 lifecycle policies for aged audit/log data; Bedrock prompt caching for repeated system-prompt context (catalog, policy) to cut token cost.
- **H3:** Cost allocation tags per tenant/program so national rollout has per-city, per-program unit economics — the number that lets Treasury compare this platform to the ₪5B/year status quo it's meant to replace.

### 4.6 Sustainability
- **H1:** Serverless-by-default already minimizes idle compute. `il-central-1` inherits AWS's regional efficiency program.
- **H2/H3:** Right-size Lambda memory via profiling; prefer Graviton-based runtimes where Lambda supports them; batch non-urgent AI jobs (e.g., weekly catalog enrichment in H2/H3) to off-peak windows.

## 5. Government Digital Platform lens

- **Sovereignty & residency:** `il-central-1` only, for every horizon. No exception without documented legal review — this is a harder constraint than most commercial architectures need, and it's why the platform can credibly ask for institutional trust later.
- **Compliance mapping:** Israeli Privacy Law + Amendment 13 → pseudonymization (D2) + audit log + consent capture at intake + data export/delete procedure. Standard 5568 / WCAG 2.1 AA → enforced via `btl-ui-design-system` + `btl-accessibility-enforcer`, gated with an automated axe-core check in CI, not a one-time manual pass.
- **Trust model with the parent institution:** standalone by design (D5). The only interfaces to National Insurance are (a) evaluator CSV export and (b) — only after institutional approval — a defined, versioned integration API. The platform never reaches into BTL systems; it waits to be integrated *into* by them, on their terms and timeline. This is a deliberate inversion of the usual "let's connect to everything" GovTech instinct, and it's exactly what makes standalone approval realistic in weeks rather than integration approval in years.
- **Interoperability as a first-class future feature, not a current dependency:** the earlier "Functional Translation Layer" proposal from the acceleration committee — a shared assessment vocabulary across BTL/Health/Welfare tools — is the natural H3 companion to this platform's `programProfile` extension pattern. Design the schema so that adopting a shared translation layer later is a mapping exercise, not a rewrite.
- **Human-in-the-loop by law, not just by preference:** algorithmic decisions in public benefits are politically and legally sensitive in Israel as elsewhere. Every AI-touched output (recommendation ranking, drafted summary, deterioration flag) requires a named human's approval before it affects a citizen's benefit or record. The audit log makes that approval provable after the fact.
- **Resilience to organizational change:** IaC + documented runbooks + no tribal knowledge in one engineer's head — a change of minister, vendor, or dev team shouldn't be able to lose the system. This is a Well-Architected concern that reads differently in government: the "operator" who needs continuity isn't a company, it's the state.
- **Procurement realism:** three contracting axes already identified by the acceleration committee (system operator / field operator / local service providers) map cleanly onto this architecture's boundaries — the system operator owns Horizons 1–3 above, the field operator owns the companion workflow and training, local providers plug in via the `Service` catalog with zero platform code changes.

## 6. AI-Native Platform lens

**The central design bet:** AI-native does not mean agent-first. It means every layer of the platform is *built to incorporate AI safely when the evidence justifies it* — gateway abstraction, guardrails, evaluation, and observability exist from Horizon 1, even while the actual AI surface area is small.

- **Model gateway, not vendor lock:** all LLM calls go through one internal interface (already the shape of `src/lib/ai.ts`, hardened for production) so the model behind it — Claude via Bedrock today — can be swapped, tiered, or dual-routed without touching call sites. Region-pinned to Bedrock in `il-central-1` where available; otherwise the nearest approved region with a documented data-flow exception.
- **Guardrails as a platform primitive (H1):** PII redaction, content safety, and Hebrew-language filters wrap every prompt and completion, not bolted on per feature.
- **Human approval gate (H1):** companion-facing AI outputs (case summary, outreach draft, intake assist) are drafts. Nothing reaches a citizen or a record unedited-and-unapproved. This is the single most important AI-native design decision in the whole platform — it's what separates "AI-assist" from "AI-decides," and it's the answer to the hardest question a regulator or journalist will ask.
- **RAG as an evidence-gated addition (H2):** once the service catalog and policy corpus are large and dynamic enough that a companion asking "what fits a client with X barrier in neighborhood Y" benefits from retrieval over the deterministic scorer's fixed weights, add OpenSearch Serverless-backed RAG — as an **explanation and discovery aid**, with citations back to source documents, not as a silent re-ranker.
- **Bounded agentic workflows, last (H3):** only after H1 proves human-in-the-loop AI works operationally and H2 proves RAG retrieval is trustworthy, introduce narrow, single-purpose agent workflows (e.g., a weekly service-discovery agent that *proposes* new catalog entries for human review; a deterioration-triage agent that *proposes* a prioritized outreach list). Every agent output lands in a review queue, never in a live write. AgentCore + Guardrails + tracing provide the operational envelope; Strands SDK or an equivalent orchestration layer is an implementation detail, not the headline.
- **Evaluation & observability (H2+):** an eval harness that scores AI-drafted outputs against a rubric (accuracy of citizen context, tone, absence of fabricated services) before any agentic feature ships, plus full request tracing so a bad AI output can always be traced back to the prompt, context, and model version that produced it.
- **Cost-aware model routing:** cheap/frequent tasks (nudge drafts, short summaries) on a fast/cheap model tier; reasoning-heavy tasks (case synthesis) on a stronger tier — decided by task type, not applied uniformly.

## 7. Why this is the reference architecture, not just *a* architecture

Most public-sector AI reference architectures either (a) over-promise agentic autonomy with no production users, or (b) under-deliver by staying a slide deck. This one is designed to be judged on the same axis AWS judges its own customers: **can you show a Well-Architected review, a compliance officer's sign-off, and a real usage metric, for the same system, at the same time?** Horizon 1 is scoped to make all three possible within weeks. Horizons 2 and 3 are not vaporware — they are the specific, evidence-gated next steps, with the schema and platform primitives already in place to make them additive rather than a rewrite.

## 8. Relationship to existing documents

- `PROMPT_SONNET5_PRODUCTION.md` — the executable Horizon 1 build plan. This document does not change any of its sprints or Definition-of-Done gates.
- `AWS_ARCHITECTURE.md`, `AWS_AGENTS_ARCHITECTURE.md` — hackathon-scoped (single region `us-east-1`, no auth, no compliance framing, full multi-agent vision on day one). Kept for historical reference; superseded here for anything beyond the hackathon demo build.
- `IMPROVEMENT_PLAN.md` / `UPGRADE_PLAN.md` — tactical UI/UX punch lists; unaffected by this document.

</div>
