import { Building2, Users, Heart, TrendingUp, TrendingDown, Star, ArrowUpRight, CheckCircle2, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";
import { StatCard } from "@/components/shared/StatCard";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Chip } from "@/components/shared/Chip";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

const TIMELINE_STEPS = [
  { label: "נייר מדיניות", status: "done" },
  { label: "מחקר", status: "done" },
  { label: "סדנה", status: "done" },
  { label: "אפיון", status: "active" },
  { label: "פיילוט", status: "active" },
  { label: "לוח ח-2", status: "pending" },
  { label: "קול קורא", status: "pending" },
  { label: "הרחבה", status: "pending" },
  { label: "הטמעה", status: "pending" },
];

const SITES = [
  { name: "פסגת זאב", citizens: 286, coordinators: 3, providers: 18, utilization: 67, prevention: 41, budget: "₪980K", status: "פעיל" },
  { name: "תלפיות מזרח", citizens: 0, coordinators: 0, providers: 0, utilization: 0, prevention: 0, budget: "—", status: "מתוכנן" },
  { name: "בית חנינא", citizens: 0, coordinators: 0, providers: 0, utilization: 0, prevention: 0, budget: "—", status: "מתוכנן" },
  { name: "נווה יעקב", citizens: 0, coordinators: 0, providers: 0, utilization: 0, prevention: 0, budget: "—", status: "מתוכנן" },
  { name: "עין כרם", citizens: 0, coordinators: 0, providers: 0, utilization: 0, prevention: 0, budget: "—", status: "מתוכנן" },
];

const PILOTS = [
  { name: "ירושלים", status: "active", citizens: 736, x: 65, y: 45 },
  { name: "תל אביב", status: "planned", citizens: 0, x: 40, y: 40 },
  { name: "חיפה", status: "planned", citizens: 0, x: 45, y: 20 },
  { name: "באר שבע", status: "future", citizens: 0, x: 50, y: 70 },
  { name: "נצרת", status: "future", citizens: 0, x: 50, y: 25 },
];

