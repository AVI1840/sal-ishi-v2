/**
 * CoordinatorAgents — מערכת אייג'נטים AI
 * תצוגה מובנית, ברורה ומקצועית של כל האייג'נטים
 * כולל: תפקיד, קלט, פלט, טריגר, כלים, וסימולציית הרצה
 */
import { useState } from "react";
import {
  Bot, Play, CheckCircle, Clock, AlertTriangle, RefreshCw,
  Search, MapPin, Users, Brain, Bell, Loader2, ArrowDown,
  Zap, Database, MessageSquare, Shield, Layers, Target,
  ArrowRight, Workflow, Server
} from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";

// ─── Agent Definitions ───────────────────────────────────────────────

interface AgentTool {
  name: string;
  description: string;
}

interface AgentIO {
  inputs: string[];
  outputs: string[];
}

interface AgentDef {
  id: string;
  name: string;
  nameHe: string;
  role: string;
  description: string;
  model: string;
  schedule: string;
  trigger: string;
  lastRun: string;
  lastResult: string;
  status: "active" | "idle" | "error";
  icon: typeof Bot;
  color: string;
  stats: { label: string; value: string }[];
  tools: AgentTool[];
  io: AgentIO;
  decisionRules: string[];
}

const AGENTS: AgentDef[] = [
  {
    id: "super-agent",
    name: "Super Agent",
    nameHe: "מנהל מערכת",
    role: "Supervisor / Orchestrator — מנתב בקשות לאייג'נט המתאים ומתזמן שרשראות",
    description: "האייג'נט המרכזי שמנהל את כל המערכת. מקבל כל אירוע (הודעת משתמש, טריגר מתוזמן, התראה) ומחליט איזה אייג'נט צריך לטפל. מתאם שרשראות: למשל שירות חדש → חישוב מחדש → nudge לאזרחים מתאימים.",
    model: "Claude 3.5 Sonnet",
    schedule: "24/7 — event-driven",
    trigger: "כל אירוע במערכת (הודעה, scheduling, alert)",
    lastRun: "05.06.26, 08:05",
    lastResult: "כל 4 אייג'נטים פעילים · ללא תקלות · זמן ריצה ממוצע: 2.3s",
    status: "active",
    icon: Bot,
    color: "#1B3A5C",
    stats: [
      { label: "אייג'נטים מנוהלים", value: "4/4" },
      { label: "תקלות היום", value: "0" },
      { label: "ריצות היום", value: "8" },
      { label: "זמן תגובה ממוצע", value: "2.3s" },
    ],
    tools: [
      { name: "route_to_limor", description: "ניתוב שיחה לאייג'נט לימור" },
      { name: "route_to_matching", description: "הפעלת חישוב התאמות" },
      { name: "route_to_monitor", description: "סריקת הידרדרות" },
      { name: "route_to_nudge", description: "שליחת חיזוק מותאם" },
      { name: "route_to_discovery", description: "סריקת שירותים חדשים" },
      { name: "escalate", description: "העברה לגורם אנושי" },
    ],
    io: {
      inputs: ["הודעות משתמשים", "אירועי EventBridge", "התראות מאייג'נטים אחרים"],
      outputs: ["החלטות ניתוב", "שרשראות פעולה", "דוח סטטוס יומי"],
    },
    decisionRules: [
      "הודעת אזרח → Limor Agent",
      "אינטייק חדש → Matching Engine → Nudge",
      "שירות חדש בקטלוג → Matching → Nudge למתאימים",
      "RDI > 1.3 → Monitor → CRM alert → Nudge reactivation",
    ],
  },
  {
    id: "service-discovery",
    name: "Service Discovery Agent",
    nameHe: "גילוי שירותים",
    role: "סורק מקורות חיצוניים, מזהה שירותים חדשים, מעשיר קטלוג",
    description: "סריקה שבועית אוטומטית של 25+ מקורות מידע (עיריית ירושלים, מנהל קהילתי, ג'וינט, מתנ\"סים, עמותות). מזהה שירותים חדשים לאזרחים ותיקים 65+, מעשיר מטא-דאטה (מימדים, שפות, נגישות), מוסיף לקטלוג.",
    model: "Claude 3.5 Sonnet",
    schedule: "כל יום ראשון, 06:00",
    trigger: "EventBridge weekly + ידני",
    lastRun: "01.06.26, 06:00",
    lastResult: "סרק 22 מקורות · 0 שירותים חדשים · 3 עדכונים · 0 התראות",
    status: "active",
    icon: Search,
    color: "#3b82f6",
    stats: [
      { label: "מקורות נסרקים", value: "25" },
      { label: "שירותים בקטלוג", value: "102" },
      { label: "חדשים החודש", value: "4" },
      { label: "עדכונים אחרונים", value: "3" },
    ],
    tools: [
      { name: "web_search", description: "חיפוש אתרי עיריה, מתנ\"סים, עמותות" },
      { name: "parse_page", description: "ניתוח דף אינטרנט וחילוץ מידע שירות" },
      { name: "validate_service", description: "אימות תקינות ורלוונטיות" },
      { name: "add_to_catalog", description: "הוספה/עדכון בקטלוג DynamoDB" },
      { name: "enrich_dimensions", description: "חישוב 5 מימדי התאמה" },
    ],
    io: {
      inputs: ["25 מקורות מידע (URLs)", "קטלוג קיים לזיהוי כפילויות", "כללי רלוונטיות (65+, ירושלים)"],
      outputs: ["שירותים חדשים מועשרים", "עדכוני שירותים קיימים", "התראה ל-Super Agent (trigger Matching)"],
    },
    decisionRules: [
      "שירות חדש 65+ + ירושלים → הוסף לקטלוג",
      "שירות קיים עם שינוי פרטים → עדכן",
      "שירות שנסגר → סמן inactive",
      "לאחר הוספה → trigger Matching Engine",
    ],
  },
  {
    id: "matching-engine",
    name: "Matching Engine Agent",
    nameHe: "מנוע התאמה",
    role: "מחשב ציוני התאמה 286×102 לפי 5 שכבות — ומייצר המלצות אישיות",
    description: "האלגוריתם המרכזי של סל אישי. לכל אזרח מחשב ציון התאמה לכל שירות בקטלוג לפי 5 שכבות: מניעת הידרדרות (30%), מוטיבציות אישיות (25%), פרופיל (20%), הוכחה חברתית (15%), קרבה גיאוגרפית (10%). מייצר רשימת Top-5 המלצות מנומקות.",
    model: "Claude 3.5 Haiku (מהיר)",
    schedule: "אחרי אינטייק חדש + שבועי (ראשון 07:00)",
    trigger: "EventBridge weekly + post-intake event",
    lastRun: "01.06.26, 07:15",
    lastResult: "חישוב ל-286 אזרחים × 102 שירותים = 29,172 ציונים · 18 המלצות חדשות",
    status: "active",
    icon: Brain,
    color: "#8b5cf6",
    stats: [
      { label: "אזרחים מחושבים", value: "286" },
      { label: "שירותים בקטלוג", value: "102" },
      { label: "ציונים מחושבים", value: "29,172" },
      { label: "המלצות חדשות", value: "18" },
    ],
    tools: [
      { name: "get_all_citizens", description: "טעינת כל פרופילי האזרחים" },
      { name: "get_catalog", description: "טעינת קטלוג שירותים + מימדים" },
      { name: "compute_score", description: "חישוב 5 שכבות לזוג אזרח-שירות" },
      { name: "update_recommendations", description: "עדכון Top-5 לכל אזרח" },
      { name: "explain_match", description: "ייצור הסבר טקסטואלי להמלצה" },
    ],
    io: {
      inputs: ["286 פרופילי אזרחים (מוטיבציות, ניידות, שפה, מגזר)", "102 שירותים + מימדים", "משקלות שכבות (קונפיגורציה)"],
      outputs: ["29,172 ציוני התאמה", "Top-5 המלצות לכל אזרח", "הסברי התאמה (explainability)", "trigger ל-Nudge Agent"],
    },
    decisionRules: [
      "ציון > 80 → המלצה חזקה (מוצג ראשון)",
      "ציון 60-80 → המלצה בינונית",
      "ציון < 60 → לא מוצג",
      "שינוי ב-Top-3 → trigger Nudge Agent",
      "אזרח ללא התאמה > 60 → התראה למלווה",
    ],
  },
  {
    id: "deterioration-monitor",
    name: "Deterioration Monitor Agent",
    nameHe: "ניטור הידרדרות",
    role: "מזהה סימני ירידה מוקדמים ומתריע למלווה לפני שמאוחר מדי",
    description: "סורק כל יום את דפוסי הפעילות של 286 אזרחים. מזהה חריגות: שתיקה ממושכת, ביטולי שירותים, ירידת מצב רוח (מניתוח שיחות), ירידת SDI. מחשב RDI (Risk of Deterioration Index) ומייצר התראות CRM דחופות למלווה.",
    model: "Claude 3.5 Haiku (מהיר)",
    schedule: "יומי, 07:30",
    trigger: "EventBridge daily + real-time emergency",
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
    tools: [
      { name: "get_activity_log", description: "שליפת לוג פעילות אזרח (30 יום)" },
      { name: "compute_rdi", description: "חישוב Risk of Deterioration Index" },
      { name: "compute_sdi", description: "חישוב Service Diversity Index" },
      { name: "create_crm_action", description: "יצירת משימה דחופה למלווה" },
      { name: "flag_emergency", description: "העלאת דגל חירום (16 מילות מפתח)" },
    ],
    io: {
      inputs: ["לוגי פעילות (הזמנות, ביטולים, שיחות)", "היסטוריית SDI/RDI", "ניתוח רגשי משיחות עם לימור"],
      outputs: ["ציוני RDI מעודכנים", "התראות CRM (קריטי/אזהרה/מידע)", "משימות למלווה", "trigger ל-Nudge Agent (reactivation)"],
    },
    decisionRules: [
      "RDI > 1.3 → התראה קריטית למלווה",
      "RDI 1.0-1.3 → אזהרה",
      "7 ימים ללא פעילות → סימון שתיקה",
      "2+ ביטולים ברצף → חשד ירידה",
      "מילות חירום (נפילה, כאב חזה) → flag_emergency מיידי",
    ],
  },
  {
    id: "nudge-engine",
    name: "Nudge & Engagement Agent",
    nameHe: "חיזוקים ומעורבות",
    role: "שולח הודעות מותאמות אישית שמעודדות אזרחים להשתמש בשירותים",
    description: "מייצר ושולח חיזוקים מותאמים — תזכורות לפעילות מחר, חגיגת milestones (\"10 פעילויות החודש!\"), reactivation לאזרחים שנעלמו, והודעות חברתיות (\"חברתך מרים תהיה שם\"). מבוסס על פרסונה, מוטיבציות, ושלב מוכנות.",
    model: "Claude 3.5 Haiku (מהיר)",
    schedule: "יומי, 08:00 + event-driven",
    trigger: "EventBridge daily + post-Matching + post-Monitor",
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
    tools: [
      { name: "get_citizen_persona", description: "שליפת פרסונה ומוטיבציות" },
      { name: "get_schedule", description: "לוח שירותים מחר/השבוע" },
      { name: "send_sms", description: "שליחת SMS מותאם" },
      { name: "send_whatsapp", description: "שליחת WhatsApp מותאם" },
      { name: "log_nudge", description: "רישום הודעה ותוצאה" },
    ],
    io: {
      inputs: ["פרסונות ומוטיבציות", "לוח שירותים מתוכנן", "trigger מ-Matching (המלצה חדשה)", "trigger מ-Monitor (reactivation)"],
      outputs: ["הודעות SMS/WhatsApp מותאמות", "לוג nudges (לניתוח אפקטיביות)", "מדדי engagement"],
    },
    decisionRules: [
      "שירות מחר + אזרח רשום → תזכורת עם הוכחה חברתית",
      "10/20/50 פעילויות → הודעת milestone",
      "7+ ימים ללא פעילות + RDI > 1.0 → reactivation",
      "המלצה חדשה ב-Top-3 → הצעה מותאמת",
      "לא יותר מ-2 הודעות ביום לאזרח",
    ],
  },
];

