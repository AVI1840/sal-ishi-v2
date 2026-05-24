import { Send } from "lucide-react";
import { useState } from "react";

interface Message {
  id: number;
  text: string;
  sender: "citizen" | "coordinator";
  time: string;
}

const INITIAL_MESSAGES: Message[] = [
  { id: 1, text: "שלום שרה! איך את מרגישה היום?", sender: "coordinator", time: "09:15" },
  { id: 2, text: "בסדר, קצת בודדה. לא יצאתי מהבית כבר כמה ימים", sender: "citizen", time: "09:18" },
  { id: 3, text: "אני שומעת אותך ❤️ יש לנו חוג שירה מחר בבוקר — רוצה שאזמין לך מקום?", sender: "coordinator", time: "09:20" },
  { id: 4, text: "זה נשמע נחמד! כן, בבקשה", sender: "citizen", time: "09:22" },
  { id: 5, text: "מצוין! הזמנתי לך מקום ליום ג׳ ב-10:00 במתנ״ס. אשלח לך תזכורת 🎵", sender: "coordinator", time: "09:23" },
];

export default function CitizenChat() {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim()) return;
    setMessages([...messages, { id: Date.now(), text: input.trim(), sender: "citizen", time: new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit" }) }]);
    setInput("");
  };

  return (
    <div className="flex flex-col h-[calc(100vh-80px)]">
      {/* Header */}
      <header className="px-5 py-4 border-b border-border bg-card">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold">רל</div>
          <div>
            <h2 className="text-sm font-bold text-foreground">רונית לוי</h2>
            <p className="text-xs text-success">מחוברת • המלווה שלך</p>
          </div>
        </div>
      </header>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.map((msg) => (
          <div key={msg.id} className={`flex ${msg.sender === "citizen" ? "justify-start" : "justify-end"}`}>
            <div className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
              msg.sender === "citizen"
                ? "bg-primary text-primary-foreground rounded-br-sm"
                : "bg-muted text-foreground rounded-bl-sm"
            }`}>
              <p className="text-sm">{msg.text}</p>
              <p className={`text-[10px] mt-1 ${msg.sender === "citizen" ? "text-primary-foreground/60" : "text-muted-foreground"}`}>{msg.time}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Input */}
      <div className="px-5 py-3 border-t border-border bg-card">
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="כתבי הודעה..."
            className="flex-1 h-11 px-4 rounded-xl border border-border bg-background text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
            dir="rtl"
          />
          <button
            onClick={handleSend}
            disabled={!input.trim()}
            className="w-11 h-11 rounded-xl bg-primary text-primary-foreground flex items-center justify-center disabled:opacity-50 hover:bg-primary/90 transition-colors"
            aria-label="שלח"
          >
            <Send className="w-5 h-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
