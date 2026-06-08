import { Send, Bot, Sparkles, Mic } from "lucide-react";
import { useState, useEffect, useRef, useCallback } from "react";
import { streamText } from "@/lib/ai";

interface Message {
  id: number;
  text: string;
  sender: "citizen" | "ai";
  time: string;
  typing?: boolean;
  badge?: string;
}

const AI_RESPONSES: { trigger: string[]; response: string; badge?: string }[] = [
  { trigger: ["בודד", "לבד", "בדידות"], response: "אני שומעת אותך, שרה. בדידות זה מרגש קשה. שמתי לב שאת אוהבת מוזיקה — יש חוג שירה מחר ב-10:00 במתנ״ס, עם 8 משתתפים שדומים לך. רוצה שאזמין מקום?", badge: "התאמה אישית" },
  { trigger: ["כן", "בבקשה", "רוצה"], response: "מעולה! הזמנתי לך מקום לחוג שירה, יום ג׳ ב-10:00. שלחתי תזכורת לוואטסאפ. גם חברתך מרים תהיה שם.", badge: "הוזמן" },
  { trigger: ["כואב", "לא טוב", "חולה", "כאב"], response: "אני מקווה שתרגישי טוב יותר. על סמך מה שסיפרת, אני רואה שיש לך זכאות לפיזיותרפיה ביתית (מסובסדת 100%). רוצה שאתאם ביקור?", badge: "זיהוי צורך בריאותי" },
  { trigger: ["מה יש", "מה אפשר", "שירותים", "פעילויות"], response: "על בסיס הפרופיל שלך, הנה 3 המלצות מותאמות:\n\n1. חוג ציור — התאמה 94%\n2. שחייה טיפולית — התאמה 88%\n3. מועדון קריאה — התאמה 85%\n\nכל אלה מסובסדים ב-100% מהסל שלך. על מה תרצי לשמוע עוד?", badge: "המלצות AI" },
  { trigger: ["תודה", "אחלה", "יופי"], response: "בשמחה, שרה! אני כאן בשבילך תמיד. אם תרגישי שאת צריכה לדבר — פשוט כתבי. יום נפלא!" },
  { trigger: ["ארנק", "כסף", "יתרה", "סל"], response: "הנה מצב הארנק שלך:\n\nיתרה: 32 יחידות מתוך 43\nתפוגה: עוד 47 יום\n2 יחידות שמורות להזדקנות מיטבית\n\nממליצה לנצל לפחות 5 יחידות החודש — יש פעילויות מצוינות שמתאימות לך!", badge: "ארנק דיגיטלי" },
];

const INITIAL_MESSAGES: Message[] = [
  { id: 1, text: "שלום שרה, אני לימור, המלווה הדיגיטלית שלך. איך את מרגישה היום?", sender: "ai", time: "09:15", badge: "Limor AI Agent" },
];

function findAIResponse(text: string) {
  const lower = text.toLowerCase();
  for (const r of AI_RESPONSES) {
    if (r.trigger.some(t => lower.includes(t))) return r;
  }
  return { response: "אני כאן בשבילך, שרה. ספרי לי עוד — מה מעסיק אותך היום?", badge: undefined };
}

export default function CitizenChat() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = useCallback(() => {
    if (!input.trim() || isTyping) return;
    const userText = input.trim();
    const userMsg: Message = {
      id: Date.now(),
      text: userText,
      sender: "citizen",
      time: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsTyping(true);

    const aiRes = findAIResponse(userText);
    const aiId = Date.now() + 1;
    const timestamp = new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" });

    // Brief thinking pause, then stream response character by character
    setTimeout(() => {
      setMessages(prev => [...prev, { id: aiId, text: "", sender: "ai", time: timestamp, badge: aiRes.badge }]);
      streamText(aiRes.response, {
        onToken: (token) => {
          setMessages(prev =>
            prev.map(m => m.id === aiId ? { ...m, text: m.text + token } : m)
          );
        },
        onDone: () => setIsTyping(false),
        onError: () => setIsTyping(false),
      });
    }, 500 + Math.random() * 400);
  }, [input, isTyping]);

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <header className="px-5 py-4 border-b border-border bg-gradient-to-l from-[#1B3A5C]/5 to-transparent">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#1B3A5C] to-[#2d5a8c] text-white flex items-center justify-center shadow-sm">
            <Bot className="w-5 h-5" />
          </div>
          <div className="flex-1">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-2">
              לימור
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold">
                <Sparkles className="w-2.5 h-2.5" /> AI Agent
              </span>
            </h2>
            <p className="text-xs text-muted-foreground">מלווה דיגיטלית אישית • Amazon Bedrock</p>
          </div>
          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-50 border border-emerald-200">
            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[10px] text-emerald-700 font-medium">פעילה</span>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-4 bg-gradient-to-b from-background to-muted/20">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "citizen" ? "justify-start" : "justify-end"} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
            <div className="max-w-[85%]">
              {msg.badge && (
                <div className="flex justify-end mb-1">
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#1B3A5C]/10 text-[#1B3A5C] font-medium">{msg.badge}</span>
                </div>
              )}
              <div className={`rounded-2xl px-4 py-3 ${
                msg.sender === "citizen"
                  ? "bg-[#1B3A5C] text-white rounded-br-sm shadow-sm"
                  : "bg-white text-foreground rounded-bl-sm shadow-sm border border-border/50"
              }`}>
                <p className="text-sm whitespace-pre-line leading-relaxed">{msg.text}</p>
                <p className={`text-[10px] mt-1.5 ${msg.sender === "citizen" ? "text-white/50" : "text-muted-foreground"}`}>{msg.time}</p>
              </div>
            </div>
          </div>
        ))}

        {/* Typing indicator */}
        {isTyping && (
          <div className="flex justify-end animate-in fade-in duration-300">
            <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm border border-border/50">
              <div className="flex items-center gap-1.5">
                <div className="w-2 h-2 rounded-full bg-[#1B3A5C]/40 animate-bounce" style={{ animationDelay: "0ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#1B3A5C]/40 animate-bounce" style={{ animationDelay: "150ms" }} />
                <div className="w-2 h-2 rounded-full bg-[#1B3A5C]/40 animate-bounce" style={{ animationDelay: "300ms" }} />
                <span className="text-[10px] text-muted-foreground mr-2">לימור חושבת...</span>
              </div>
            </div>
          </div>
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Quick Actions */}
      <div className="px-5 py-2 border-t border-border/50 bg-card/80 flex gap-2 overflow-x-auto">
        {["מה יש לי בסל?", "אני מרגישה בודדה", "מה הפעילויות השבוע?"].map((q) => (
          <button
            key={q}
            onClick={() => { setInput(q); }}
            className="shrink-0 px-3 py-1.5 rounded-full border border-border text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors"
          >
            {q}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="px-5 py-3 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <button className="w-11 h-11 rounded-xl border border-border flex items-center justify-center text-muted-foreground hover:bg-accent transition-colors" aria-label="הקלטה קולית">
            <Mic className="w-5 h-5" />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="כתבי הודעה ללימור..."
            className="flex-1 h-11 px-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/30"
            dir="rtl"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-xl bg-[#1B3A5C] text-white flex items-center justify-center disabled:opacity-50 hover:bg-[#1B3A5C]/90 transition-colors shadow-sm"
            aria-label="שלח"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
