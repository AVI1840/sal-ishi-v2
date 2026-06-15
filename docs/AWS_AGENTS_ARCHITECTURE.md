<div dir="rtl">

# סל אישי — ארכיטקטורת Multi-Agent על AWS | האקתון GenAI 2026

> מפרט לצוות תשתיות · מבוסס Amazon Bedrock AgentCore + Strands Agents SDK

---

## 1. תמצית — מה הצוות צריך להקים

**מה זה:** מערכת AI מבוססת 5 אייג'נטים אוטונומיים שמנהלת התאמת שירותי מניעה ל-286 אזרחים ותיקים.
**פלטפורמה:** Amazon Bedrock AgentCore (GA Oct 2025) — managed runtime, memory, observability.
**Agent Framework:** Strands Agents SDK (open source, AWS) — model-driven multi-agent orchestration.
**Model:** Claude 3.5 Sonnet (Anthropic) on Bedrock.

**ה-Frontend כבר מוכן** — צריך רק endpoint שמקבל messages ומחזיר SSE stream.

---

## 2. ארכיטקטורה — Multi-Agent System

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND (GitHub Pages - Live)                             │
│  React 18 + TypeScript · src/lib/ai.ts → streamChat()                                │
│  env: VITE_AI_ENDPOINT → POST /chat {messages} → SSE stream                         │
└───────────────────────────────────────┬─────────────────────────────────────────────┘
                                        │ HTTPS POST
                                        ▼
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                     AWS — Amazon Bedrock AgentCore                                    │
│                                                                                      │
│  ┌──────────────────────────────────────────────────────────────────────────────┐    │
│  │                     AgentCore Runtime (Serverless)                            │    │
│  │                                                                              │    │
│  │  ┌───────────────────────────────────────────────────────────────────────┐   │    │
│  │  │              SUPER AGENT (Supervisor / Orchestrator)                   │   │    │
│  │  │                                                                       │   │    │
│  │  │  Strands Agents SDK — routes requests to specialist agents            │   │    │
│  │  │  Model: Claude 3.5 Sonnet                                             │   │    │
│  │  │  Pattern: Supervisor with tool-use routing                             │   │    │
│  │  │                                                                       │   │    │
│  │  │  Tools:                                                                │   │    │
│  │  │  • route_to_limor(message) — chat with citizen                        │   │    │
│  │  │  • route_to_matching(citizen_id) — compute recommendations            │   │    │
│  │  │  • route_to_monitor(scan_all) — check deterioration                   │   │    │
│  │  │  • route_to_nudge(citizen_id, type) — send engagement                 │   │    │
│  │  │  • route_to_discovery(scan_sources) — find new services               │   │    │
│  │  └───────┬──────────────┬──────────────┬──────────────┬──────────────┬───┘   │    │
│  │          │              │              │              │              │         │    │
│  │          ▼              ▼              ▼              ▼              ▼         │    │
│  │  ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐ ┌────────────┐  │    │
│  │  │  LIMOR     │ │ MATCHING   │ │ MONITOR    │ │  NUDGE     │ │ DISCOVERY  │  │    │
│  │  │  Agent     │ │ Agent      │ │ Agent      │ │  Agent     │ │ Agent      │  │    │
│  │  │            │ │            │ │            │ │            │ │            │  │    │
│  │  │ Chat AI    │ │ 5-layer    │ │ RDI/SDI    │ │ Engagement │ │ Service    │  │    │
│  │  │ companion  │ │ scoring    │ │ anomaly    │ │ personalized│ │ catalog    │  │    │
│  │  │ Hebrew NLP │ │ 286×102    │ │ detection  │ │ messages   │ │ scanning   │  │    │
│  │  │ emotion    │ │ ranking    │ │ CRM alerts │ │ reactivation││ 25 sources │  │    │
│  │  │ detection  │ │ explain    │ │ escalation │ │ milestones │ │ enrichment │  │    │
│  │  └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘ └─────┬──────┘  │    │
│  │        │              │              │              │              │           │    │
│  └────────┼──────────────┼──────────────┼──────────────┼──────────────┼───────────┘    │
│           │              │              │              │              │                 │
│           ▼              ▼              ▼              ▼              ▼                 │
│  ┌──────────────────────────────────────────────────────────────────────────────┐      │
│  │                      AgentCore Memory (Managed)                               │      │
│  │                                                                              │      │
│  │  Short-term: session/conversation context (per citizen)                      │      │
│  │  Long-term: citizen profiles, preferences, interaction history               │      │
│  │  Semantic: vector embeddings for service matching + citizen similarity        │      │
│  └──────────────────────────────────────────────────────────────────────────────┘      │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────┐      │
│  │                      AgentCore Gateway (Tools)                                │      │
│  │                                                                              │      │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────────┐  ┌──────────┐  ┌───────────┐ │      │
│  │  │ Wallet   │  │ Booking  │  │ CRM Actions  │  │ Catalog  │  │ Notify    │ │      │
│  │  │ Service  │  │ Service  │  │ Generator    │  │ CRUD     │  │ (SNS/SES) │ │      │
│  │  │ (Lambda) │  │ (Lambda) │  │ (Lambda)     │  │ (Lambda) │  │           │ │      │
│  │  └────┬─────┘  └────┬─────┘  └──────┬───────┘  └────┬─────┘  └─────┬─────┘ │      │
│  └───────┼──────────────┼───────────────┼───────────────┼───────────────┼───────┘      │
│          │              │               │               │               │              │
│          ▼              ▼               ▼               ▼               ▼              │
│  ┌──────────────────────────────────────────────────────────────────────────────┐      │
│  │                          Data Layer                                           │      │
│  │                                                                              │      │
│  │  ┌──────────┐  ┌──────────────┐  ┌─────────────┐  ┌────────────────────┐    │      │
│  │  │ DynamoDB │  │ S3           │  │ OpenSearch  │  │ Amazon             │    │      │
│  │  │          │  │              │  │ Serverless  │  │ Transcribe         │    │      │
│  │  │ Citizens │  │ Audio files  │  │             │  │                    │    │      │
│  │  │ Wallets  │  │ Documents    │  │ Vector      │  │ Hebrew voice→text  │    │      │
│  │  │ Bookings │  │ Service imgs │  │ embeddings  │  │ Real-time intake   │    │      │
│  │  │ Actions  │  │              │  │ (RAG)       │  │                    │    │      │
│  │  └──────────┘  └──────────────┘  └─────────────┘  └────────────────────┘    │      │
│  └──────────────────────────────────────────────────────────────────────────────┘      │
│                                                                                        │
│  ┌──────────────────────────────────────────────────────────────────────────────┐      │
│  │                      Observability & Guardrails                                │      │
│  │                                                                              │      │
│  │  • AgentCore Tracing — full request flow across agents                       │      │
│  │  • Bedrock Guardrails — content safety, PII redaction, Hebrew toxicity       │      │
│  │  • CloudWatch Metrics — latency, errors, cost per agent                      │      │
│  │  • AgentCore Evaluation — quality scoring, A/B testing                       │      │
│  └──────────────────────────────────────────────────────────────────────────────┘      │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. פירוט 5 האייג'נטים

