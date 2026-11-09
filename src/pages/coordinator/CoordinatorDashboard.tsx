/**
 * בית המלווה: מה התפקיד היום, מי דורש פנייה, ומה יעזור לה לעשות את זה.
 * מחזיר את מה שעבד בגרסה הקודמת (כרטיסי מדדים, לוח זמנים יומי, המלצות לפעולה
 * עם הסבר אנושי, אזרחים בסיכון, תזכורות, מגמות) ומחבר אותו לתיק האמיתי של
 * הפיילוט (buildCaseload) ולמיון "לפנות היום" לפי הכללים. מספרים מהתיק; מה
 * שעוד אין לו מקור מסומן "הדגמה".
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import {
  Activity, AlertTriangle, BellRing, CalendarCheck, ChevronLeft, Clock, HeartHandshake, Home, Inbox, MapPinned,
  MessageCircle, Phone, Sparkles, Target, TrendingUp, Users,
} from "lucide-react";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/shared/Avatar";
import { Chip } from "@/components/shared/Chip";
import { BasketBreakdown } from "@/components/shared/BasketBreakdown";
import { TodayTriage } from "@/components/companion/TodayTriage";
import { NewInCaseload } from "@/components/companion/NewInCaseload";
import { CaseloadPulse, RecentInCaseload } from "@/components/companion/CaseloadPulse";
import { AI_RECOMMENDATIONS, NUDGES } from "@/data/mockData";
import { MOTIVATION_LABELS } from "@/data/types";
import { buildCaseload, RULE_LABEL, triage, type TriageItem } from "@/pilot/caseload";
import { appSettings } from "@/pilot/settings";
import { usePilot } from "@/pilot/store";
import { catalogState } from "@/data/catalogSource";
import { communityFor } from "@/lib/community";
import { COMPANION_NEIGHBORHOOD } from "./CoordinatorCommunity";

const greeting = () => {
  const h = new Date().getHours();
  return h < 12 ? "בוקר טוב" : h < 17 ? "צהריים טובים" : "ערב טוב";
};

// מגמות: עד שספק העל מעביר נוכחות חודשית, נתוני הדגמה.
const ENGAGEMENT_TREND = [
  { week: "שבוע 1", value: 42 }, { week: "שבוע 2", value: 48 }, { week: "שבוע 3", value: 52 },
  { week: "שבוע 4", value: 55 }, { week: "שבוע 5", value: 53 }, { week: "שבוע 6", value: 58 },
];
const PERSISTENCE_DATA = [
  { name: "מקהלה", value: 82 }, { name: "התעמלות", value: 75 }, { name: "מועדון", value: 70 },
  { name: "בישול", value: 88 }, { name: "הליכה", value: 78 }, { name: "יצירה", value: 80 },
];

/** לוח הזמנים של היום: נגזר מהמיון. דחוף בבוקר, השבוע אחר הצהריים. */
function scheduleFrom(items: TriageItem[]) {
  const times = ["09:00", "09:45", "10:30", "11:30", "13:00", "14:00", "15:00"];
  const ACTION: Record<string, { label: string; icon: typeof Phone }> = {
    hospitalization: { label: "שיחה עם המשפחה ועדכון הספקים", icon: Phone },
    callback: { label: "לחזור בטלפון", icon: Phone },
    gated_request: { label: "להחליט על בקשה", icon: Inbox },
    claim_task: { label: "עזרה בהגשה למממן אחר", icon: Inbox },
    cognitive_alert: { label: "ביקור בית והצעה לאימון קוגניטיבי", icon: Home },
    no_first_service: { label: "שיחה קצרה והצעה לשיעור ניסיון", icon: MessageCircle },
    low_utilization: { label: "לבדוק מה לא עובד", icon: MessageCircle },
  };
  return items
    .filter((i) => i.reasons.length && i.bucket !== "watch")
    .slice(0, times.length)
    .map((i, n) => ({ time: times[n]!, item: i, ...(ACTION[i.reasons[0]!.rule] ?? ACTION.low_utilization!) }));
}