const AGENT_RUN_CONFIG: Record<string, { stages: string[]; result: string }> = {
  "super-agent": {
    stages: ["בודק סטטוס 4 אייג'נטים...", "מתזמן משימות יומיות...", "מזהה תלויות בין-אייג'נטים...", "מייצר דוח מצב"],
    result: "כל 4 האייג'נטים פעילים · 0 תקלות · זמן ריצה ממוצע: 2.1s"
  },
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
};

// ─── Sub-components ──────────────────────────────────────────────────

function StatusBadge({ status }: { status: "active" | "idle" | "error" }) {
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-full",
      status === "active" ? "bg-emerald-50 text-emerald-700 border border-emerald-200" :
      status === "error" ? "bg-red-50 text-red-700 border border-red-200" :
      "bg-gray-50 text-gray-500 border border-gray-200"
    )}>
      <div className={cn("w-1.5 h-1.5 rounded-full",
        status === "active" ? "bg-emerald-500 animate-pulse" :
        status === "error" ? "bg-red-500" : "bg-gray-400"
      )} />
      {status === "active" ? "פעיל" : status === "error" ? "שגיאה" : "לא פעיל"}
    </span>
  );
}

function ToolChip({ tool }: { tool: AgentTool }) {
  return (
    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-100 hover:border-gray-200 transition-colors">
      <Zap className="w-3 h-3 text-amber-500 shrink-0" />
      <div className="min-w-0">
        <span className="text-xs font-mono font-medium text-gray-800">{tool.name}</span>
        <p className="text-[10px] text-gray-500 truncate">{tool.description}</p>
      </div>
    </div>
  );
}