</div>

| Agent | תפקיד | Model | Tools | Schedule | Output |
|-------|--------|-------|-------|----------|--------|
| **Super Agent** | Supervisor — routes to specialists, coordinates chains | Claude 3.5 Sonnet | route_to_*, escalate, schedule | 24/7 event-driven | Routing decisions, coordination |
| **Limor** (לימור) | AI companion for citizens — chat, emotional support, booking | Claude 3.5 Sonnet | get_citizen_profile, search_services, create_booking, detect_emergency | On user message | Conversational response (SSE stream) |
| **Matching Engine** | Computes 286×102 match scores using 5-layer algorithm | Claude 3.5 Haiku (speed) | get_all_citizens, get_catalog, compute_score, update_recommendations | Weekly + post-intake | Updated recommendations per citizen |
| **Deterioration Monitor** | Detects decline signals: inactivity, cancellations, mood | Claude 3.5 Haiku | get_activity_log, compute_rdi, compute_sdi, create_crm_action | Daily 07:30 | Risk alerts + CRM actions |
| **Nudge Engine** | Sends personalized engagement: reminders, milestones, reactivation | Claude 3.5 Haiku | get_citizen_persona, get_schedule, send_sms, send_whatsapp | Daily 08:00 + events | Personalized messages |
| **Service Discovery** | Scans 25 sources for new services, enriches catalog | Claude 3.5 Sonnet | web_search, parse_page, validate_service, add_to_catalog | Weekly Sunday 06:00 | New/updated services |

