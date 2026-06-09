# סל אישי להזדקנות מיטבית — NotebookLM Briefing

## What This Is

A **personalized service-orchestration platform** for Israel's national nursing reform. Instead of one generic care basket for all elderly citizens, the system creates a **personalized prevention basket for each citizen** — matched by AI to their needs, motivations, neighborhood, and functional status.

**One sentence:** "לא סל אחד לכולם — סל אישי לכל אזרח."

---

## The Problem

- **₪5 billion/year** in nursing benefits — 80% goes to home cleaning, not prevention
- **~60% utilization** — ~₪1,700/month per citizen at level 3 is wasted
- **No personalization** — same generic basket regardless of individual needs
- **No prevention** — services only kick in after deterioration, not before
- **No monitoring** — no early detection of decline

**Result:** Rapid deterioration, repeated hospitalizations, massive cost to the state.

---

## The Solution

**A 5-layer AI matching engine** that orchestrates 102 real services across 5 prevention domains:

| Domain | Subsidy | Goal |
|--------|---------|------|
| Belonging & Meaning | 100% | Prevent loneliness |
| Function & Health | 100% | Prevent physical decline |
| Personal Resilience | 50% | Strengthen coping |
| Digital Accessibility | 50% | Bridge digital gap |
| Home Services | 20% | Reduce dependency (nudge) |

**Matching algorithm (5 layers):**
1. Prevention impact (30%) — evidence-based decline prevention
2. Citizen motivation (25%) — what they want to do
3. Profile fit (20%) — mobility, language, sector
4. Social proof (15%) — what similar citizens recommend
5. Proximity (10%) — neighborhood, transport, accessibility

**5 autonomous AI agents** run 24/7: Discovery, Matching, Deterioration Monitor, Nudge Engine, Super Agent.

**Companion model:** 1 social companion per 75 citizens. AI handles detection + matching; human handles trust + action.

---

## The Proof

| Metric | Value |
|--------|-------|
| Pilot citizens | 286 (Pisgat Ze'ev, Jerusalem) |
| Mapped services | 102 (real, with addresses + phones) |
| Neighborhoods | 5 (secular, Arab, Haredi, mixed) |
| Companions | 4 |
| Providers | 12 |
| Basket utilization | 71% |
| Prevention services | 54% |
| Satisfaction | 4.7/5 |

**Government anchoring:** Decisions 127 + 150. Inter-ministerial committee (BTL + Treasury + Welfare + Health) approved ₪5B/year framework.

---

## The Impact

- **20% deterioration delay** (~3 months) = **₪2 billion/year savings** at national scale
- **30-40% reduction in unplanned hospitalizations** through prevention services
- **Cost per citizen:** ~₪117/month (technology + operations)
- **Expansion plan:** 5 neighborhoods → 5 cities → 220,000 citizens

---

## Why It's Different (Originality)

| Others do | We do |
|-----------|-------|
| Chatbots | Service orchestration |
| Search/catalog | Personalized matching |
| One-size-fits-all | Per-citizen basket |
| Reactive care | Proactive prevention |
| Manual caseload | AI-augmented companion |
| Black-box AI | 5-layer explainability |

---

## AWS Architecture

| Service | Role |
|---------|------|
| Amazon Bedrock (Claude) | Chat, intake analysis, recommendations |
| Amazon Transcribe | Voice intake → structured profile |
| Amazon Personalize | Service matching at scale |
| AWS Lambda | Agent execution (serverless) |
| Amazon S3 | Service catalog, profiles |
| Amazon DynamoDB | Real-time citizen status |

**Cost at scale:** ~$0.80/citizen/month.

---

## Live Platform

- **Main:** https://avi1840.github.io/sal-ishi-v2/
- **Companion (SDI/RDI):** https://avi1840.github.io/SAL-ISHI-SIUD/
- **Citizen (full):** https://libi-sal-ishi.vercel.app/

---

## Future Vision

The platform architecture is domain-agnostic. Same orchestration model applies to:
- Rehabilitation services
- Disability services
- Employment services
- Victims of terror support
- Any personalized public service allocation

**This isn't a nursing product. It's a new operating model for public services.**