function IOSection({ io }: { io: AgentIO }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
          <ArrowRight className="w-3 h-3 text-blue-500" /> קלט (Input)
        </h4>
        <ul className="space-y-1.5">
          {io.inputs.map((input, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
              <Database className="w-3 h-3 text-blue-400 mt-0.5 shrink-0" />
              {input}
            </li>
          ))}
        </ul>
      </div>
      <div className="space-y-2">
        <h4 className="text-xs font-semibold text-gray-700 flex items-center gap-1.5 uppercase tracking-wider">
          <ArrowDown className="w-3 h-3 text-emerald-500" /> פלט (Output)
        </h4>
        <ul className="space-y-1.5">
          {io.outputs.map((output, i) => (
            <li key={i} className="flex items-start gap-2 text-xs text-gray-600">
              <Target className="w-3 h-3 text-emerald-400 mt-0.5 shrink-0" />
              {output}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

// ─── Main Component ──────────────────────────────────────────────────

export default function CoordinatorAgents() {
  const [runningAgent, setRunningAgent] = useState<string | null>(null);
  const [selectedAgent, setSelectedAgent] = useState<string | null>(AGENTS[0].id);
  const [runStage, setRunStage] = useState(0);
  const [runResult, setRunResult] = useState<{ agentId: string; text: string } | null>(null);

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
    setTimeout(() => setRunResult(null), 15000);
  };

  const selected = AGENTS.find(a => a.id === selectedAgent);

  return (
    <div className="space-y-6" dir="rtl">

      {/* Header Banner */}
      <div className="bg-gradient-to-l from-[#1B3A5C] to-[#2d5a8c] rounded-2xl p-8 text-white">
        <div className="flex items-center gap-4 mb-4">
          <div className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center">
            <Workflow className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold">מערכת Multi-Agent · סל אישי</h1>
            <p className="text-sm text-white/60 mt-0.5">Amazon Bedrock AgentCore · Strands Agents SDK · Claude 3.5</p>
          </div>
        </div>
        <p className="text-sm text-white/80 leading-relaxed max-w-3xl">
          5 אייג'נטים אוטונומיים שפועלים 24/7 — סורקים שירותים, מחשבים התאמות, מזהים הידרדרות, ושולחים חיזוקים מותאמים.
          כל אייג'נט מתמחה בתפקיד אחד. ה-Super Agent מתזמן ומתאם ביניהם.
        </p>
        {/* Architecture summary stats */}
        <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
            <div className="text-xl font-bold">5</div>
            <div className="text-[11px] text-white/40">אייג'נטים</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">24/7</div>
            <div className="text-[11px] text-white/40">זמינות</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">29K+</div>
            <div className="text-[11px] text-white/40">ציונים/שבוע</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">286</div>
            <div className="text-[11px] text-white/40">אזרחים מנוטרים</div>
          </div>
          <div className="text-center">
            <div className="text-xl font-bold">~$10</div>
            <div className="text-[11px] text-white/40">עלות יומית</div>
          </div>
        </div>
      </div>

      {/* Flow Diagram - simplified */}
      <div className="bg-white border border-gray-100 rounded-xl p-5">
        <h3 className="text-sm font-semibold text-gray-700 mb-4 flex items-center gap-2">
          <Layers className="w-4 h-4 text-gray-400" /> זרימת עבודה בין האייג'נטים
        </h3>
        <div className="flex items-center justify-between gap-2 overflow-x-auto pb-2">
          {[
            { label: "גילוי שירותים", color: "#3b82f6", icon: Search },
            { label: "מנוע התאמה", color: "#8b5cf6", icon: Brain },
            { label: "ניטור הידרדרות", color: "#ef4444", icon: AlertTriangle },
            { label: "חיזוקים", color: "#f59e0b", icon: Bell },
          ].map((item, i) => {
            const Icon = item.icon;
            return (
              <div key={i} className="flex items-center gap-2">
                <div className="flex flex-col items-center gap-1.5 min-w-[100px]">
                  <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: item.color }} />
                  </div>
                  <span className="text-[10px] text-gray-600 font-medium text-center">{item.label}</span>
                </div>
                {i < 3 && <ArrowRight className="w-4 h-4 text-gray-300 shrink-0" />}
              </div>
            );
          })}
        </div>
        <div className="flex items-center justify-center gap-2 mt-3 pt-3 border-t border-gray-100">
          <Bot className="w-4 h-4 text-[#1B3A5C]" />
          <span className="text-xs text-gray-500">Super Agent מתזמן ומנהל את כל השרשרת</span>
        </div>
      </div>

      {/* Agent Selection Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-3">
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
                isSelected ? "border-[#1B3A5C] bg-[#1B3A5C]/[0.03] shadow-sm ring-1 ring-[#1B3A5C]/20" : "border-gray-100 bg-white hover:border-gray-300"
              )}
            >
              <div className="flex flex-col items-center text-center gap-2">
                <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${agent.color}15` }}>
                  {isRunning ? (
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: agent.color }} />
                  ) : (
                    <Icon className="w-5 h-5" style={{ color: agent.color }} />
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-gray-900">{agent.nameHe}</h3>
                  <p className="text-[10px] text-gray-400 mt-0.5">{agent.name}</p>
                </div>
                <StatusBadge status={agent.status} />
              </div>
            </button>
          );
        })}
      </div>

      {/* Selected Agent Detail Panel */}
      {selected && (
        <div className="bg-white border border-gray-100 rounded-2xl overflow-hidden shadow-sm">
          {/* Agent header */}
          <div className="p-6 border-b border-gray-100">
            <div className="flex items-start justify-between">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${selected.color}15` }}>
                  {(() => { const Icon = selected.icon; return <Icon className="w-6 h-6" style={{ color: selected.color }} />; })()}
                </div>
                <div>
                  <div className="flex items-center gap-3">
                    <h2 className="text-lg font-bold text-gray-900">{selected.nameHe}</h2>
                    <span className="text-xs font-mono text-gray-400 bg-gray-50 px-2 py-0.5 rounded">{selected.name}</span>
                    <StatusBadge status={selected.status} />
                  </div>
                  <p className="text-sm text-gray-600 mt-1 font-medium">{selected.role}</p>
                  <div className="flex items-center gap-4 mt-2 text-xs text-gray-400">
                    <span className="flex items-center gap-1"><Server className="w-3 h-3" /> {selected.model}</span>
                    <span className="flex items-center gap-1"><Clock className="w-3 h-3" /> {selected.schedule}</span>
                    <span className="flex items-center gap-1"><Zap className="w-3 h-3" /> {selected.trigger}</span>
                  </div>
                </div>
              </div>
              <button
                onClick={() => handleRun(selected.id)}
                disabled={!!runningAgent}
                className={cn(
                  "flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold transition-all",
                  runningAgent
                    ? "bg-gray-100 text-gray-400 cursor-wait"
                    : "bg-[#1B3A5C] text-white hover:bg-[#15304d] shadow-md hover:shadow-lg"
                )}
              >
                {runningAgent === selected.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin" /> רץ...</>
                ) : (
                  <><Play className="w-4 h-4" /> הפעל ידנית</>
                )}
              </button>
            </div>
          </div>

          {/* Run progress */}
          {runningAgent === selected.id && (
            <div className="mx-6 mt-4 p-4 rounded-xl border border-[#1B3A5C]/20 bg-[#1B3A5C]/[0.02] space-y-3 animate-fade-in">
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
            <div className="mx-6 mt-4 p-4 rounded-xl border border-emerald-200 bg-emerald-50 flex items-start gap-3 animate-fade-in">
              <CheckCircle className="w-5 h-5 text-emerald-600 mt-0.5 shrink-0" />
              <div>
                <p className="text-sm font-semibold text-emerald-800">הריצה הושלמה בהצלחה</p>
                <p className="text-xs text-emerald-700 mt-1">{runResult.text}</p>
              </div>
            </div>
          )}

          {/* Content sections */}
          <div className="p-6 space-y-6">

            {/* Description */}
            <div className="bg-gray-50 rounded-xl p-4 border border-gray-100">
              <p className="text-sm text-gray-700 leading-relaxed">{selected.description}</p>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {selected.stats.map((stat) => (
                <div key={stat.label} className="text-center p-4 bg-white rounded-xl border border-gray-100 shadow-sm">
                  <div className="text-xl font-bold text-[#1B3A5C]">{stat.value}</div>
                  <div className="text-xs text-gray-500 mt-1">{stat.label}</div>
                </div>
              ))}
            </div>

            {/* I/O Section */}
            <div className="bg-white rounded-xl p-5 border border-gray-100">
              <h3 className="text-sm font-semibold text-gray-800 mb-4 flex items-center gap-2">
                <Workflow className="w-4 h-4 text-gray-400" /> קלט ופלט
              </h3>
              <IOSection io={selected.io} />
            </div>

            {/* Tools */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Zap className="w-4 h-4 text-amber-500" /> כלים (Tools) — {selected.tools.length}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                {selected.tools.map((tool) => (
                  <ToolChip key={tool.name} tool={tool} />
                ))}
              </div>
            </div>

            {/* Decision Rules */}
            <div>
              <h3 className="text-sm font-semibold text-gray-800 mb-3 flex items-center gap-2">
                <Shield className="w-4 h-4 text-purple-500" /> כללי החלטה
              </h3>
              <div className="space-y-2">
                {selected.decisionRules.map((rule, i) => (
                  <div key={i} className="flex items-start gap-2 text-xs text-gray-700 p-2.5 rounded-lg bg-purple-50/50 border border-purple-100/50">
                    <span className="font-bold text-purple-600 shrink-0 mt-0.5">R{i + 1}</span>
                    <span>{rule}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Last run info */}
            <div className="flex items-start gap-3 p-4 bg-gray-50 rounded-xl border border-gray-100">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div>
                <p className="text-xs font-medium text-gray-700">ריצה אחרונה: {selected.lastRun}</p>
                <p className="text-xs text-gray-500 mt-0.5">{selected.lastResult}</p>
              </div>
            </div>

          </div>
        </div>
      )}

      {/* Tech Stack footer */}
      <div className="bg-gray-50 border border-gray-100 rounded-xl p-5">
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">תשתית טכנולוגית</h3>
        <div className="flex flex-wrap gap-2">
          {[
            "Amazon Bedrock AgentCore",
            "Strands Agents SDK",
            "Claude 3.5 Sonnet",
            "Claude 3.5 Haiku",
            "DynamoDB",
            "OpenSearch (RAG)",
            "EventBridge",
            "API Gateway (SSE)",
            "Bedrock Guardrails",
            "CloudWatch",
          ].map((tech) => (
            <span key={tech} className="text-[11px] px-2.5 py-1 rounded-md bg-white border border-gray-200 text-gray-600 font-medium">
              {tech}
            </span>
          ))}
        </div>
      </div>
    </div>
  );
}