<div dir="rtl">

---

## 4. Technology Stack — AWS Services

| שכבה | שירות | שימוש |
|------|--------|-------|
| **Agent Runtime** | Amazon Bedrock AgentCore Runtime | Managed serverless execution, session isolation, up to 8h workloads |
| **Agent Memory** | Amazon Bedrock AgentCore Memory | Short-term (session), long-term (citizen profiles), semantic (embeddings) |
| **Agent Tools** | Amazon Bedrock AgentCore Gateway | Connect Lambda tools, MCP servers, APIs — with auth |
| **Agent Framework** | Strands Agents SDK (open source) | Multi-agent orchestration, model-driven, tool-use |
| **Foundation Model** | Claude 3.5 Sonnet (Anthropic) via Bedrock | Reasoning, Hebrew NLP, emotional detection |
| **Fast Model** | Claude 3.5 Haiku via Bedrock | Batch scoring, monitoring, nudges (cost-efficient) |
| **Voice** | Amazon Transcribe | Hebrew speech-to-text for intake |
| **Search/RAG** | Amazon OpenSearch Serverless | Vector embeddings for service matching |
| **Database** | Amazon DynamoDB | Citizens, wallets, bookings, CRM actions |
| **Storage** | Amazon S3 | Audio recordings, service images, documents |
| **Notifications** | Amazon SNS + SES | SMS/email to citizens and coordinators |
| **Scheduling** | Amazon EventBridge | Daily/weekly agent triggers |
| **Safety** | Amazon Bedrock Guardrails | Content filtering, PII redaction, Hebrew safety |
| **Observability** | AgentCore Tracing + CloudWatch | End-to-end request tracking, cost monitoring |
| **Auth** | Amazon Cognito | User authentication (citizens, coordinators, providers) |
| **API** | Amazon API Gateway (HTTP) | Frontend ↔ AgentCore communication |

---

## 5. חוזה Frontend ↔ Backend (SSE)

### Request (Frontend שולח)

```json
POST /chat
Content-Type: application/json

{
  "messages": [
    {"role": "system", "content": "את לימור, מלווה דיגיטלית..."},
    {"role": "user", "content": "אני מרגישה בודדה"}
  ],
  "citizen_id": "c1",
  "agent": "limor"
}
```

### Response (Backend מחזיר — SSE stream)

```
data: {"delta":{"text":"אני "}}
data: {"delta":{"text":"שומעת "}}
data: {"delta":{"text":"אותך, שרה."}}
data: {"metadata":{"agent":"limor","emotion_detected":"loneliness","action":"suggest_service"}}
data: [DONE]
```

**הנקודה הקריטית:** ה-Frontend (`src/lib/ai.ts`) כבר מפענח את הפורמט הזה. צריך רק endpoint שמחזיר אותו.

---

## 6. Agent Orchestration Flow — דוגמה מלאה

