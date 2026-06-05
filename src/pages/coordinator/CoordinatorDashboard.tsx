/**
 * דשבורד מתאמת — מנוע חיזוק חיים
 * KPIs + גרפים + AI Recommendations + Risk + Timeline
 */
import { Users, AlertTriangle, Target, Heart, Sparkles, ChevronLeft, Phone, Home, Activity, Clock, TrendingUp, ArrowUpRight, ArrowDownRight, MessageCircle } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/shared/StatCard";
import { Avatar } from "@/components/shared/Avatar";
import { Chip } from "@/components/shared/Chip";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { CITIZENS, AI_RECOMMENDATIONS, RISK_ALERTS, NUDGES, KPIS } from "@/data/mockData";
import { MOTIVATION_LABELS } from "@/data/types";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// Mock trend data
const ENGAGEMENT_TREND = [
  { week: "שבוע 1", value: 42 }, { week: "שבוע 2", value: 48 },
  { week: "שבוע 3", value: 52 }, { week: "שבוע 4", value: 55 },
  { week: "שבוע 5", value: 53 }, { week: "שבוע 6", value: 58 },
];

const PERSISTENCE_DATA = [
  { name: "מקהלה", value: 82 }, { name: "התעמלות", value: 75 },
  { name: "מועדון", value: 70 }, { name: "בישול", value: 88 },
  { name: "הליכה", value: 78 }, { name: "ציור", value: 80 },
];

const SCHEDULE = [
  { time: "09:00", title: "שיחה עם רבקה לוי", subtitle: "מעקב — 21 יום ללא פעילות", type: "call", tone: "destructive" },
  { time: "10:30", title: "ביקור בית — אהרון מזרחי", subtitle: "הערכה קוגניטיבית + הצעת שירות", type: "visit", tone: "info" },
  { time: "12:00", title: "ליווי קבוצת התעמלות", subtitle: "פסגת זאב — 12 משתתפים", type: "class", tone: "success" },
  { time: "14:00", title: "פגישת צוות", subtitle: "סיכום שבועי + חלוקת משימות", type: "meeting", tone: "primary" },
  { time: "15:30", title: "שיחה עם משה דהן", subtitle: "ירידה בהתמדה — בירור סיבה", type: "followup", tone: "warning" },
];

const ICON_MAP: Record<string, typeof Phone> = { call: Phone, visit: Home, class: Activity, meeting: Users, followup: MessageCircle };

