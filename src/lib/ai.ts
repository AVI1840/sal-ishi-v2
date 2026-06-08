/**
 * AI client — thin wrapper for real Claude/Bedrock streaming.
 * Falls back to scripted responses when no endpoint is configured,
 * so the demo always works even without backend credentials.
 *
 * Config: set VITE_AI_ENDPOINT in .env.local for real Claude calls.
 * The endpoint must accept POST { messages } and return SSE stream
 * with lines: "data: {delta:{text:string}}" or "data: [DONE]"
 */

const ENDPOINT = (import.meta.env.VITE_AI_ENDPOINT as string | undefined) || "";
const STREAM_CHAR_DELAY = 18; // ms per char in fallback/stream-text mode

/** Stream any fixed string character-by-character — useful for scripted demos */
export async function streamText(
  text: string,
  callbacks: StreamCallbacks
): Promise<void> {
  await simulateStream(text, callbacks);
}

export interface ChatMessage {
  role: "user" | "assistant" | "system";
  content: string;
}

export interface StreamCallbacks {
  onToken: (token: string) => void;
  onDone: () => void;
  onError?: (err: Error) => void;
}

async function simulateStream(text: string, callbacks: StreamCallbacks): Promise<void> {
  for (const char of text) {
    await new Promise<void>((r) => setTimeout(r, STREAM_CHAR_DELAY + Math.random() * 12));
    callbacks.onToken(char);
  }
  callbacks.onDone();
}

export async function streamChat(
  messages: ChatMessage[],
  callbacks: StreamCallbacks
): Promise<void> {
  if (ENDPOINT) {
    try {
      const res = await fetch(ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages }),
        signal: AbortSignal.timeout(15_000),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      if (!res.body) throw new Error("no body");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        for (const line of chunk.split("\n")) {
          if (!line.startsWith("data: ")) continue;
          const data = line.slice(6).trim();
          if (data === "[DONE]") { callbacks.onDone(); return; }
          try {
            const json = JSON.parse(data) as {
              delta?: { text?: string };
              choices?: { delta?: { content?: string } }[];
            };
            const token =
              json.delta?.text ??
              json.choices?.[0]?.delta?.content ??
              "";
            if (token) callbacks.onToken(token);
          } catch {
            // ignore malformed SSE line
          }
        }
      }
      callbacks.onDone();
    } catch (err) {
      const e = err instanceof Error ? err : new Error(String(err));
      callbacks.onError?.(e);
      // Fall through to scripted fallback on error
      await simulateStream(SCRIPTED_FALLBACK_GENERIC, callbacks);
    }
    return;
  }

  // No endpoint — use scripted fallback with streaming effect
  const lastUser = [...messages].reverse().find((m) => m.role === "user")?.content ?? "";
  const response = SCRIPTED_RESPONSES[lastUser] ?? SCRIPTED_FALLBACK_GENERIC;
  await simulateStream(response, callbacks);
}

const SCRIPTED_FALLBACK_GENERIC =
  "אני מנתח את הנתונים... בהתבסס על הפרופיל האישי שלך, יש לי המלצות מותאמות. רוצה שאפרט?";

/**
 * Scripted fallback bank — matches CoordinatorAI quick prompts.
 * Extend as needed; all responses stream character-by-character.
 */
const SCRIPTED_RESPONSES: Record<string, string> = {
  "מי בסיכון הכי גבוה היום?":
    "לפי הנתונים, 3 אזרחים בסיכון קריטי:\n\n" +
    "1. רבקה לוי — 21 יום ללא פעילות, בדידות 5/5, מעורבות 8%\n" +
    "2. אהרון מזרחי — ירידה קוגניטיבית, 14 יום ללא פעילות\n" +
    "3. שרה רוזנברג — ירידה במצב רוח, 7 ימים ללא פעילות\n\n" +
    "המלצה: ביקור בית לרבקה, שיחת טלפון לאהרון, nudge לשרה.",

  "תן לי סיכום על שרה רוזנברג":
    "שרה רוזנברג, בת 78, אלמנה, פסגת זאב\n\n" +
    "מצב נוכחי:\n" +
    "• מעורבות: 32% (ירידה)\n• בדידות: 4/5 (גבוה)\n" +
    "• התמדה: 25%\n• 7 ימים ללא פעילות\n\n" +
    "מוטיבציות: שייכות, משמעות, משפחה\n" +
    "חסמים: פחד, קושי חברתי, ירידת מוטיבציה\n" +
    "החלום: 'לחזור לשיר במקהלה כמו פעם'\n\n" +
    "המלצה: הציעי שיעור ניסיון במקהלה עם ליווי אישי.",

  "אילו שירותים הכי מצליחים?":
    "לפי נתוני התמדה (% ממשיכים אחרי חודש):\n\n" +
    "1. סדנת בישול — 88%\n2. מקהלה קהילתית — 82%\n" +
    "3. חוג ציור — 80%\n4. קבוצת הליכה — 78%\n5. התעמלות — 75%\n\n" +
    "תובנה: שירותים יצירתיים מראים התמדה גבוהה יותר מספורט — בגלל הקשר החברתי ותחושת המשמעות.",

  "מה הדפוסים של נטישה?":
    "ניתוח 6 חודשים מראה 3 דפוסים עיקריים:\n\n" +
    "1. שבוע 2-3 — הנטישה הגדולה ביותר (35%). סיבה: חוסר חיבור חברתי ראשוני\n" +
    "2. אחרי מחלה — 28% לא חוזרים אחרי היעדרות של שבוע+\n" +
    "3. חורף — ירידה של 20% בפעילויות חוץ\n\n" +
    "המלצות:\n• Nudge אישי ביום 10 לכל משתתף חדש\n• שיחת מעקב אחרי היעדרות 5+ ימים\n• הגברת שירותים ביתיים בחורף",
};