```
User: "אני מרגישה בודדה"
         │
         ▼
┌─── Super Agent ───┐
│ Classifies: emotion│ → Routes to: Limor Agent
│ Detects: loneliness│
└────────┬───────────┘
         │
         ▼
┌─── Limor Agent ────────────────────────────────────┐
│ 1. Reads citizen profile from AgentCore Memory      │
│    → שרה כהן, 78, פרסונה: family_oriented          │
│ 2. Detects emotion: loneliness (score 4/5)          │
│ 3. Searches matching services (tool: search_services)│
│    → Top match: מקהלה קהילתית (score 89)            │
│ 4. Generates empathetic response + suggestion        │
│ 5. Streams response via SSE                          │
│ 6. Logs interaction in AgentCore Memory              │
└────────┬───────────────────────────────────────────┘
         │
         ▼ (async, post-response)
┌─── Monitor Agent ──────────────────────────────────┐
│ Event: loneliness detected                          │
│ Action: Create CRM action for coordinator           │
│ → "שרה כהן — בדידות 4/5, הציעי פעילות קבוצתית"    │
│ Priority: HIGH                                      │
└────────┬───────────────────────────────────────────┘
         │
         ▼
┌─── Nudge Agent (next morning) ─────────────────────┐
│ Checks: שרה has loneliness flag + no booking        │
│ Action: Send personalized SMS                        │
│ → "שרה, המקהלה מתחילה מחר ב-10:00. חברתך מרים     │
│    תהיה שם. רוצה שנשמור לך מקום?"                   │
└────────────────────────────────────────────────────┘
```

---

## 7. Strands Agents SDK — Implementation Pattern

```python
from strands import Agent, tool
from strands.models import BedrockModel

# Define tools
@tool
def get_citizen_profile(citizen_id: str) -> dict:
    """Retrieve citizen profile from DynamoDB"""
    # ... DynamoDB get_item

@tool
def search_services(citizen_id: str, top_n: int = 5) -> list:
    """Run 5-layer matching algorithm for citizen"""
    # ... compute scores, return ranked services

@tool
def create_booking(citizen_id: str, service_id: str) -> dict:
    """Create a booking, reserve wallet units"""
    # ... DynamoDB put_item, update wallet

@tool
def detect_emergency(message: str) -> bool:
    """Check for 16 emergency keywords in Hebrew"""
    # ... keyword matching

# Define Limor Agent
limor = Agent(
    model=BedrockModel(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0"),
    system_prompt="""את לימור, מלווה דיגיטלית חמה לאזרחים ותיקים 65+.
    דברי בעברית פשוטה. זהי רגשות. הציעי שירותים כשמתאים.
    פיילוט: 286 אזרחים, ירושלים, ארנק 32 יחידות/חודש.""",
    tools=[get_citizen_profile, search_services, create_booking, detect_emergency],
)

# Define Super Agent (orchestrator)
super_agent = Agent(
    model=BedrockModel(model_id="anthropic.claude-3-5-sonnet-20241022-v2:0"),
    system_prompt="אתה מנהל מערכת האייג'נטים. נתב כל בקשה לאייג'נט המתאים.",
    tools=[route_to_limor, route_to_matching, route_to_monitor, route_to_nudge],
)
```

### Deploy to AgentCore Runtime

```bash
# Using Strands CLI
strands deploy --runtime agentcore --agent limor \
  --memory-enabled --tracing-enabled
```

---

## 8. Knowledge Base (RAG) — קטלוג שירותים

| מקור | תוכן | שימוש |
|------|-------|-------|
| `services-catalog.json` | 102 שירותים + מטא-דאטה | Limor recommends, Matching scores |
| `matching-algorithm.md` | 10 Decision Rules | Agent reasoning context |
| `pilot-data/` | 286 citizen profiles (mock → real) | Personalization |

**RAG Flow:**
1. User asks about services → Limor queries Knowledge Base
2. OpenSearch returns relevant services (vector similarity)
3. Limor augments response with specific service details + explainability

---

## 9. EventBridge Scheduling

```json
{
  "rules": [
    {
      "name": "daily-deterioration-scan",
      "schedule": "cron(30 7 * * ? *)",
      "target": "monitor-agent",
      "input": {"action": "scan_all_citizens"}
    },
    {
      "name": "daily-nudge-run",
      "schedule": "cron(0 8 * * ? *)",
      "target": "nudge-agent",
      "input": {"action": "generate_daily_nudges"}
    },
    {
      "name": "weekly-matching-refresh",
      "schedule": "cron(0 7 ? * SUN *)",
      "target": "matching-agent",
      "input": {"action": "recompute_all_scores"}
    },
    {
      "name": "weekly-service-discovery",
      "schedule": "cron(0 6 ? * SUN *)",
      "target": "discovery-agent",
      "input": {"action": "scan_sources"}
    }
  ]
}
```