export default function CoordinatorDashboard() {
  const criticalCitizens = CITIZENS.filter((c) => c.riskLevel === "critical" || c.riskLevel === "high").slice(0, 5);
  const unresolvedAlerts = RISK_ALERTS.filter((a) => !a.resolved);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">בוקר טוב, רונית</h1>
          <p className="text-sm text-muted-foreground mt-1">פיילוט ירושלים — 286 אזרחים · {unresolvedAlerts.length} התראות פתוחות · {criticalCitizens.length} בסיכון</p>
        </div>
      </div>

      {/* 5 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {KPIS.map((kpi) => {
          const icons: Record<string, typeof Target> = { Target, Heart, Activity, AlertTriangle, Star: Target };
          const Icon = icons[kpi.icon] || Target;
          return (
            <div key={kpi.id} className="libi-stat-card">
              <div className="flex items-start justify-between mb-3">
                <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center", kpi.tone === "success" ? "bg-success-soft text-success" : kpi.tone === "destructive" ? "bg-destructive-soft text-destructive" : kpi.tone === "warning" ? "bg-warning-soft text-warning-foreground" : "bg-info-soft text-info")}>
                  <Icon className="w-5 h-5" />
                </div>
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">{kpi.value}</div>
              <div className="text-sm text-foreground mt-0.5">{kpi.label}</div>
              <div className="text-xs text-muted-foreground mt-1 flex items-center gap-1">
                {kpi.trend > 0 ? <ArrowUpRight className="w-3 h-3 text-success" /> : <ArrowDownRight className="w-3 h-3 text-success" />}
                <span className="text-success font-medium">{kpi.trendLabel}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Engagement Trend */}
        <div className="libi-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">מגמת מעורבות</h3>
              <p className="text-xs text-muted-foreground mt-0.5">% אזרחים פעילים — 6 שבועות</p>
            </div>
            <TrendingUp className="w-5 h-5 text-success" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={ENGAGEMENT_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 11 }} />
              <YAxis tick={{ fontSize: 11 }} domain={[30, 70]} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        {/* Persistence by Service */}
        <div className="libi-card p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">התמדה לפי שירות</h3>
              <p className="text-xs text-muted-foreground mt-0.5">% משתתפים שממשיכים אחרי חודש</p>
            </div>
            <Target className="w-5 h-5 text-primary" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={PERSISTENCE_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 11 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 11 }} width={60} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* 3-column grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Column 1: Daily Schedule */}
        <div className="libi-card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">לוח זמנים יומי</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{SCHEDULE.length} פריטים היום</p>
            </div>
          </div>
          <div className="space-y-1">
            {SCHEDULE.map((item, i) => {
              const Icon = ICON_MAP[item.type] || Clock;
              return (
                <div key={i} className={cn("flex items-start gap-3 p-3 rounded-lg transition-colors hover:bg-muted/60", item.tone === "destructive" && "bg-destructive-soft/60")}>
                  <div className="text-sm font-semibold text-foreground tabular-nums w-12 shrink-0">{item.time}</div>
                  <div className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", item.tone === "destructive" ? "bg-destructive text-destructive-foreground" : item.tone === "warning" ? "bg-warning text-warning-foreground" : "bg-accent text-primary")}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={cn("text-sm font-medium", item.tone === "destructive" ? "text-destructive" : "text-foreground")}>{item.title}</div>
                    <div className="text-xs text-muted-foreground mt-0.5">{item.subtitle}</div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Column 2: AI Recommendations */}
        <div className="libi-card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">המלצות AI ✨</h3>
              <p className="text-xs text-muted-foreground mt-0.5">{AI_RECOMMENDATIONS.length} פעולות מומלצות</p>
            </div>
            <Sparkles className="w-5 h-5 text-primary" />
          </div>
          <div className="space-y-3">
            {AI_RECOMMENDATIONS.map((rec) => (
              <div key={rec.id} className={cn("p-4 rounded-xl border border-border", rec.urgency === "high" ? "border-r-4 border-r-destructive bg-destructive-soft/20" : rec.urgency === "medium" ? "border-r-4 border-r-warning bg-warning-soft/20" : "bg-muted/20")}>
                <div className="flex items-center gap-2 mb-2">
                  <Chip tone={rec.urgency === "high" ? "destructive" : rec.urgency === "medium" ? "warning" : "info"}>
                    {rec.urgency === "high" ? "דחוף" : rec.urgency === "medium" ? "חשוב" : "מומלץ"}
                  </Chip>
                  <span className="text-xs text-muted-foreground">{rec.confidence}%</span>
                </div>
                <h4 className="text-sm font-bold text-foreground">{rec.title}</h4>
                <p className="text-xs text-muted-foreground mt-1 line-clamp-2">{rec.whyRecommended}</p>
                <div className="flex items-center gap-1 mt-2">
                  {rec.motivationMatch.slice(0, 2).map((m) => (
                    <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-pink-50 text-pink-600">{MOTIVATION_LABELS[m]}</span>
                  ))}
                </div>
                <Link to={`/coordinator/patients/${rec.citizenId}`} className="mt-2 text-xs text-primary font-medium hover:underline block">{rec.nextAction} →</Link>
              </div>
            ))}
          </div>
        </div>

        {/* Column 3: At-Risk Citizens */}
        <div className="libi-card p-5">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h3 className="text-base font-semibold text-foreground">אזרחים בסיכון</h3>
              <p className="text-xs text-muted-foreground mt-0.5">מיון לפי חומרה</p>
            </div>
            <Link to="/coordinator/deterioration" className="text-xs text-primary font-medium hover:underline flex items-center gap-1">
              הכל <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-1">
            {criticalCitizens.map((citizen) => (
              <Link key={citizen.id} to={`/coordinator/patients/${citizen.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/60 transition-colors">
                <Avatar name={citizen.name} size={36} tone={citizen.riskLevel === "critical" ? "warm" : "default"} />
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-foreground truncate">{citizen.name}</div>
                  <div className="text-[11px] text-muted-foreground">{citizen.age} • {citizen.neighborhood}</div>
                </div>
                <div className="text-left shrink-0">
                  <div className={cn("text-sm font-bold tabular-nums", citizen.engagementScore < 20 ? "text-destructive" : citizen.engagementScore < 50 ? "text-warning-foreground" : "text-success")}>
                    {citizen.engagementScore}%
                  </div>
                  <Chip tone={citizen.riskLevel === "critical" ? "destructive" : "warning"} className="mt-0.5">
                    {citizen.riskLevel === "critical" ? "קריטי" : "גבוה"}
                  </Chip>
                </div>
              </Link>
            ))}
          </div>

          {/* Recent Nudges */}
          <div className="mt-5 pt-4 border-t border-border">
            <h4 className="text-xs font-semibold text-muted-foreground mb-2">Nudges אחרונים</h4>
            {NUDGES.slice(0, 3).map((n) => (
              <div key={n.id} className="flex items-start gap-2 py-1.5">
                <span className="text-sm">{n.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] text-foreground line-clamp-1">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground">{n.sentAt}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Agentic Flow — AI Pipeline Visualization */}
      <div className="libi-card p-5">
        <div className="flex items-center gap-2 mb-4">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-[#1B3A5C] to-[#2d5a8c] text-white flex items-center justify-center">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-base font-bold text-foreground">Agentic AI Flow</h3>
            <p className="text-xs text-muted-foreground">שרשרת פעולות אוטומטית — Amazon Bedrock</p>
          </div>
          <span className="mr-auto px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-semibold animate-pulse">LIVE</span>
        </div>

        <div className="relative">
          {/* Flow Steps */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-3">
            {[
              { emoji: "🎙️", title: "תמלול", desc: "Amazon Transcribe", detail: "זיהה: בדידות, כאב ברגל", color: "bg-blue-50 border-blue-200" },
              { emoji: "🧠", title: "ניתוח AI", desc: "Bedrock (Claude)", detail: "מוטיבציה: שייכות | חסם: ניידות", color: "bg-purple-50 border-purple-200" },
              { emoji: "🎯", title: "התאמה", desc: "5 שכבות + persona", detail: "חוג שירה 94% | שחייה 88%", color: "bg-amber-50 border-amber-200" },
              { emoji: "⚡", title: "פעולה", desc: "CRM פרואקטיבי", detail: "נוצרה משימה: להתקשר לרבקה", color: "bg-emerald-50 border-emerald-200" },
              { emoji: "💌", title: "Nudge", desc: "WhatsApp", detail: "״רבקה, מחר חוג שירה ב-10!״", color: "bg-pink-50 border-pink-200" },
            ].map((step, i) => (
              <div key={i} className={`relative rounded-xl border p-3 ${step.color} animate-in fade-in duration-500`} style={{ animationDelay: `${i * 200}ms` }}>
                {i < 4 && <div className="hidden sm:block absolute -left-3 top-1/2 -translate-y-1/2 text-muted-foreground/30 text-lg">→</div>}
                <div className="text-lg mb-1">{step.emoji}</div>
                <div className="text-xs font-bold text-foreground">{step.title}</div>
                <div className="text-[10px] text-muted-foreground">{step.desc}</div>
                <div className="text-[10px] font-medium text-foreground/70 mt-1.5 border-t border-current/10 pt-1">{step.detail}</div>
              </div>
            ))}
          </div>

          {/* Result */}
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-l from-[#1B3A5C]/5 to-transparent border border-[#1B3A5C]/10">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-[#1B3A5C]" />
              <span className="text-xs font-semibold text-[#1B3A5C]">תוצאה:</span>
              <span className="text-xs text-foreground">רבקה לוי (21 יום ללא פעילות) → AI זיהה בדידות → הותאם חוג שירה → נשלח nudge → מחכה לאישור</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
