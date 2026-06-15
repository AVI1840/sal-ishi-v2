<div dir="rtl">

# סל אישי — מפרט ארכיטקטורה ודרישות תשתית | האקתון AWS GenAI

---

## 1. תמצית לאנשי תשתיות

**מה המערכת:** אפליקציית React (SPA) שמתאימה שירותי מניעה לאזרחים ותיקים באמצעות AI.
**מה חסר עכשיו:** Backend ב-AWS שמחובר ל-Amazon Bedrock (Claude) לצורך צ'אט AI, Transcribe לאינטייק קולי, ולוגיקה שרצה ב-Lambda.
**מה אתם צריכים לעשות:** להקים Lambda + API Gateway שמחזירים SSE stream בפורמט ספציפי. ה-Frontend כבר מוכן לצרוך.

---

## 2. ארכיטקטורה — תמונת-על

```
┌──────────────────────────────────────────────────────────────────────────────┐
│                           FRONTEND (GitHub Pages)                             │
│                                                                              │
│  sal-ishi-v2 — React 18 + TypeScript + Vite                                  │
│  URL: https://avi1840.github.io/sal-ishi-v2/                                 │
│                                                                              │
│  ┌─────────────┐  ┌─────────────────┐  ┌───────────────────┐                │
│  │ CitizenChat │  │ CoordinatorAI   │  │ LiveAgenticFlow   │                │
│  │ (לימור)     │  │ (עוזר מלווה)   │  │ (Agentic demo)    │                │
│  └──────┬──────┘  └────────┬────────┘  └─────────┬─────────┘                │
│         │                  │                     │                            │
│         └──────────────────┼─────────────────────┘                            │
│                            ▼                                                  │
│              src/lib/ai.ts — streamChat()                                     │
│              reads VITE_AI_ENDPOINT from .env                                 │
│              Falls back to scripted if no endpoint                            │
└────────────────────────────┬─────────────────────────────────────────────────┘
                             │ POST (HTTPS)
                             ▼
┌──────────────────────────────────────────────────────────────────────────────┐
│                        AWS BACKEND (to be created)                            │
│                                                                              │
│  ┌─────────────────┐     ┌───────────────────────────────────────────────┐   │
│  │ API Gateway     │────▶│ Lambda Function (Python/Node)                 │   │
│  │ (HTTP API)      │     │                                               │   │
│  │                 │     │  1. Receives { messages: ChatMessage[] }       │   │
│  │ Route:          │     │  2. Calls Bedrock InvokeModelWithResponseStream│   │
│  │ POST /chat      │     │  3. Returns SSE stream to client              │   │
│  │                 │     │                                               │   │
│  │ CORS: *         │     │  Model: anthropic.claude-3-5-sonnet-20241022  │   │
│  │ (or specific    │     │  Region: us-east-1 / eu-west-1                │   │
│  │  GitHub Pages)  │     │                                               │   │
│  └─────────────────┘     └───────────────────┬───────────────────────────┘   │
│                                              │                                │
│                                              ▼                                │
│                           ┌──────────────────────────────────┐                │
│                           │ Amazon Bedrock                    │                │
│                           │ anthropic.claude-3-5-sonnet       │                │
│                           │ (or claude-3-haiku for speed)     │                │
│                           └──────────────────────────────────┘                │
│                                                                              │
│  ┌─────────────────────────────────────────────────────────────────────────┐ │
│  │ OPTIONAL — Phase 2                                                      │ │
│  │                                                                         │ │
│  │ ┌──────────────┐  ┌──────────────────┐  ┌────────────────────────────┐ │ │
│  │ │ Transcribe   │  │ S3 (audio store) │  │ DynamoDB (conversations)   │ │ │
│  │ │ (voice→text) │  │                  │  │                            │ │ │
│  │ └──────────────┘  └──────────────────┘  └────────────────────────────┘ │ │
│  └─────────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## 3. מה ה-Frontend מצפה (חוזה SSE)

### Endpoint

| פרמטר | ערך |
|--------|-----|
| Method | `POST` |
| URL | `https://<api-gateway-id>.execute-api.<region>.amazonaws.com/chat` |
| Content-Type | `application/json` |
| Response Type | `text/event-stream` (SSE) |
| CORS | `Access-Control-Allow-Origin: *` (או `https://avi1840.github.io`) |