export default function ExecutiveOverview() {
  return (
    <div className="space-y-6">
      {/* Hero Banner */}
      <div className="bg-gradient-to-l from-[#1B3A5C] to-[#2d5a8c] rounded-2xl p-8 text-white">
        <h1 className="text-2xl font-bold">רפורמת סל אישי — מבט על</h1>
        <p className="text-sm text-white/70 mt-1">שלב 1: פיילוט ירושלים</p>
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-white/80">התקדמות כללית</span>
            <span className="text-sm font-bold">65%</span>
          </div>
          <div className="h-3 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-amber-400 rounded-full" style={{ width: "65%" }} />
          </div>
        </div>
      </div>

      {/* 6 KPI Cards */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        <StatCard icon={Building2} label="רשויות פעילות" value="1/5" sub="ירושלים" tone="primary" />
        <StatCard icon={Users} label="אזרחים בפיילוט" value={286} sub="פסגת זאב" tone="success" />
        <StatCard icon={Heart} label="מתאמות שירות" value={3} sub="פסגת זאב" tone="info" />
        <StatCard icon={TrendingUp} label="מימוש זכויות" value="67%" sub="יעד: 75%" tone="success" />
        <StatCard icon={TrendingDown} label="דחיית הידרדרות" value="20%" sub="~3 חודשים" tone="success" />
        <StatCard icon={Star} label="חיסכון פוטנציאלי" value="₪2B" sub="בהרחבה לאומית" tone="warning" />
      </div>

      {/* Timeline */}
      <div className="libi-card p-5">
        <h3 className="text-base font-semibold text-foreground mb-6">ציר זמן הרפורמה</h3>
        <div className="flex items-center justify-between relative">
          {/* Connection line */}
          <div className="absolute top-4 right-4 left-4 h-0.5 bg-gradient-to-l from-success via-primary to-muted" />
          {TIMELINE_STEPS.map((step, i) => (
            <div key={i} className="flex flex-col items-center relative z-10">
              <div className={cn(
                "w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2",
                step.status === "done" ? "bg-success text-success-foreground border-success" :
                step.status === "active" ? "bg-primary text-primary-foreground border-primary animate-pulse" :
                "bg-muted text-muted-foreground border-border"
              )}>
                {step.status === "done" ? <CheckCircle2 className="w-4 h-4" /> : i + 1}
              </div>
              <span className="text-[10px] text-muted-foreground mt-2 text-center max-w-[60px]">{step.label}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Map + Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Map */}
        <div className="libi-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">מפת פיילוטים</h3>
          <div className="relative bg-muted/30 rounded-xl h-64 border border-border/50">
            {PILOTS.map((pilot) => (
              <div
                key={pilot.name}
                className="absolute flex flex-col items-center group"
                style={{ top: `${pilot.y}%`, right: `${pilot.x}%`, transform: "translate(50%, -50%)" }}
              >
                <div className={cn(
                  "w-4 h-4 rounded-full border-2 border-white shadow-sm",
                  pilot.status === "active" ? "bg-success" : pilot.status === "planned" ? "bg-warning" : "bg-muted-foreground/30"
                )} />
                <span className="text-[10px] font-medium text-foreground mt-1 opacity-0 group-hover:opacity-100 transition-opacity bg-card px-1 rounded shadow-sm">
                  {pilot.name} {pilot.citizens > 0 && `(${pilot.citizens})`}
                </span>
              </div>
            ))}
            <div className="absolute bottom-3 right-3 flex items-center gap-3 text-[10px]">
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-success" /> פעיל</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-warning" /> מתוכנן</span>
              <span className="flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full bg-muted-foreground/30" /> בתכנון</span>
            </div>
          </div>
        </div>

        {/* Mini KPI charts with Recharts */}
        <div className="libi-card p-5">
          <h3 className="text-base font-semibold text-foreground mb-4">מגמות</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <p className="text-xs text-muted-foreground mb-2">מגמת מעורבות (6 חודשים)</p>
              <ResponsiveContainer width="100%" height={120}>
                <LineChart data={[{m:"אוק",v:42},{m:"נוב",v:48},{m:"דצמ",v:52},{m:"ינו",v:55},{m:"פבר",v:56},{m:"מרץ",v:58}]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="m" tick={{fontSize:10}} />
                  <YAxis tick={{fontSize:10}} domain={[30,70]} />
                  <Line type="monotone" dataKey="v" stroke="hsl(var(--success))" strokeWidth={2} dot={{r:3}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
            <div>
              <p className="text-xs text-muted-foreground mb-2">רישום אזרחים (מצטבר)</p>
              <ResponsiveContainer width="100%" height={120}>
                <BarChart data={[{m:"אוק",v:120},{m:"נוב",v:280},{m:"דצמ",v:420},{m:"ינו",v:550},{m:"פבר",v:650},{m:"מרץ",v:736}]}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="m" tick={{fontSize:10}} />
                  <YAxis tick={{fontSize:10}} />
                  <Bar dataKey="v" fill="hsl(var(--primary))" radius={[4,4,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Sites Table */}
      <div className="libi-card overflow-hidden">
        <div className="p-5 border-b border-border">
          <h3 className="text-base font-semibold text-foreground">טבלת אתרים</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">שם אתר</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">אזרחים</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">מתאמות</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">ספקים</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">ניצול</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">מניעה %</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">תקציב</th>
                <th className="text-right px-4 py-3 font-medium text-muted-foreground">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {SITES.map((site) => (
                <tr key={site.name} className="border-b border-border/50 hover:bg-muted/30">
                  <td className="px-4 py-3 font-medium flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-muted-foreground" /> ירושלים — {site.name}
                  </td>
                  <td className="px-4 py-3">{site.citizens || "—"}</td>
                  <td className="px-4 py-3">{site.coordinators || "—"}</td>
                  <td className="px-4 py-3">{site.providers || "—"}</td>
                  <td className="px-4 py-3">{site.utilization ? `${site.utilization}%` : "—"}</td>
                  <td className="px-4 py-3">{site.prevention ? `${site.prevention}%` : "—"}</td>
                  <td className="px-4 py-3">{site.budget}</td>
                  <td className="px-4 py-3">
                    <Chip tone={site.status === "פעיל" ? "success" : "muted"}>{site.status}</Chip>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Control Panel */}
      <div className="libi-card p-5 border-destructive/30 bg-destructive-soft/20">
        <h3 className="text-base font-semibold text-foreground mb-4 flex items-center gap-2">
          🛑 בקרה ועצירה (חירום)
        </h3>
        <div className="flex flex-wrap gap-3">
          {["עצירת אתר", "החלפת מפעיל", "הקפאת תקציב", "גריעת ספק", "עצירת שירות"].map((action) => (
            <button
              key={action}
              className="h-10 px-4 rounded-xl border border-destructive/30 text-destructive text-xs font-medium hover:bg-destructive hover:text-destructive-foreground transition-colors"
            >
              {action}
            </button>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-3">כל פעולה דורשת 2 אישורים נוספים</p>
      </div>
    </div>
  );
}