export default function CoordinatorDashboard() {
  const { derived } = usePilot();
  const people = useMemo(() => buildCaseload(), []);
  const items = useMemo(() => triage(people, derived), [people, derived]);
  const today = items.filter((i) => i.bucket === "today");
  const week = items.filter((i) => i.bucket === "week");
  const open = derived.requests.filter((r) => r.status === "open").length;
  const community = useMemo(() => communityFor(COMPANION_NEIGHBORHOOD), []);
  const settings = catalogState.seed.settings;
  const red = settings.red_flag_avg ?? 0.35;
  const target = settings.utilization_target ?? 0.7;
  const started = people.filter((p) => p.firstServiceDone);
  const avgUse = started.length ? started.reduce((s, p) => s + p.utilization, 0) / started.length : 0;
  const active = people.filter((p) => p.utilization >= red).length;
  const notStarted = people.filter((p) => !p.firstServiceDone).length;
  const schedule = scheduleFrom(items);
  const atRisk = [...today, ...week].slice(0, 6);
  const pct = (n: number) => `${Math.round(n * 100)}%`;

  const kpis = [
    { icon: Users, label: "אזרחים בתיק", value: String(people.length), note: `${COMPANION_NEIGHBORHOOD} ושכונות סמוכות`, to: "/coordinator/patients", tone: "info" },
    { icon: Target, label: "מיצוי ממוצע ברבעון", value: pct(avgUse), note: `יעד ${pct(target)}, דגל מתחת ל-${pct(red)}`, tone: avgUse >= target ? "success" : "warning" },
    { icon: Activity, label: "פעילים", value: `${active}`, note: `${pct(active / Math.max(1, people.length))} מהתיק`, tone: "success" },
    { icon: AlertTriangle, label: "לפנות היום", value: String(today.length), note: `ועוד ${week.length} השבוע`, to: "/coordinator/patients", tone: "destructive" },
    { icon: Inbox, label: "בקשות פתוחות", value: String(open), note: `${notStarted} עוד לא התחילו שירות`, tone: "warning" },
  ] as const;

  return (
    <div className="space-y-6">
      {/* מי אני היום ומה המשימה */}
      <div className="libi-card p-5 bg-gradient-to-l from-primary/5 to-transparent">
        <h1 className="text-2xl font-bold text-foreground">
          {greeting()}, {appSettings.companion.name}
        </h1>
        <p className="text-base text-foreground mt-1">
          המשימה שלך: שכל אחד מ-{people.length} האנשים בתיק ימצא משהו שמחזיק אותו בחיים, ושאף אחד לא ייפול בין הכיסאות.
        </p>
        <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1.5">
          <HeartHandshake className="w-4 h-4" aria-hidden="true" /> היום: {today.length} פניות דחופות, {schedule.length} פריטים ביומן, {open} בקשות שמחכות לך.
        </p>
      </div>

      {/* כרטיסי מדדים */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
        {kpis.map((k) => {
          const body = (
            <>
              <div className={cn("w-10 h-10 rounded-lg flex items-center justify-center mb-3", k.tone === "success" ? "bg-success-soft text-success" : k.tone === "destructive" ? "bg-destructive-soft text-destructive" : k.tone === "warning" ? "bg-warning-soft text-warning-foreground" : "bg-info-soft text-info")}>
                <k.icon className="w-5 h-5" aria-hidden="true" />
              </div>
              <div className="text-2xl font-bold text-foreground tracking-tight">{k.value}</div>
              <div className="text-sm text-foreground mt-0.5">{k.label}</div>
              <div className="text-xs text-muted-foreground mt-1">{k.note}</div>
            </>
          );
          return "to" in k ? (
            <Link key={k.label} to={k.to} className="libi-stat-card block hover:border-primary/40">{body}</Link>
          ) : (
            <div key={k.label} className="libi-stat-card">{body}</div>
          );
        })}
      </div>

      {/* מה חדש בתיק, ומי לפנות היום */}
      <NewInCaseload />
      <TodayTriage />

      {/* יומן, המלצות לפעולה, בסיכון */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <section className="libi-card p-5" aria-labelledby="sched-h">
          <h2 id="sched-h" className="text-base font-semibold text-foreground flex items-center gap-2">
            <CalendarCheck className="w-5 h-5 text-primary" aria-hidden="true" /> לוח זמנים יומי
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">{schedule.length} פריטים, לפי סדר הדחיפות</p>
          <ol className="space-y-1">
            {schedule.map(({ time, item, label, icon: Icon }) => (
              <li key={item.person.id}>
                <Link to={`/coordinator/patients/${item.person.id}`} className={cn("flex items-start gap-3 p-3 rounded-lg hover:bg-muted/60", item.bucket === "today" && "bg-destructive-soft/50")}>
                  <span className="text-sm font-semibold text-foreground tabular-nums w-12 shrink-0">{time}</span>
                  <span className={cn("w-8 h-8 rounded-lg flex items-center justify-center shrink-0", item.bucket === "today" ? "bg-destructive text-destructive-foreground" : "bg-accent text-primary")}>
                    <Icon className="w-4 h-4" aria-hidden="true" />
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-foreground">
                      {label}: {item.person.name}
                    </span>
                    <span className="block text-xs text-muted-foreground mt-0.5">{item.reasons[0]!.text}</span>
                  </span>
                </Link>
              </li>
            ))}
          </ol>
        </section>

        <section className="libi-card p-5" aria-labelledby="recs-h">
          <h2 id="recs-h" className="text-base font-semibold text-foreground flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" /> המלצות לפעולה
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">מה מתאים לכל אחד, ולמה, במילים שלו</p>
          <ul className="space-y-3">
            {AI_RECOMMENDATIONS.map((rec) => (
              <li key={rec.id} className={cn("p-4 rounded-xl border border-border", rec.urgency === "high" ? "border-r-4 border-r-destructive bg-destructive-soft/20" : rec.urgency === "medium" ? "border-r-4 border-r-warning bg-warning-soft/20" : "bg-muted/20")}>
                <div className="flex items-center gap-2 mb-1.5">
                  <Chip tone={rec.urgency === "high" ? "destructive" : rec.urgency === "medium" ? "warning" : "info"}>
                    {rec.urgency === "high" ? "דחוף" : rec.urgency === "medium" ? "חשוב" : "מומלץ"}
                  </Chip>
                  <span className="text-xs font-semibold text-foreground">{rec.citizenName}</span>
                </div>
                <h3 className="text-sm font-bold text-foreground">{rec.title}</h3>
                <p className="text-sm text-muted-foreground mt-1">{rec.whyRecommended}</p>
                <div className="flex items-center gap-1 mt-2 flex-wrap">
                  {rec.motivationMatch.slice(0, 2).map((m) => (
                    <span key={m} className="text-xs px-1.5 py-0.5 rounded bg-pink-50 text-pink-800">{MOTIVATION_LABELS[m]}</span>
                  ))}
                </div>
                <Link to={`/coordinator/patients/${rec.citizenId}`} className="mt-2 min-h-[36px] inline-flex items-center text-sm text-primary font-semibold hover:underline">
                  {rec.nextAction} <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>

        <section className="libi-card p-5" aria-labelledby="risk-h">
          <div className="flex items-start justify-between">
            <h2 id="risk-h" className="text-base font-semibold text-foreground flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" aria-hidden="true" /> אזרחים בסיכון
            </h2>
            <Link to="/coordinator/patients" className="min-h-[36px] text-sm text-primary font-semibold inline-flex items-center gap-0.5">
              הכל <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5 mb-3">לפי הכללים, הדחוף קודם</p>
          <ul className="space-y-1">
            {atRisk.map((i) => (
              <li key={i.person.id}>
                <Link to={`/coordinator/patients/${i.person.id}`} className="flex items-center gap-3 p-2.5 rounded-lg hover:bg-muted/60">
                  <Avatar name={i.person.name} size={36} tone={i.bucket === "today" ? "warm" : "default"} />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm font-medium text-foreground truncate">{i.person.name}</span>
                    <span className="block text-xs text-muted-foreground">
                      {i.person.age} · {RULE_LABEL[i.reasons[0]!.rule]}
                    </span>
                  </span>
                  <Chip tone={i.bucket === "today" ? "destructive" : "warning"}>{i.bucket === "today" ? "היום" : "השבוע"}</Chip>
                </Link>
              </li>
            ))}
          </ul>

          <div className="mt-5 pt-4 border-t border-border">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <BellRing className="w-4 h-4 text-primary" aria-hidden="true" /> תזכורות ומסרים אחרונים
            </h3>
            <ul>
              {NUDGES.slice(0, 3).map((n) => (
                <li key={n.id} className="flex items-start gap-2 py-1.5">
                  <Clock className="w-4 h-4 text-muted-foreground mt-0.5 shrink-0" aria-hidden="true" />
                  <span className="flex-1 min-w-0">
                    <span className="block text-sm text-foreground">{n.message}</span>
                    <span className="block text-xs text-muted-foreground">{n.sentAt}</span>
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </section>
      </div>

      {/* מגמות */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="libi-card p-5" aria-labelledby="trend-h">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="trend-h" className="text-base font-semibold text-foreground">מגמת מעורבות</h2>
              <p className="text-xs text-muted-foreground mt-0.5">% מהתיק שהשתתפו השבוע · נתוני הדגמה</p>
            </div>
            <TrendingUp className="w-5 h-5 text-success" aria-hidden="true" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <LineChart data={ENGAGEMENT_TREND}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="week" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} domain={[30, 70]} />
              <Tooltip />
              <Line type="monotone" dataKey="value" stroke="hsl(var(--primary))" strokeWidth={2.5} dot={{ r: 4 }} />
            </LineChart>
          </ResponsiveContainer>
        </section>
        <section className="libi-card p-5" aria-labelledby="persist-h">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 id="persist-h" className="text-base font-semibold text-foreground">התמדה לפי שירות</h2>
              <p className="text-xs text-muted-foreground mt-0.5">% שממשיכים אחרי חודש · נתוני הדגמה</p>
            </div>
            <Target className="w-5 h-5 text-primary" aria-hidden="true" />
          </div>
          <ResponsiveContainer width="100%" height={180}>
            <BarChart data={PERSISTENCE_DATA} layout="vertical">
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12 }} />
              <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={60} />
              <Tooltip />
              <Bar dataKey="value" fill="hsl(var(--primary))" radius={[0, 4, 4, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </section>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <CaseloadPulse />
        <RecentInCaseload />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <section className="libi-card p-5" aria-labelledby="comm-h">
          <div className="flex items-center justify-between mb-3">
            <h2 id="comm-h" className="text-base font-semibold text-foreground flex items-center gap-2">
              <MapPinned className="w-5 h-5 text-primary" aria-hidden="true" /> הקהילה שלי
            </h2>
            <Link to="/coordinator/community" className="min-h-[44px] inline-flex items-center gap-0.5 text-sm font-semibold text-primary">
              לכל השכונה <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          <p className="text-base text-foreground">
            {community?.services ?? 0} שירותים מאושרים ב{COMPANION_NEIGHBORHOOD}, ועוד {(community?.reachable ?? 0) - (community?.services ?? 0)} ארציים ומרחוק.
          </p>
          <ul className="mt-3 space-y-1.5">
            {community?.categories.map((c) => (
              <li key={c.id} className="flex items-center justify-between text-sm">
                <span className="text-foreground">{c.name}</span>
                <span className={cn("font-medium", c.level === "green" ? "text-success" : "text-warning-foreground")}>
                  {c.count} נספרים ברצפה{c.level !== "green" ? ", חסר" : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
        <BasketBreakdown headingId="basket-h" />
      </div>
    </div>
  );
}