### Request Body

```json
{
  "messages": [
    { "role": "system", "content": "את לימור, מלווה דיגיטלית לאזרחים ותיקים..." },
    { "role": "user", "content": "אני מרגישה בודדה" }
  ]
}
```

### Response — SSE Stream (line by line)

```
data: {"delta":{"text":"אני "}}

data: {"delta":{"text":"שומעת "}}

data: {"delta":{"text":"אותך"}}

data: [DONE]
```

**פורמט נתמך (OR — כל אחד עובד):**

| פורמט | מבנה JSON | איפה ה-token |
|--------|-----------|--------------|
| פורמט A (מועדף) | `{"delta":{"text":"..."}}` | `json.delta.text` |
| פורמט B (OpenAI compatible) | `{"choices":[{"delta":{"content":"..."}}]}` | `json.choices[0].delta.content` |

**חשוב:**
- כל שורה מתחילה ב-`data: ` (עם רווח)
- שורה ריקה בין events (סטנדרט SSE)
- סיום: `data: [DONE]`
- אם יש timeout (15 שניות) — ה-Frontend נופל ל-fallback scripted

---

## 4. Lambda — Implementation Guide

### Option A: Python (boto3 + streaming)

```python
import json
import boto3

bedrock = boto3.client("bedrock-runtime", region_name="us-east-1")

def lambda_handler(event, context):
    body = json.loads(event.get("body", "{}"))
    messages = body.get("messages", [])
    
    # System prompt for Limor (AI companion for elderly)
    system = next((m["content"] for m in messages if m["role"] == "system"), 
                  "את לימור, מלווה דיגיטלית חמה ומקצועית לאזרחים ותיקים. דברי בעברית פשוטה ובגובה העיניים.")
    
    # Filter to user/assistant messages
    conversation = [m for m in messages if m["role"] in ("user", "assistant")]
    
    response = bedrock.invoke_model_with_response_stream(
        modelId="anthropic.claude-3-5-sonnet-20241022-v2:0",
        body=json.dumps({
            "anthropic_version": "bedrock-2023-05-31",
            "max_tokens": 500,
            "system": system,
            "messages": conversation,
        }),
        contentType="application/json",
    )
    
    # Stream SSE
    def generate():
        for event in response["body"]:
            chunk = json.loads(event["chunk"]["bytes"])
            if chunk["type"] == "content_block_delta":
                text = chunk["delta"].get("text", "")
                if text:
                    yield f"data: {json.dumps({'delta': {'text': text}})}\n\n"
        yield "data: [DONE]\n\n"
    
    return {
        "statusCode": 200,
        "headers": {
            "Content-Type": "text/event-stream",
            "Cache-Control": "no-cache",
            "Access-Control-Allow-Origin": "*",
            "Access-Control-Allow-Headers": "Content-Type",
        },
        "body": "".join(generate()),  # Note: for true streaming use Lambda URL
        "isBase64Encoded": False,
    }
```

### Option B: Lambda Function URL (true streaming)

For **real-time streaming** (not buffered), use **Lambda Function URL** with response streaming:

```python
# Use awslambdaric with streaming support
# Deploy with: sam build && sam deploy
# Function URL config: InvokeMode: RESPONSE_STREAM
```

### API Gateway Setup (if not using Function URL)

