/**
 * CoordinatorAgents — ניהול אייג'נטים
 * מציג את כל האייג'נטים הפעילים, סטטוס, הפעלה ידנית
 */
import { useState } from "react";
import { Bot, Play, CheckCircle, Clock, AlertTriangle, RefreshCw, Search, MapPin, Users, Brain, Bell, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

interface AgentDef {
  id: string;
  name: string;
  description: string;
  schedule: string;
  lastRun: string;
  lastResult: string;
  status: "active" | "idle" | "error";
  icon: typeof Bot;
  color: string;
  stats: { label: string; value: string }[];
  zones: string[];
}

const AGENTS: AgentDef[] = [
  {
    id: "service-discovery",
    name: "Service Discovery Agent",
    description: "סריקה שבועית לגילוי שירותים חדשים לאזרחים ותיקים 65+ בירושלים. סורק 25+ מקורות, מוסיף לקטלוג, מדרג לפי 5 יעדי הפיילוט.",
    schedule: "כל יום ראשון, 06:00",
    lastRun: "01.06.26, 06:00",
    lastResult: "סרק 22 מקורות · 0 שירותים חדשים · 3 עדכונים · 0 התראות",
    status: "active",
    icon: Search,
    color: "#3b82f6",
    stats: [
      { label: "מקורות", value: "25" },
      { label: "שירותים בDB", value: "102" },
      { label: "סריקות השבוע", value: "1" },
      { label: "שירותים חדשים (חודש)", value: "4" },
    ],
    zones: ["פסגת זאב", "תלפיות מזרח", "בית חנינא", "נווה יעקב", "עין כרם"],
  },
  {
    id: "matching-engine",
    name: "Matching Engine Agent",
    description: "מעדכן ציוני התאמה לכל אזרח — 5 שכבות (מניעה 40%, מוטיבציות 25%, פרופיל 20%, קרבה 10%, הוכחה חברתית 5%). רץ אחרי כל אינטייק חדש ואחת לשבוע לכל האזרחים.",
    schedule: "אחרי אינטייק + שבועי (ראשון 07:00)",
    lastRun: "01.06.26, 07:15",
    lastResult: "חישוב ל-286 אזרחים × 102 שירותים = 29,172 ציונים · 18 המלצות חדשות",
    status: "active",
    icon: Brain,
    color: "#8b5cf6",
    stats: [
      { label: "אזרחים", value: "286" },
      { label: "שירותים", value: "102" },
      { label: "ציונים מחושבים", value: "29,172" },
      { label: "המלצות חדשות", value: "18" },
    ],
    zones: ["כלל הפיילוט"],
  },
  {
    id: "deterioration-monitor",
    name: "Deterioration Monitor Agent",
    description: "מנטר סימני הידרדרות — ירידה בפעילות, ביטולים, ירידת מצב רוח, בדידות. מתריע למלווה בזמן אמת.",
    schedule: "יומי, 07:30",
    lastRun: "05.06.26, 07:30",
    lastResult: "סרק 286 פרופילים · 4 התראות (2 קריטי, 2 אזהרה) · 12 ירידת מעורבות",
    status: "active",
    icon: AlertTriangle,
    color: "#ef4444",
    stats: [
      { label: "אזרחים בניטור", value: "286" },
      { label: "התראות פתוחות", value: "4" },
      { label: "קריטי", value: "2" },
      { label: "ירידת מעורבות", value: "12" },
    ],
    zones: ["כלל הפיילוט"],
  },
  {
    id: "nudge-engine",
    name: "Nudge & Engagement Agent",
    description: "שולח חיזוקים, תזכורות והודעות מותאמות אישית לאזרחים — מבוסס על מוטיבציות, שלב מוכנות, ו-engagement score.",
    schedule: "יומי, 08:00 + event-driven",
    lastRun: "05.06.26, 08:00",
    lastResult: "שלח 12 nudges · 3 milestone · 2 reactivation · 7 reminders",
    status: "active",
    icon: Bell,
    color: "#f59e0b",
    stats: [
      { label: "נשלחו היום", value: "12" },
      { label: "שיעור פתיחה", value: "72%" },
      { label: "reactivation", value: "2" },
      { label: "milestones", value: "3" },
    ],
    zones: ["כלל הפיילוט"],
  },
  {
    id: "super-agent",
    name: "Super Agent — מנהל אייג'נטים",
    description: "מתזמן ומנהל את כל האייג'נטים. מוודא שכולם רצו בזמן, מזהה תקלות, ומתאם בין אייג'נטים (למשל: שירות חדש → matching חדש → nudge לאזרחים מתאימים).",
    schedule: "24/7 — event-driven",
    lastRun: "05.06.26, 08:05",
    lastResult: "כל 4 אייג'נטים פעילים · ללא תקלות · זמן ריצה ממוצע: 2.3 שניות",
    status: "active",
    icon: Bot,
    color: "#1B3A5C",
    stats: [
      { label: "אייג'נטים פעילים", value: "4/4" },
      { label: "תקלות היום", value: "0" },
      { label: "ריצות היום", value: "8" },
      { label: "זמן ממוצע", value: "2.3s" },
    ],
    zones: ["מערכתי"],
  },
];

export default function CoordinatorAgents() {
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(AGENTS[0].id);
  const [runStage, setRunStage] = useState(0);
  const [runResult, setRunResult] = useState<{ agentId: string; text: string } | null>(null);

  const AGENT_RUN_CONFIG: Record<string, { stages: string[]; result: string }> = {
    "service-discovery": {
      stages: ["מתחבר ל-25 מקורות...", "סורק עיריית ירושלים, מנהל קהילתי, ג'וינט...", "מנתח שירותים חדשים...", "מעדכן קטלוג"],
      result: "נמצאו 2 שירותים חדשים · עודכנו 5 פרטי שירות · 0 שירותים הוסרו"
    },
    "matching-engine": {
      stages: ["טוען 286 פרופילים...", "מחשב 286 × 102 = 29,172 ציונים...", "מדרג לפי 5 שכבות...", "מעדכן המלצות אישיות"],
      result: "עודכנו 29,172 ציוני התאמה · 14 המלצות חדשות · 3 אזרחים עם שינוי Top-3"
    },
    "deterioration-monitor": {
      stages: ["בודק דפוסי פעילות 286 אזרחים...", "מזהה חריגות (שתיקה, ביטולים, ירידת SDI)...", "מחשב RDI מעודכן...", "מייצר התראות CRM"],
      result: "4 אזרחים עם עליית RDI > 1.3 · נוצרו 4 פעולות CRM דחופות"
    },
    "nudge-engine": {
      stages: ["בודק לוח שירותים מחר...", "מתאים הודעות לפי פרסונה ומוטיבציות...", "מייצר חיזוקים מותאמים...", "שולח ב-SMS / WhatsApp"],
      result: "נשלחו 12 חיזוקים מותאמים · 3 milestones · 2 reactivation · 7 תזכורות"
    },
    "super-agent": {
      stages: ["בודק סטטוס 4 אייג'נטים...", "מתזמן משימות יומיות...", "מזהה תלויות בין-אייג'נטים...", "מייצר דוח מצב"],
      result: "כל 4 האייג'נטים פעילים · 0 תקלות · זמן ריצה ממוצע: 2.1s"
    },
  };

  const handleRun = async (agentId: string) => {
    if (runningAgent) return;
    const config = AGENT_RUN_CONFIG[agentId];
    if (!config) return;

    setRunningAgent(agentId);
    setRunResult(null);
    setRunStage(0);

    for (let i = 0; i < config.stages.length; i++) {
      setRunStage(i);
      await new Promise(r => setTimeout(r, 1200 + Math.random() * 600));
    }

    setRunningAgent(null);
    setRunResult({ agentId, text: config.result });
    toast.success(config.result, { duration: 6000 });

    // Clear result after 15 seconds
    setTimeout(() => setRunResult(null), 15000);
  };

  const selected = AGENTS.find(a => a.id === selectedAgent);

  return (
    <div className="space-y-6" dir="rtl">

      {/* Header */}
      <div className="bg-[#1B3A5C] rounded-xl p-6 text-white">
        <div className="flex items-center gap-3 mb-3">
          <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h1 className="text-lg font-bold">מערכת אייג'נטים אוטונומיים</h1>
            <p className="text-xs text-white/50">5 אייג'נטים · Amazon Bedrock · פעילים 24/7</p>
          </div>
        </div>
        <p className="text-sm text-white/70 leading-relaxed">
          מערכת AI שסורקת, מתאימה, מנטרת ומתקשרת — ללא התערבות ידנית. 
          כל אייג'נט מתמחה בתפקיד ספציפי וה-Super Agent מתזמן ביניהם.
        </p>
        <div className="grid grid-cols-4 gap-3 mt-4 pt-4 border-t border-white/10 text-center">
          <div><div className="text-lg font-bold">5</div><div className="text-xs text-white/40">אייג'נטים</div></div>
          <div><div className="text-lg font-bold">24/7</div><div className="text-xs text-white/40">פעילות</div></div>
          <div><div className="text-lg font-bold">29K</div><div className="text-xs text-white/40">ציונים/שבוע</div></div>
          <div><div className="text-lg font-bold">רץ יציב</div><div className="text-xs text-white/40">לאורך הפיילוט</div></div>
        </div>
      </div>

      {/* Agent cards grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
        {AGENTS.map((agent) => {
          const Icon = agent.icon;
          const isRunning = runningAgent === agent.id;
          const isSelected = selectedAgent === agent.id;
          return (
            <button
              key={agent.id}
              onClick={() => setSelectedAgent(agent.id)}
              className={cn(
                "text-right p-4 rounded-xl border transition-all",
                isSelected ? "border-[#1B3A5C] bg-[#1B3A5C]/[0.02] shadow-sm" : "border-gray-100 bg-white hover:border-gray-300"
              )}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${agent.color}15` }}>
                  {isRunning ? (
                    <Loader2 className="w-4 h-4 animate-spin" style={{ color: agent.color }} />
                  ) : (
                    <Icon className="w-4 h-4" style={{ color: agent.color }} />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="text-sm font-semibold text-gray-900 line-clamp-1">{agent.name}</h3>
                  <p className="text-xs text-gray-400 mt-0.5">{agent.schedule}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full",
                      agent.status === "active" ? "bg-emerald-500" : agent.status === "error" ? "bg-red-500" : "bg-gray-300"
                    )} />
                    <span className="text-xs text-gray-500">
                      {agent.status === "active" ? "פעיל" : agent.status === "error" ? "שגיאה" : "לא פעיל"}
                    </span>
                  </div>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected agent detail */}
      {selected && (
        <div className="bg-white border border-gray-100 rounded-xl p-6 space-y-5">
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="w-11 h-11 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${selected.color}15` }}>
                {(() => { const Icon = selected.icon; return <Icon className="w-5 h-5" style={{ color: selected.color }} />; })()}
              </div>
              <div>
                <h2 className="text-base font-bold text-gray-900">{selected.name}</h2>
                <p className="text-xs text-gray-500 mt-1 max-w-xl">{selected.description}</p>
              </div>
            </div>
            <button
              onClick={() => handleRun(selected.id)}
              disabled={!!runningAgent}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                runningAgent
                  ? "bg-gray-100 text-gray-400 cursor-wait"
                  : "bg-[#1B3A5C] text-white hover:bg-[#15304d]"
              )}
            >
              {runningAgent === selected.id ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> רץ...</>
              ) : (
                <><Play className="w-4 h-4" /> הפעל ידנית</>
              )}
            </button>
          </div>

          {/* Run progress */}
          {runningAgent === selected.id && (
            <div className="p-4 rounded-xl border border-[#1B3A5C]/20 bg-[#1B3A5C]/[0.02] space-y-3 animate-fade-in">
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold text-[#1B3A5C]">שלב {runStage + 1} מתוך {AGENT_RUN_CONFIG[selected.id].stages.length}</span>
                <Loader2 className="w-4 h-4 animate-spin text-[#1B3A5C]" />
              </div>
              <p className="text-sm text-gray-700 font-medium">{AGENT_RUN_CONFIG[selected.id].stages[runStage]}</p>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className="h-full bg-[#1B3A5C] rounded-full transition-all duration-500 ease-out"
                  style={{ width: `${((runStage + 1) / AGENT_RUN_CONFIG[selected.id].stages.length) * 100}%` }}
                />
              </div>
            </div>
          )}

          {/* Run result */}
          {runResult && runResult.agentId === selected.id && !runningAgent && (
            <div className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-start gap-3 animate-fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">הריצה הושלמה בהצלחה</p>
                <p className="text-xs text-emerald-700 mt-1">{runResult.text}</p>
              </div>
            </div>
          )}

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {selected.stats.map((stat) => (
              <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-lg font-bold text-[#1B3A5C]">{stat.value}</div>
                <div className="text-xs text-gray-500 mt-0.5">{stat.label}</div>
              </div>
            ))}
          </div>

          {/* Last run */}
          <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-lg border border-gray-100">
            <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-medium text-gray-700">ריצה אחרונה: {selected.lastRun}</p>
              <p className="text-xs text-gray-500 mt-0.5">{selected.lastResult}</p>
            </div>
          </div>

          {/* Zones */}
          <div>
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">אזורי כיסוי</p>
            <div className="flex gap-2 flex-wrap">
              {selected.zones.map((zone) => (
                <span key={zone} className="flex items-center gap-1 text-xs px-2.5 py-1 rounded-md bg-[#1B3A5C]/5 text-[#1B3A5C] border border-[#1B3A5C]/10">
                  <MapPin className="w-3 h-3" /> {zone}
                </span>
              ))}
            </div>
          </div>

          {/* Schedule */}
          <div className="flex items-center gap-2 text-xs text-gray-500 pt-3 border-t border-gray-100">
            <RefreshCw className="w-3.5 h-3.5" />
            <span>לוח זמנים: {selected.schedule}</span>
          </div>
        </div>
      )}
    </div>
  );
}
