<div dir="rtl">

# 🎯 הכנה להאקתון AWS GenAI — שאלות ותשובות מקצועיות

> **תאריך:** 23/06/2026 | **מיקום:** משרדי AWS ת"א, מנחם בגין 121, קומה 28
> **פורמט:** הצגה 4 דקות + שאלות מפאנל שופטים (עסקי + טכנולוגי)
> **קריטריונים:** בשלות תוצר, מקוריות, אימפקט על הארגון

---

## 📋 תוכן עניינים

1. [שאלות פאנל עסקי — אימפקט ו-ROI](#1-עסקי)
2. [שאלות פאנל טכנולוגי — ארכיטקטורה ו-AWS](#2-טכנולוגי)
3. [שאלות בשלות תוצר — מה באמת עובד](#3-בשלות)
4. [שאלות מקוריות — מה ייחודי כאן](#4-מקוריות)
5. [שאלות קשות — פינות בעייתיות](#5-קשות)
6. [שאלות Bedrock/AgentCore ספציפיות](#6-bedrock)
7. [שאלות "דמו" — מה אמיתי ומה mock](#7-דמו)
8. [שאלות הרחבה וסקייל](#8-סקייל)

---

## 1. שאלות פאנל עסקי — אימפקט ו-ROI {#1-עסקי}

### ש: מה האימפקט הארגוני? למה זה חשוב לביטוח לאומי?

**ת:** שלושה ממדים:
- **כלכלי:** דחיית הידרדרות ב-20% = חיסכון ~₪2 מיליארד שנתי (מחקר ביטוח לאומי + מאוחדת). כל שנה שאדם לא עובר לרמת סיעוד גבוהה יותר = חיסכון ישיר בתקציב.
- **תפעולי:** מלווה חברתית עוברת מ-30 לקוחות ידנית ל-75+ עם CRM חכם — מכפילים תפוקה ×2.5 בלי להגדיל כוח אדם.
- **רגולטורי:** עמידה בהחלטות ממשלה 127 ו-150 (רפורמת הסיעוד). המדינה מחויבת לבצע — השאלה אם עם מערכת חכמה או ידנית.

### ש: אם תקציב הסיעוד כבר קיים, למה בכלל צריך מערכת?

**ת:** כי 40% מהתקציב **לא מנוצל** (ניצול ~60%), ורוב מה שכן מנוצל הולך ל"ניקיון" (שירותי בית) ולא למניעה. המערכת לא דורשת תקציב חדש — היא מכוונת תקציב קיים של ₪20 מיליארד. ₪1,700 לחודש לאזרח הולכים לאיבוד. זה Nudge כלכלי, לא עלות נוספת.

### ש: מה ה-business model? מי משלם על הפיתוח?

**ת:** שלושה צירים:
1. **תקציב סיעוד ממשלתי** — 20 מיליארד ₪/שנה, כבר קיים
2. **חיסכון מדיד** — כל 1% דחיית הידרדרות = ~₪100 מיליון חיסכון שנתי
3. **עמלת פלטפורמה** — 7% מהעברות לספקים (מודל מארקטפלייס)

הפיתוח ממומן כחלק מהרפורמה — לא דורש fundraising נפרד.

### ש: 286 אנשים — זה מספיק כדי להוכיח?

**ת:** 286 אנשים ב-5 שכונות, 4 מגזרים (חילוני, ערבי, חרדי, מעורב), 15 חודשי הפעלה. זה לא סקר — זה פיילוט פעיל שמוכיח 25% מניעת הידרדרות (יעד היה 20%). המספרים הפחות חשובים מהמגוון: אם זה עובד בפסגת זאב, בית חנינא ועין כרם — זה עובד בכל מקום.

### ש: מי המתחרים? יש פתרונות אחרים?

**ת:** אין מתחרה ישיר. פתרונות קיימים:
- **CRM רגיל (Salesforce)** — מנהל תהליכים, לא מתאים שירותים לפי פרופיל
- **פלטפורמות wellness (Care.com, Honor)** — אין מנוע מניעה, אין סבסוד דינמי, אין ICF
- **מערכות BI לסיעוד** — dashboards, לא decision engine

**ייחודיות:** ראשון בעולם שמשלב: אלגוריתם מניעה + nudge כלכלי + multi-agent AI + הזדקנות מיטבית. לא קיים מודל כזה אף מקום.

---

## 2. שאלות פאנל טכנולוגי — ארכיטקטורה ו-AWS {#2-טכנולוגי}

### ש: מה ה-tech stack?

**ת:**
```
Frontend: React 18 + TypeScript + Vite + Tailwind + shadcn/ui → GitHub Pages
Backend:  API Gateway (HTTP) → Lambda (Python 3.12) → Bedrock AgentCore
Models:   Claude 3.5 Sonnet (שיחות), Claude 3.5 Haiku (batch)
Data:     DynamoDB (citizens, wallets, bookings), S3 (audio, docs)
Search:   OpenSearch Serverless (RAG — vector embeddings)
Voice:    Amazon Transcribe (Hebrew)
Schedule: EventBridge (daily/weekly agent triggers)
Safety:   Bedrock Guardrails (PII, content filtering)
Auth:     Cognito (RBAC: citizen, coordinator, vendor, admin)
Agent:    Strands Agents SDK → AgentCore Runtime
```

### ש: למה בחרתם ב-Bedrock AgentCore ולא פשוט Lambda עם Bedrock InvokeModel?

**ת:** ארבע סיבות:
1. **Memory מנוהל** — short-term (שיחה), long-term (פרופיל אזרח), semantic (embeddings) — בלי לנהל Redis/Pinecone בעצמנו
2. **Multi-agent orchestration** — 5 agents עם routing, לא רק LLM call אחד
3. **Observability מובנה** — tracing מלא בין agents, עלות per-agent, latency
4. **Guardrails** — PII anonymization (ת"ז, טלפון, כתובת) + content safety בעברית

Lambda פשוט = חיבור 1:1 ל-LLM. AgentCore = runtime שלם ל-agents עם memory, tools, safety.

### ש: למה Strands SDK ולא LangChain/LlamaIndex?

**ת:**
- **AWS native** — Strands נבנה ע"י AWS, אינטגרציה ישירה עם AgentCore
- **Model-driven** — ה-model עצמו מחליט באילו tools להשתמש (לא code routing)
- **Lightweight** — פחות abstraction layers, יותר שליטה
- **Production-ready** — לא POC framework, מותאם ל-AgentCore Runtime deployment

LangChain = גמישות מקסימלית אבל overhead. Strands = ישר ל-production על Bedrock.

### ש: איך ה-streaming עובד?

**ת:** Frontend שולח POST ל-API Gateway, Lambda קוראת ל-Bedrock `InvokeModelWithResponseStream`, ומחזירה SSE (Server-Sent Events):
```
data: {"delta":{"text":"שלום"}}
data: {"delta":{"text":" שרה"}}
data: [DONE]
```

ה-Frontend (`src/lib/ai.ts`) כבר מפרסר SSE — fallback לתסריט scripted אם אין תשובה תוך 15 שניות. גם Lambda Function URL נתמך (true streaming, לא buffered).

### ש: מה הCORS setup?

**ת:** 
```
Access-Control-Allow-Origin: https://avi1840.github.io
Access-Control-Allow-Headers: Content-Type
Access-Control-Allow-Methods: POST, OPTIONS
```
בפיתוח: גם `http://localhost:5173`, `http://localhost:5174`.

### ש: מה ה-latency ואיך מנהלים timeout?

**ת:**
- Frontend timeout: 15 שניות (אחרי זה = fallback scripted)
- Lambda timeout: 30 שניות
- API Gateway timeout: 29 שניות
- **Haiku** לbatch processing (monitoring, nudges) — ~0.5-1 שניות
- **Sonnet** לשיחות אינטראקטיביות — ~2-4 שניות (streaming, אז UX טוב)
- Cold start: minimal — Lambda 256MB, Python runtime

### ש: איך מנהלים state בין agents?

**ת:** AgentCore Memory — שלוש שכבות:
| שכבה | תוכן | TTL |
|------|-------|-----|
| Short-term | session/שיחה נוכחית | סוף session |
| Long-term | פרופיל אזרח, העדפות, היסטוריה | persistent |
| Semantic | vector embeddings — דמיון שירותים, אזרחים דומים | persistent |

ה-Super Agent מחזיק context routing, כל specialist agent מקבל relevant memory.

### ש: איך ה-RAG עובד?

**ת:** Knowledge Base על OpenSearch Serverless:
- **Source:** `services-catalog.json` (102 שירותים), `matching-algorithm.md` (10 decision rules), פרופילי אזרחים
- **Embedding:** Bedrock Titan Embedding
- **Retrieval:** כשאזרח שואל "מה יש לעשות?" — Limor queries KB → top-k services by vector similarity → augments response

### ש: מה בנוגע לאבטחת מידע?

**ת:** שלוש שכבות:
1. **Bedrock Guardrails:**
   - PII anonymization: ת"ז ישראלית, טלפון, כתובת
   - Content filtering: hate, violence
   - Hebrew toxicity detection
2. **RBAC (Cognito):**
   - אזרח → רואה רק שירותים מותאמים + ארנק שלו
   - מלווה → רואה רק לקוחות שלה
   - ספק → רואה רק הזמנות שלו
   - admin → הכל
3. **Encryption:** at-rest (DynamoDB/S3) + in-transit (TLS)

---

## 3. שאלות בשלות תוצר — מה באמת עובד {#3-בשלות}

### ש: מה בדיוק עובד היום מול מה שמדומה?

**ת: עובד (לוגיקה אמיתית):**

| רכיב | ראיה | מיקום בקוד |
|------|------|-----------|
| אלגוריתם 5 שכבות | מחשב scores בזמן אמת | `src/lib/matchingEngine.ts` |
| Safety Filter | מסנן שירותים שלא מתאימים תפקודית | `scorePrevention()` |
| Persona Boost | מכפיל לפי התאמה לפרסונה | `scoreMotivation()` |
| Proximity scoring | שכונה + שכונות סמוכות + הסעות | `scoreProximity()` |
| סבסוד דינמי | 5 טיירים + בוסטרים + cap | subsidy engine logic |
| CRM פעולות | 6 סוגי פעולות, מיון לפי דחיפות | CRM action generation |
| קליטה 6 שאלות | ICF + פרסונה + דגלי סיכון | intake wizard |
| 102 שירותים ממופים | 5 dimensions לכל שירות | `serviceCatalog.ts` |
| ממשק מלא (4 portals) | אזרח, מלווה, ספקים, ניהולי | React app live |

**ת: מדומה (mock data, דורש חיבור):**

| רכיב | מה מדומה | מה צריך |
|------|---------|--------|
| 75 אזרחים | `mockData.ts` | DB + intake flow אמיתי |
| ארנק דיגיטלי | localStorage | DynamoDB + monthly allocation |
| הזמנות | mock bookings | booking API + vendor confirmation |
| AI צ'אט (לימור) | scripted fallback | Bedrock endpoint (זה ה-MVP של ההאקתון!) |
| Health monitoring | mock readings | IoT / manual input |
| Notifications | אין | SNS/SES |

### ש: מה חדש מההאקתון? מה הוספתם?

**ת:** לפני ההאקתון: Frontend מלא + לוגיקה + mock data, בלי backend AWS.
**ביום ההאקתון:** 
1. ✅ Lambda + API Gateway → SSE endpoint חי
2. ✅ Bedrock Claude → AI צ'אט "לימור" בעברית חיה
3. ✅ AgentCore Runtime + Limor Agent deployed
4. ✅ CORS + End-to-end: Frontend → AWS → AI → stream back

**זה ההבדל:** מ-scripted responses → AI חי שמבין עברית, מזהה רגשות, ומציע שירותים מתאימים.

### ש: ה-Frontend live? אפשר לראות?

**ת:** כן. https://avi1840.github.io/sal-ishi-v2/
- `/citizen` — ממשק אזרח
- `/coordinator` — דשבורד מלווה + אלגוריתם + agents
- `/executive` — דשבורד ניהולי
- `/providers` — פורטל ספקים

הכל חי, עובד, עם נתונים ריאליסטיים.

---

## 4. שאלות מקוריות — מה ייחודי כאן {#4-מקוריות}

### ש: מה חדש כאן? יש הרבה recommendation engines...

**ת:** שלושה דברים שלא קיימים בשום מקום:

1. **Nudge כלכלי מובנה באלגוריתם:**
   לא רק "מה מתאים" אלא "מה מתאים + כמה עולה" — שירותי מניעה חינמיים, שירותי בית ב-80%. האלגוריתם לא רק ממליץ — הוא מכוון התנהגות כלכלית.

2. **Decision Engine עם 10 כללים מנוסחים:**
   לא black box. 10 כללים מפורשים בסדר עדיפות: חירום → בטיחות → הקצאה → סבסוד → המלצה → CRM. ניתן לביקורת, ניתן לשינוי מדיניות בלי לפתח מחדש.

3. **Multi-domain platform:**
   אותו מנוע — סיעוד, נכות, אבטלה, נפגעי איבה. מחליפים configurations, לא מערכות. ממש כמו שSpotify משתמש באותו engine לmusic ו-podcasts.

### ש: מה ההבדל בין זה ל-ChatGPT שנותן המלצות?

**ת:** ChatGPT = general knowledge, no data, no guardrails, no action.
סל אישי = **closed-loop system:**
- 102 שירותים ממופים עם meta-data (ICF, מיקום, עלות, שעות)
- ארנק עם יתרה ותפוגה
- Safety filter קשיח (לא מציע מה שלא בטוח)
- הזמנה אמיתית → העברת כסף → ביצוע ← מדידה
- Guardrails: PII, content safety, 16 מילות חירום

ChatGPT אומר "אולי תנסי יוגה". אנחנו אומרים "יוגה ביום שלישי ב-10:00 ב-150 מטר מהבית שלך, חינם, הנה כפתור הזמנה".

### ש: למה 5 agents ולא agent אחד?

**ת:** Separation of concerns + scheduling שונה:
- **Limor** = real-time (כשאזרח פונה) — Claude Sonnet, interactive
- **Matching** = batch (שבועי, 286×102 חישובים) — Claude Haiku, efficient
- **Monitor** = daily scan (7:30) — מחפש הידרדרות, מייצר CRM actions
- **Nudge** = daily (8:00) + event-driven — הודעות מותאמות
- **Discovery** = weekly (ראשון, 6:00) — סריקת מקורות חדשים

Agent אחד = bottleneck + no separation + impossible scheduling. Multi-agent = כל agent optimized לwork pattern שלו.

---

## 5. שאלות קשות — פינות בעייתיות {#5-קשות}

### ש: הAI יכול לטעות ולהציע שירות מסוכן?

**ת:** שלוש שכבות הגנה:
1. **Safety Filter (R02)** — כלל #2 מתוך 10: אם ICF של האזרח < דרישות ICF של השירות → השירות לא מופיע. שער קשיח, non-negotiable.
2. **Human-in-the-loop** — AI ממליץ, מלווה חברתית מאשרת, אזרח מחליט.
3. **Guardrails (R01)** — 16 מילות חירום בעברית → מפסיק הכל → מתריע למשפחה + מלווה.

אפס אוטונומיות מלאה: AI לא מבצע פעולות בלי אישור אנושי.

### ש: מה עם bias? האלגוריתם לא מפלה?

**ת:** ארבעה מנגנונים:
1. **Profile Fit (שכבה 3)** — מתחשב בשפה, מגזר, ניידות. ערבי מקבל שירותים בערבית, חרדי שירותים מופרדים.
2. **Loneliness Nudge** — מתקן bias: בודדים מקבלים יותר סבסוד לקבוצתי (affirmative action).
3. **Transparent weights** — 30/25/20/10/15 — ניתן לביקורת ולשינוי.
4. **No demographic filtering** — האלגוריתם מעולם לא מסנן לפי מין, דת או מוצא. רק לפי תפקוד + העדפות.

**שקיפות:** כל ציון ניתן להסבר — המערכת מציגה "למה הומלץ" (explanations array) לכל שירות.

### ש: עברית ב-AI — באמת עובד?

**ת:** Claude 3.5 Sonnet מצוין בעברית (Anthropic trained on Hebrew data). בנוסף:
- System prompt בעברית פשוטה ובגובה העיניים
- 16 מילות חירום בעברית מזוהות rule-based (לא רק NLP)
- Amazon Transcribe תומך Hebrew speech-to-text (לאינטייק קולי)
- בדיקות: הרצנו 50+ שיחות דמו בעברית — עובד. Edge cases: ערבית מדוברת ועברית + רוסית — דורש בדיקה.

### ש: מה עושים אם Bedrock לא זמין? SLA?

**ת:** שלוש שכבות fallback:
1. **Frontend scripted** — אם אין response תוך 15 שניות, מופיעות תשובות מוכנות מראש (עובד עכשיו)
2. **Model fallback** — אם Sonnet לא זמין, switch ל-Haiku (פחות חכם אבל מהיר)
3. **Graceful degradation** — המערכת עובדת ללא AI: קטלוג, ארנק, הזמנות, CRM — הכל עובד rule-based

המערכת **לא תלויה** ב-AI לפעולה הבסיסית. AI משפר, לא חוסם.

### ש: מה עם GDPR / תקנות פרטיות ישראליות?

**ת:**
- **PII redaction** — Bedrock Guardrails מאנונימיזציה: ת"ז, טלפון, כתובת
- **Data residency** — נתונים נשארים ב-AWS region (eu-west-1 / us-east-1)
- **Consent** — אזרח חותם הסכמה דיגיטלית בקליטה
- **Right to deletion** — DynamoDB delete + S3 lifecycle
- **Audit trail** — כל פעולה רשומה (מי, מתי, מה)
- **Encryption** — at-rest (AES-256) + in-transit (TLS 1.3)

### ש: מה העלות בייצור? זה לא יקר מדי?

**ת:** 
| Usage | Cost/month |
|-------|-----------|
| Claude Haiku (batch: monitoring, nudges, matching) × 286 citizens × 30 days | ~$50-100 |
| Claude Sonnet (interactive chats) × ~500 chats/month | ~$30-50 |
| DynamoDB + S3 + OpenSearch | ~$30 |
| Lambda + API Gateway | ~$5 |
| **סה"כ** | **~$120-200/חודש** |

**vs. חיסכון:** $200/חודש על 286 אזרחים = ~$0.70 לאזרח/חודש. חיסכון של ₪2 מיליארד/שנה ÷ 400,000 = ₪5,000 לאזרח/שנה. **ROI: ×7,000**.

---

## 6. שאלות Bedrock/AgentCore ספציפיות {#6-bedrock}

### ש: למה AgentCore ולא פשוט Bedrock Agents (הגרסה הישנה)?

**ת:** AgentCore (GA Oct 2025) = הדור החדש:
- **Managed Runtime** — serverless, session isolation, up to 8h workloads
- **Built-in Memory** — short/long/semantic — בלי לנהל DB נפרד
- **Tool Gateway** — חיבור Lambda tools, MCP servers, APIs עם auth
- **Strands SDK** — open source, model-driven orchestration
- **Evaluation** — A/B testing, quality scoring built-in

Bedrock Agents (legacy) = יותר rigid, פחות customizable, no multi-agent.

### ש: איך ה-Guardrails מוגדרים?

**ת:**
```json
{
  "contentPolicy": { "HATE": "HIGH", "VIOLENCE": "HIGH" },
  "piiPolicy": [
    {"type": "ISRAEL_IDENTITY_NUMBER", "action": "ANONYMIZE"},
    {"type": "PHONE", "action": "ANONYMIZE"},
    {"type": "ADDRESS", "action": "ANONYMIZE"}
  ],
  "wordPolicy": { "profanity": true }
}
```

### ש: איך EventBridge מתזמן agents?

**ת:**
```
07:30 daily  → Monitor Agent: scan all 286 citizens for deterioration
08:00 daily  → Nudge Agent: generate personalized messages
07:00 Sunday → Matching Agent: recompute 286×102 scores
06:00 Sunday → Discovery Agent: scan 25 service sources
```

כל trigger שולח event ל-AgentCore Runtime → Agent מתעורר → עובד → ישן.

### ש: מה ה-tools שכל agent מקבל?

**ת:**
| Agent | Tools |
|-------|-------|
| Limor | `get_citizen_profile`, `search_services`, `create_booking`, `detect_emergency` |
| Matching | `get_all_citizens`, `get_catalog`, `compute_score`, `update_recommendations` |
| Monitor | `get_activity_log`, `compute_rdi`, `compute_sdi`, `create_crm_action` |
| Nudge | `get_citizen_persona`, `get_schedule`, `send_sms`, `send_whatsapp` |
| Discovery | `web_search`, `parse_page`, `validate_service`, `add_to_catalog` |

כל tool = Lambda function. AgentCore Gateway מנהל auth + rate limiting.

---

## 7. שאלות "דמו" — מה אמיתי ומה mock {#7-דמו}

### ש: אם השופטים ירצו לנסות בזמן אמת?

**ת:** 
- **Frontend חי:** https://avi1840.github.io/sal-ishi-v2/ — עובד מיד
- **AI צ'אט:** אם Bedrock endpoint מחובר — עובד חי. אם לא — fallback scripted (שקוף, מציין שזה scripted)
- **אלגוריתם:** עובד חי — שנה משקלות, ראה שינוי בהמלצות בזמן אמת (`/coordinator/algorithm`)
- **דמו מלא:** `/citizen` → שירותים → הזמנה → `/coordinator` → רואה את ההזמנה + CRM action

### ש: איך מפרידים בין מה שבנוי למה שaspirational?

**ת:** כלל פשוט:
- **ממשק שנפתח ועובד** = בנוי
- **כפתור שמציג toast "coming soon"** = aspirational
- **Logic שמחשב ציונים** = בנוי
- **DB שמחזיק נתונים** = mock (localStorage)
- **AI שעונה** = scripted (→ חי עם Bedrock)

**שקיפות מלאה:** יש badge "נתוני דמו" בממשק. לא מתחזים למשהו שלא קיים.

---

## 8. שאלות הרחבה וסקייל {#8-סקייל}

### ש: איך עוברים מ-286 ל-50,000?

**ת:** שלושה שלבים:
1. **H2 2026:** 10 שכונות ירושלים → ~3,000 אזרחים (×10)
2. **2027 H1:** 3 ערים נוספות → ~15,000 (×50)
3. **2027 H2:** ארצי → 50,000 (×175)

**מה משתנה טכנולוגית:**
- DynamoDB = auto-scale. לא צריך לעשות כלום.
- Lambda = serverless. מתרחב אוטומטית.
- Matching batch: 3,000×102 = 306K חישובים. בHaiku = 5 דקות. 50K×102 = שעה. מקובל לbatch שבועי.
- **Multi-tenancy:** `authority_id` per tenant. כבר מתוכנן בschema.

### ש: מה עם ספקים? איך מגדילים מ-5 ל-500?

**ת:** 
- **פורטל ספקים קיים** (`/providers`) — כבר בנוי
- **Self-service onboarding** — ספק נרשם, מעלה שירותים, מחכה לאישור
- **Discovery Agent** — סורק 25 מקורות שבועי, מציע שירותים חדשים לmanual approval
- **מחירון תקרה** — מוגדר per content-world, ספק לא יכול לחרוג

### ש: למה לא mobile app?

**ת:** בכוונה. קהל היעד = 65+, low digital literacy.
- **Web responsive** — עובד בטלפון בלי התקנה
- **מלווה כerface** — רוב האינטראקציה דרך המלווה, לא ישירות
- **WhatsApp (שלב 2)** — הערוץ שהם כבר מכירים
- **קהילתי** — tablet משותף במרכז יום / מועדון

App store = חסם. Web link = אפס חיכוך.

---

## 🎯 טיפים לפיץ' (4 דקות)

### מבנה מומלץ:
| דקה | תוכן |
|-----|-------|
| 0:00-0:30 | "פנינה, בת 71..." — סטורי אישי + הבעיה |
| 0:30-1:30 | אתגר ההזדקנות + מספרים (400K, ₪20B, 90%) |
| 1:30-2:30 | הפתרון: סל אישי + 5 agents + אלגוריתם |
| 2:30-3:30 | דמו חי: קליטה → המלצה → הזמנה |
| 3:30-4:00 | תוצאות (25%, ₪2B) + next steps |

### מה להדגיש לשופטים:
- **בשלות:** "לא רעיון. 15 חודשים, 286 אנשים, 25% מניעת הידרדרות."
- **AWS native:** "Bedrock + AgentCore + Strands — production stack, לא PoC."
- **אימפקט:** "₪2 מיליארד חיסכון, 400,000 אזרחים, וועדה בין-משרדית כבר אישרה הרחבה."
- **מקוריות:** "ראשון בעולם: מנוע מניעה + nudge כלכלי + multi-agent AI."

### מה לא לומר:
- ❌ "אנחנו בשלב של רעיון" — אתם בשלב של הוכחה בשטח
- ❌ "זה כמו ChatGPT ל..." — זה closed-loop decision engine
- ❌ "הכל עובד" — תהיו שקופים. "הלוגיקה עובדת, ה-AI חי מההאקתון, ה-DB עדיין mock"
- ❌ פרטים טכניים ב-pitch — שמרו לשאלות

---

## 🚨 שאלות "kill" — מוכנים?

| שאלה | תשובה קצרה |
|------|-----------|
| "מה חדש כאן? recommendation engines קיימים" | "מניעה + nudge כלכלי + multi-agent. לא Netflix — government health AI." |
| "מי ישתמש בזה? זקנים לא יודעים טכנולוגיה" | "המלווה משתמשת, לא האזרח. בדיוק כמו רופא משתמש במערכת — החולה מרוויח." |
| "286 אנשים — לא statistically significant" | "4 מגזרים, 5 שכונות, 15 חודשים. ועדה בין-משרדית בדקה ואישרה הרחבה. מספיק." |
| "מה קורה אם AWS נופל?" | "Frontend + logic עובדים offline. AI = nice-to-have, לא must-have לפעולה יומית." |
| "תקציב הפעלה?" | "$200/חודש vs. ₪2B/שנה חיסכון. ROI ×7,000." |
| "למה לא פתרון מדף?" | "אין מדף. אין מערכת בעולם שמשלבת מניעה + סבסוד + ICF + multi-agent." |
| "איך ודאתם שהAI לא הוזה?" | "Closed catalog — 102 שירותים verified. Safety filter. Human approval. לא יכול להמציא." |
| "מה לגבי vendor lock-in עם AWS?" | "Frontend agnostic. Logic pure TypeScript. אפשר להחליף backend. AWS = best fit, not only fit." |

---

*בהצלחה! 🚀*

</div>
