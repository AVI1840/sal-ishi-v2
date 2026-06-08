# דרישות Bedrock — מה נדרש מצוות התשתיות

## מה מוכן בצד שלנו
- `src/lib/ai.ts` — client עם streaming SSE + fallback scripted
- משתנה סביבה: `VITE_AI_ENDPOINT` — כשריק = fallback, כשמוגדר = Bedrock אמיתי
- הצ'אט (לימור) ו-Agentic Flow כבר עובדים בלי Bedrock (scripted)
- **רק צריך endpoint אחד** שמקבל JSON ומחזיר stream

---

## מה נדרש מכם

### 1. Lambda Function (proxy ל-Bedrock)

```
POST /chat
Content-Type: application/json

Body:
{
  "messages": [
    { "role": "system", "content": "את לימור, מלווה דיגיטלית..." },
    { "role": "user", "content": "אני מרגישה בודדה" }
  ],
  "stream": true
}

Response: SSE stream (text/event-stream)
data: {"text": "אני "}
data: {"text": "שומעת "}
data: {"text": "אותך..."}
data: [DONE]
```

### 2. AWS Services נדרשים

| Service | מה עושה | הגדרות |
|---------|---------|--------|
| **Amazon Bedrock** | Claude 3.5 Sonnet — צ'אט + ניתוח אינטייק | Region: us-east-1 / eu-west-1 |
| **AWS Lambda** | Proxy — מקבל request, קורא ל-Bedrock, מחזיר stream | Runtime: Node.js 20 |
| **API Gateway** | HTTPS endpoint ל-Lambda | CORS enabled, no auth (demo) |
| **Amazon Transcribe** (optional) | תמלול אמיתי של אינטייק | Real-time streaming |

### 3. IAM Policy נדרשת

```json
{
  "Effect": "Allow",
  "Action": [
    "bedrock:InvokeModel",
    "bedrock:InvokeModelWithResponseStream"
  ],
  "Resource": "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet*"
}
```

### 4. Lambda Code (מינימלי)

```javascript
import { BedrockRuntimeClient, InvokeModelWithResponseStreamCommand } from "@aws-sdk/client-bedrock-runtime";

const client = new BedrockRuntimeClient({ region: "us-east-1" });

export const handler = awslambda.streamifyResponse(async (event, responseStream) => {
  const body = JSON.parse(event.body);
  
  const command = new InvokeModelWithResponseStreamCommand({
    modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
    contentType: "application/json",
    body: JSON.stringify({
      anthropic_version: "bedrock-2023-05-31",
      max_tokens: 1024,
      messages: body.messages,
      system: body.messages.find(m => m.role === "system")?.content || "",
    }),
  });

  const response = await client.send(command);
  
  responseStream.setContentType("text/event-stream");
  
  for await (const chunk of response.body) {
    if (chunk.chunk?.bytes) {
      const parsed = JSON.parse(new TextDecoder().decode(chunk.chunk.bytes));
      if (parsed.type === "content_block_delta") {
        responseStream.write(`data: ${JSON.stringify({ text: parsed.delta.text })}\n\n`);
      }
    }
  }
  
  responseStream.write("data: [DONE]\n\n");
  responseStream.end();
});
```

### 5. מה אני צריך מכם (checklist)

- [ ] AWS Account ID
- [ ] API Gateway URL (אחרי deploy)
- [ ] Model access enabled (Bedrock → Claude 3.5 Sonnet)
- [ ] CORS enabled ל-`https://avi1840.github.io`
- [ ] Lambda function URL (streaming response enabled)

### 6. איך מחברים

ברגע שיש URL:
```bash
# ב-.env.local (לא ב-git)
VITE_AI_ENDPOINT=https://xxxxx.execute-api.us-east-1.amazonaws.com/chat
```

זה הכל. המערכת תזהה אוטומטית ותשתמש ב-Bedrock אמיתי.

---

## Timeline

- **עכשיו → 22/06:** Deploy Lambda + API Gateway + test
- **22/06 ערב:** אני מחבר ובודק streaming
- **23/06 בוקר:** האקתון — דמו חי עם Bedrock אמיתי

## ללא Bedrock
המערכת עובדת מושלם גם בלי — streaming scripted שנראה כמו AI אמיתי. אבל call אמיתי = wow factor לשופטים.