---

## 10. Bedrock Guardrails Configuration

```json
{
  "name": "sal-ishi-safety",
  "blockedInputMessaging": "הודעה זו חסומה מטעמי בטיחות",
  "contentPolicyConfig": {
    "filtersConfig": [
      {"type": "HATE", "inputStrength": "HIGH", "outputStrength": "HIGH"},
      {"type": "VIOLENCE", "inputStrength": "HIGH", "outputStrength": "HIGH"}
    ]
  },
  "sensitiveInformationPolicyConfig": {
    "piiEntitiesConfig": [
      {"type": "ISRAEL_IDENTITY_NUMBER", "action": "ANONYMIZE"},
      {"type": "PHONE", "action": "ANONYMIZE"},
      {"type": "ADDRESS", "action": "ANONYMIZE"}
    ]
  },
  "wordPolicyConfig": {
    "managedWordListsConfig": [{"type": "PROFANITY"}]
  }
}
```

---

## 11. מה צריך ליום ההאקתון (MVP)

### Must Have (Day 1)

| # | רכיב | שירות AWS | זמן הקמה |
|---|-------|-----------|----------|
| 1 | AgentCore Runtime + Limor Agent deployed | Bedrock AgentCore | 2-3 שעות |
| 2 | API Gateway → Agent (SSE endpoint) | API Gateway HTTP | 1 שעה |
| 3 | Bedrock model access enabled | Bedrock Console | 5 דקות |
| 4 | AgentCore Memory (short-term) | Bedrock AgentCore | 30 דקות |
| 5 | CORS for GitHub Pages | API Gateway | 10 דקות |

### Nice to Have (Day 2)

| # | רכיב | שירות AWS |
|---|-------|-----------|
| 6 | DynamoDB tables (citizens, bookings) | DynamoDB |
| 7 | Knowledge Base with 102 services | Bedrock KB + OpenSearch |
| 8 | Transcribe integration (voice intake) | Transcribe |
| 9 | Multi-agent routing via Super Agent | Strands + AgentCore |
| 10 | Guardrails enabled | Bedrock Guardrails |

---

## 12. Cost Estimate (Hackathon Day)

| שירות | Usage | Cost |
|--------|-------|------|
| Bedrock Claude 3.5 Sonnet | ~500 requests × 1K tokens | ~$5 |
| Bedrock Claude 3.5 Haiku | ~2000 requests (batch) | ~$2 |
| AgentCore Runtime | Serverless | Free tier |
| AgentCore Memory | <1GB | Free tier |
| DynamoDB | On-demand | <$1 |
| API Gateway | ~5000 requests | Free tier |
| **Total** | | **~$8-15** |

---

## 13. Checklist לצוות תשתיות

- [ ] AWS Account with Bedrock access enabled (Claude 3.5 Sonnet + Haiku)
- [ ] AgentCore Runtime configured in region (us-east-1 recommended)
- [ ] Strands Agents SDK installed (`pip install strands-agents strands-agents-tools`)
- [ ] API Gateway HTTP API with CORS (`https://avi1840.github.io`, `http://localhost:*`)
- [ ] IAM Role with: `bedrock:InvokeModel*`, `dynamodb:*`, `s3:Get*`
- [ ] Test: `curl -X POST <endpoint>/chat -d '{"messages":[...]}'` → SSE output
- [ ] Share endpoint URL → Frontend team sets `VITE_AI_ENDPOINT`
- [ ] Budget alert: $20 daily limit

---

## 14. Resources

| Resource | URL |
|----------|-----|
| Strands Agents SDK | https://github.com/strands-agents/sdk-python |
| Bedrock AgentCore docs | https://docs.aws.amazon.com/bedrock-agentcore/ |
| Multi-Agent guidance | https://aws.amazon.com/solutions/guidance/multi-agent-orchestration-on-aws/ |
| Frontend (live) | https://avi1840.github.io/sal-ishi-v2/ |
| Frontend repo | https://github.com/AVI1840/sal-ishi-v2 |
| SSE contract | `src/lib/ai.ts` in repo |

</div>
