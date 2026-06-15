/**
 * AI Assistant — צ'אט + תובנות למלווה חברתית
 */
import { useState } from "react";
import { Sparkles, Send, TrendingUp, AlertTriangle, Heart, Users, Target } from "lucide-react";
import { cn } from "@/lib/utils";

interface Message {
  id: number;
  role: "user" | "ai";
  text: string;
  timestamp: string;
}

const INITIAL_MESSAGES: Message[] = [
  { id: 1, role: "ai", text: "שלום רונית! אני העוזר החכם שלך. אני יכול לעזור לך עם:\n\n• ניתוח מצב אזרחים\n• המלצות לפעולה\n• תובנות מנתונים\n• סיכום שיחות\n\nמה תרצי לדעת?", timestamp: "09:00" },
];

const INSIGHTS = [
  { icon: TrendingUp, title: "מגמה חיובית", text: "3 אזרחים שהיו בסיכון חזרו לפעילות סדירה השבוע", tone: "success" },
  { icon: AlertTriangle, title: "דורש תשומת לב", text: "רבקה לוי — 21 יום ללא פעילות. ביקור בית מומלץ בדחיפות", tone: "destructive" },
  { icon: Heart, title: "הצלחה", text: "שרה רוזנברג הגיעה ל-3 מפגשי מקהלה ברצף! ציון דרך", tone: "info" },
  { icon: Users, title: "דפוס", text: "אזרחים שמתחילים בביקור בית מראים 40% יותר התמדה בשירותים קבוצתיים", tone: "primary" },
  { icon: Target, title: "המלצה", text: "5 אזרחים עם מוטיבציית 'שייכות' טרם חוברו לשירות חברתי — שווה לבדוק", tone: "warning" },
];

const QUICK_PROMPTS = [
  "מי בסיכון הכי גבוה היום?",
  "תן לי סיכום על שרה רוזנברג",
  "אילו שירותים הכי מצליחים?",
  "מה הדפוסים של נטישה?",
];

const AI_RESPONSES: Record<string, string> = {
  "מי בסיכון הכי גבוה היום?": "לפי הנתונים, 3 אזרחים בסיכון קריטי:\n\n1. **רבקה לוי** — 21 יום ללא פעילות, בדידות 5/5, מעורבות 8%\n2. **אהרון מזרחי** — ירידה קוגניטיבית, 14 יום ללא פעילות\n3. **שרה רוזנברג** — ירידה במצב רוח, 7 ימים ללא פעילות\n\nמומלץ: ביקור בית לרבקה, שיחת טלפון לאהרון, nudge לשרה.",
  "תן לי סיכום על שרה רוזנברג": "**שרה רוזנברג**, בת 78, אלמנה, פסגת זאב\n\nמצב נוכחי:\n• מעורבות: 32% (ירידה)\n• בדידות: 4/5 (גבוה)\n• התמדה: 25%\n• 7 ימים ללא פעילות\n\nמוטיבציות: שייכות, משמעות, משפחה\nחסמים: פחד, קושי חברתי, ירידת מוטיבציה\nחוזקות: אנושיות, חכמה\n\nהחלום: \"לחזור לשיר במקהלה כמו פעם\"\n\nהמלצה: הציעי שיעור ניסיון במקהלה עם ליווי אישי.",
  "אילו שירותים הכי מצליחים?": "לפי נתוני התמדה (% שממשיכים אחרי חודש):\n\n1. סדנת בישול — 88%\n2. מקהלה קהילתית — 82%\n3. חוג ציור — 80%\n4. קבוצת הליכה — 78%\n5. התעמלות — 75%\n\nתובנה: שירותים יצירתיים (בישול, ציור, שירה) מראים התמדה גבוהה יותר מספורט. כנראה בגלל הקשר החברתי + תחושת המשמעות.",
  "מה הדפוסים של נטישה?": "ניתוח 6 חודשים מראה 3 דפוסים עיקריים:\n\n1. **שבוע 2-3** — הנטישה הגדולה ביותר (35%). סיבה: חוסר חיבור חברתי ראשוני\n2. **אחרי מחלה** — 28% לא חוזרים אחרי היעדרות של שבוע+\n3. **חורף** — ירידה של 20% בפעילויות חוץ\n\nהמלצות:\n• Nudge אישי ביום 10 לכל משתתף חדש\n• שיחת מעקב אחרי כל היעדרות של 5+ ימים\n• הגברת שירותים ביתיים בחורף",
};

