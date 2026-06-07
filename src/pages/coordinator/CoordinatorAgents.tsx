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

  const handleRun = (agentId: string) => {
    setRunningAgent(agentId);
    toast.info("מריץ אייג'נט...");
    setTimeout(() => {
      setRunningAgent(null);
      toast.success("הריצה הושלמה בהצלחה");
    }, 3000);
  };

  const selected = AGENTS.find(a => a.id === selectedAgent);

  return (
    <div className="space-y-6" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">ניהול אייג'נטים</h1>
        <p className="text-sm text-gray-500 mt-0.5">5 אייג'נטים פעילים · סריקה אוטומטית · הפעלה ידנית</p>
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
                  <p className="text-[10px] text-gray-400 mt-0.5">{agent.schedule}</p>
                  <div className="flex items-center gap-1.5 mt-2">
                    <div className={cn("w-1.5 h-1.5 rounded-full",
                      agent.status === "active" ? "bg-emerald-500" : agent.status === "error" ? "bg-red-500" : "bg-gray-300"
                    )} />
                    <span className="text-[10px] text-gray-500">
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
              disabled={runningAgent === selected.id}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-colors",
                runningAgent === selected.id
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

          {/* Stats */}
          <div className="grid grid-cols-4 gap-3">
            {selected.stats.map((stat) => (
              <div key={stat.label} className="text-center p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div className="text-lg font-bold text-[#1B3A5C]">{stat.value}</div>
                <div className="text-[10px] text-gray-500 mt-0.5">{stat.label}</div>
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
            <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">אזורי כיסוי</p>
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