```yaml
# template.yaml (SAM)
Resources:
  ChatFunction:
    Type: AWS::Serverless::Function
    Properties:
      Handler: app.lambda_handler
      Runtime: python3.12
      Timeout: 30
      MemorySize: 256
      Policies:
        - Statement:
          - Effect: Allow
            Action:
              - bedrock:InvokeModelWithResponseStream
              - bedrock:InvokeModel
            Resource: "arn:aws:bedrock:*::foundation-model/anthropic.*"
      Events:
        Chat:
          Type: HttpApi
          Properties:
            Path: /chat
            Method: POST

  # CORS
  HttpApi:
    Type: AWS::Serverless::HttpApi
    Properties:
      CorsConfiguration:
        AllowOrigins:
          - "https://avi1840.github.io"
          - "http://localhost:5173"
          - "http://localhost:5174"
        AllowMethods:
          - POST
          - OPTIONS
        AllowHeaders:
          - Content-Type
```

---

## 5. Environment Variables

### Frontend (.env.local)

```bash
# Set this to enable real AI:
VITE_AI_ENDPOINT=https://<api-id>.execute-api.<region>.amazonaws.com/chat

# Without this variable — system uses scripted fallback (always works)
```

### Lambda

```bash
MODEL_ID=anthropic.claude-3-5-sonnet-20241022-v2:0
# or: anthropic.claude-3-haiku-20240307-v1:0 (faster, cheaper for demo)
```

---

## 6. System Prompt (לימור)

ה-Frontend שולח את ה-system prompt הבא (ניתן לעדכן ב-Lambda):

```
את לימור, מלווה דיגיטלית חמה ומקצועית לאזרחים ותיקים (65+) במסגרת רפורמת הסל האישי.

כללי שיחה:
- דברי בעברית פשוטה, חמה ובגובה העיניים
- השתמשי בשם הפרטי של האזרח
- הציעי שירותים מהקטלוג כשמתאים (102 שירותים)
- זהי סימני מצוקה/בדידות/הידרדרות ודווחי
- אל תמציאי מידע שאינך יודעת

הקשר:
- פיילוט ירושלים, 286 אזרחים, 5 שכונות
- ארנק דיגיטלי: 32 יחידות/חודש
- שירותי מניעה חינמיים (100% סבסוד)
- שירותי בית: 80% מהמחיר (20% סבסוד)
```

---

## 7. Phase 2 — אם יש זמן בהאקתון

| רכיב | שירות AWS | מטרה |
|------|-----------|------|
| תמלול קולי | Amazon Transcribe | אינטייק קולי — אזרח מדבר, AI מנתח |
| שמירת שיחות | DynamoDB | פרסיסטנטיות לשיחות |
| אחסון אודיו | S3 | הקלטות אינטייק |
| Personalize | Amazon Personalize | המלצות שירותים (חלופה ל-matchingEngine) |

---

## 8. Checklist לפני ההאקתון

- [ ] Lambda deployed + working (`curl -X POST ... | grep "data:"`)
- [ ] CORS מאפשר `https://avi1840.github.io`
- [ ] Model access enabled בחשבון AWS (Bedrock → Model access)
- [ ] `.env.local` עם `VITE_AI_ENDPOINT` — tested locally
- [ ] Timeout: Lambda 30s, API Gateway 29s
- [ ] Budget alert: $10 limit (claude-3-haiku ~$0.001 per request)

---

## 9. בדיקת קצה-לקצה

```bash
# Test the endpoint directly:
curl -X POST https://<your-endpoint>/chat \
  -H "Content-Type: application/json" \
  -d '{"messages":[{"role":"user","content":"שלום, מה השירותים שלי?"}]}' \
  --no-buffer

# Expected output:
# data: {"delta":{"text":"שלום"}}
# data: {"delta":{"text":"! "}}
# data: {"delta":{"text":"אני..."}}
# data: [DONE]
```

אחרי שזה עובד — הכניסו את ה-URL ל-`.env.local` של הפרויקט, הריצו `npm run dev`, ותראו את ה-AI עובד חי בצ'אט.

---

## 10. קשר

| נושא | איש קשר |
|------|---------|
| Frontend + חוזה SSE | אביעד (הפרויקט הזה) |
| AWS Account + Bedrock | צוות תשתיות |
| Demo flow | https://avi1840.github.io/sal-ishi-v2/#/demo |

</div>