export default function CoordinatorAI() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (text?: string) => {
    const msg = text || input.trim();
    if (!msg) return;

    const userMsg: Message = { id: Date.now(), role: "user", text: msg, timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) };
    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    setTimeout(() => {
      const response = AI_RESPONSES[msg] || `אני מנתח את הנתונים לגבי "${msg}"...\n\nלפי המידע שיש לי, אני ממליץ לבדוק את דשבורד ההידרדרות ולעבור על הפרופילים האישיים של האזרחים הרלוונטיים. רוצה שאעמיק?`;
      const aiMsg: Message = { id: Date.now() + 1, role: "ai", text: response, timestamp: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) };
      setMessages((prev) => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Sparkles className="w-6 h-6 text-primary" /> עוזר AI
        </h1>
        <p className="text-sm text-muted-foreground mt-1">תובנות, ניתוח נתונים, והמלצות מותאמות</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Chat */}
        <div className="lg:col-span-2 libi-card flex flex-col" style={{ height: "600px" }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-5 space-y-4">
            {messages.map((msg) => (
              <div key={msg.id} className={cn("flex", msg.role === "user" ? "justify-start" : "justify-end")}>
                <div className={cn("max-w-[85%] rounded-2xl px-4 py-3", msg.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm")}>
                  <p className="text-sm whitespace-pre-line">{msg.text}</p>
                  <p className={cn("text-[10px] mt-1", msg.role === "user" ? "text-primary-foreground/60" : "text-muted-foreground")}>{msg.timestamp}</p>
                </div>
              </div>
            ))}
            {isTyping && (
              <div className="flex justify-end">
                <div className="bg-muted rounded-2xl px-4 py-3 rounded-bl-sm">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                    <span className="w-2 h-2 bg-muted-foreground/40 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Quick Prompts */}
          <div className="px-5 py-2 border-t border-border flex gap-2 overflow-x-auto">
            {QUICK_PROMPTS.map((prompt) => (
              <button key={prompt} onClick={() => handleSend(prompt)} className="px-3 py-1.5 rounded-full border border-border text-xs font-medium text-foreground hover:bg-accent whitespace-nowrap shrink-0 transition-colors">
                {prompt}
              </button>
            ))}
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border">
            <div className="flex items-center gap-2">
              <input
                type="text" value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSend()}
                placeholder="שאל אותי משהו..."
                className="flex-1 h-11 px-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
                dir="rtl"
              />
              <button onClick={() => handleSend()} disabled={!input.trim()} className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors" aria-label="שלח">
                <Send className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>

        {/* Insights Sidebar */}
        <div className="space-y-4">
          <div className="libi-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" /> תובנות אוטומטיות
            </h3>
            <div className="space-y-3">
              {INSIGHTS.map((insight, i) => {
                const Icon = insight.icon;
                return (
                  <div key={i} className={cn("p-3 rounded-xl border", insight.tone === "destructive" ? "border-destructive/20 bg-destructive-soft/20" : insight.tone === "success" ? "border-success/20 bg-success-soft/20" : insight.tone === "warning" ? "border-warning/20 bg-warning-soft/20" : "border-border bg-muted/20")}>
                    <div className="flex items-start gap-2">
                      <Icon className={cn("w-4 h-4 mt-0.5 shrink-0", insight.tone === "destructive" ? "text-destructive" : insight.tone === "success" ? "text-success" : insight.tone === "warning" ? "text-warning-foreground" : "text-primary")} />
                      <div>
                        <h4 className="text-xs font-semibold text-foreground">{insight.title}</h4>
                        <p className="text-[11px] text-muted-foreground mt-0.5">{insight.text}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
