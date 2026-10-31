/**
 * מבט מטה: מה המדינה מחזיקה ורואה. כל מספר כאן מגיע ממקור אחד: הקטלוג
 * המאושר באטלס, ההגדרות (seed 0.4, תוספת 3, מפגש 2), יומן האירועים, או
 * app-settings.json, ומספר שלא אומת מסומן [לאמת]. בלי תחזיות חיסכון ובלי
 * מגמות בלי נתונים.
 */
import { count } from "@/lib/hebrew";
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BasketBreakdown } from "@/components/shared/BasketBreakdown";
import { Activity, Award, Bot, BookOpen, CheckCircle2, ChevronLeft, ClipboardCheck, ExternalLink, Layers, MapPinned, Scale, Store, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";

// ציר הזמן של התכנית, ומגמות. המגמות הן נתוני הדגמה עד שספק העל מעביר דוח מצטבר.
const TIMELINE_STEPS = [
  { label: "נייר מדיניות", status: "done" },
  { label: "מחקר שטח", status: "done" },
  { label: "מודל הפעלה רב מערכתי", status: "done" },
  { label: "סדנת עיצוב שירות", status: "done" },
  { label: "תכנית האצה", status: "done" },
  { label: "פיתוח מערכת הסל האישי, בתמיכת אמזון", status: "active" },
  { label: "פיילוט שנתיים ותוצאות מחקר חיצוני", status: "done" },
  { label: "ועדה בין משרדית: אישור המודל", status: "pending" },
  { label: "אישור הרחבה ל-10 פיילוטים", status: "pending" },
  { label: "יישום המערכת בשטח: הרחבה והטמעה", status: "pending" },
  { label: "אישור הרחבה מדורגת במסגרת הגמלה", status: "pending" },
  { label: "מכרז אינטגרטור, הרחבה והטמעה ארצית", status: "pending" },
] as const;
const ENGAGEMENT = [{ m: "מאי", v: 42 }, { m: "יוני", v: 48 }, { m: "יולי", v: 52 }, { m: "אוג", v: 55 }, { m: "ספט", v: 56 }, { m: "אוק", v: 58 }];
/** מגמת ההצטרפות כשיעור מהמספר של תרחיש ההדגמה, כדי שהגרף יסתיים באותו מספר שבכותרת. */
const ENROLLMENT_SHARE = [{ m: "מאי", f: 0.42 }, { m: "יוני", f: 0.56 }, { m: "יולי", f: 0.7 }, { m: "אוג", f: 0.84 }, { m: "ספט", f: 0.93 }, { m: "אוק", f: 1 }];
import { catalogState, MATCHING_LAYER_SOURCES } from "@/data/catalogSource";
import { AGREED_DIRECTION_NOTE, DECIDED_PRINCIPLES_MEETING_2, DEMO_JERUSALEM, isAgreedDirection, buildDemoAuthority, isDecided, penetration, ruleKeys, settingLabel, statusNote, timeToFirstService, utilization } from "@sal-ishi/core";
import { communityFor } from "@/lib/community";
import { SUPPLIER_RATING_COMPONENTS } from "@/lib/supplierRating";
import { statusText } from "@/lib/statusText";
import { amount } from "@/lib/wallet";
import { incentivesOn } from "@/lib/incentives";
import { appSettings, shownBackground } from "@/pilot/settings";
import { usePilot } from "@/pilot/store";
import { servicesFor } from "@/pilot/services";
import { CREDIT } from "@/lib/credit";

/** שכונות הפיילוט לפי ההחלטות. הר נוף עוד לא בקטלוג ההדגמה. */
const PILOT_NEIGHBORHOODS = ["פסגת זאב", "תלפיות מזרח", "בית וגן", "רוממה", "בית חנינא"];

/** ערך של כלל שהוכרע, בשפה פשוטה: שקלים לחלוקת הסל, נקודות לארנק, אחוזים. */
function decidedValue(key: string, settings: Record<string, unknown>): string {
  const raw = settings[key];
  const v = raw && typeof raw === "object" && "value" in (raw as object) ? (raw as { value: unknown }).value : raw;
  const pct = (n: number) => `${Math.round(n * 100)}%`;
  switch (key) {
    case "personal_wallet":
      return `${amount(Number(v))} בחודש`;
    case "total":
    case "companion":
    case "community":
    case "overhead":
      return `₪${Number(v).toLocaleString("he-IL")}`;
    case "copay_tiers": {
      const t = raw as { core_and_prevention: number; classes: number; qol: number };
      return `ליבה ומניעה ${pct(t.core_and_prevention)}, חוגים ${pct(t.classes)}, איכות חיים עד ${pct(t.qol)}`;
    }
    case "qol_cap_month":
      return `${amount(Number(v))} בחודש`;
    case "core_floor":
      return `${v} שירותים`;
    case "supplier_contact_to_hq":
      return v ? "למטה בלבד, לא לשום ייצוא" : "לא, רק קוד וסוג";
    default:
      return typeof v === "number" && v > 0 && v < 1 ? pct(v) : String(v);
  }
}

function Card(props: { icon: typeof Store; label: string; value: string | number; sub?: string; to?: string; href?: string }) {
  const body = (
    <>
      <p className="text-sm text-muted-foreground flex items-center gap-1.5">
        <props.icon className="w-4 h-4" aria-hidden="true" /> {props.label}
      </p>
      <p className="text-3xl font-bold text-foreground mt-1">{props.value}</p>
      {props.sub ? <p className="text-sm text-muted-foreground mt-1">{props.sub}</p> : null}
    </>
  );
  if (props.to) return <Link to={props.to} className="libi-card p-5 block hover:border-primary/40">{body}</Link>;
  if (props.href) return <a href={props.href} className="libi-card p-5 block hover:border-primary/40">{body}</a>;
  return <div className="libi-card p-5">{body}</div>;
}

export default function ExecutiveOverview() {
  const { derived } = usePilot();
  const bg = shownBackground();
  const settings = catalogState.seed.settings as unknown as Record<string, unknown>;
  const basket = settings as Record<"total" | "personal_wallet" | "companion" | "community" | "overhead", number>;
  const weights = catalogState.seed.settings.matching_weights as Record<string, number>;
  // מקור אחד לסטטוס הכללים, אותו כמו באטלס המטה (הליבה).
  const rules = ruleKeys(catalogState.seed.settings);
  const decidedRules = rules.filter((k) => isDecided(catalogState.seed.settings, k));
  const decided = decidedRules.length;
  const agreedRules = rules.filter((k) => isAgreedDirection(catalogState.seed.settings, k));
  const proposals = rules.length - decided - agreedRules.length;
  const hoods = useMemo(() => PILOT_NEIGHBORHOODS.map((n) => ({ name: n, c: communityFor(n) })), []);
  const bookings = derived.bookings.filter((b) => b.status !== "cancelled" && b.supplierApproval !== "pending").length;
  const requests = derived.requests.length;
  const incentivePoints = derived.incentives.reduce((n, i) => n + i.points, 0);
  // מספר אחד לתרחיש ההדגמה: סכום מחזיקי הסל בחמש השכונות, מאותם נתונים של טבלת המדדים.
  // נתוני הפיילוט האמיתיים (משתתפים, תוצאות) מוצגים רק כשאביעד מאשר (background.show).
  const participants = useMemo(() => {
    const data = buildDemoAuthority(DEMO_JERUSALEM);
    const month = [...data.enrollment.map((e) => e.month)].sort().at(-1) ?? "";
    return data.enrollment.filter((e) => e.month === month).reduce((n, e) => n + e.enrolled, 0);
  }, []);
  const pctOf = (n: number) => `${Math.round(n * 100)}%`;
  // מדדי השטח: אותן פונקציות של הליבה שהאטלס משתמש בהן, על נתוני ההדגמה של ירושלים.
  const { kpis, kpiMonth } = useMemo(() => {
    const data = buildDemoAuthority(DEMO_JERUSALEM);
    const seed = catalogState.seed;
    const month = [...data.enrollment.map((e) => e.month)].sort().at(-1) ?? "";
    return {
      kpiMonth: month.split("-").reverse().join("/"),
      kpis: data.neighborhoods.map((n) => ({
        name: n.name,
        enrolled: data.enrollment.filter((e) => e.neighborhoodId === n.id && e.month === month)[0]?.enrolled ?? null,
        pen: penetration(n.id, data.enrollment, seed.settings, month),
        util: utilization({ neighborhoodId: n.id, asOfMonth: month, services: data.services, activity: data.activity, enrollment: data.enrollment }, seed),
        first: timeToFirstService(n.id, data.enrollment, seed.settings, month),
      })),
    };
  }, []);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-l from-[#1B3A5C] to-[#2d5a8c] rounded-2xl p-8 text-white">
        <h1 className="text-2xl font-bold">הסל האישי: מבט מטה</h1>
        <p className="text-base text-white/90 mt-2 max-w-3xl">
          המדינה מחזיקה בקטלוג, בכללים ובנתונים. ספק העל מפעיל את הנקודות והתשלומים, והתקן הפתוח מאפשר לכל ספק להתחבר.
        </p>
        <p className="text-sm text-white/80 mt-3">
          פיילוט ירושלים, 5 שכונות · {participants} מחזיקי סל בתרחיש ההדגמה
          <span className="block mt-1">{CREDIT.line}</span>
          {bg ? ` · ${bg.pilot_months} חודשי פיילוט · 2027: ${bg.authorities_2027} רשויות, ${bg.budget_label}` : ""}
        </p>
      </div>

      {/* ציר זמן התכנית */}
      <section className="libi-card p-5" aria-labelledby="timeline-h">
        <h2 id="timeline-h" className="text-base font-semibold text-foreground mb-6">ציר הזמן של התכנית</h2>
        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
          {TIMELINE_STEPS.map((step, i) => (
            <li key={step.label} className={cn("flex items-start gap-3 rounded-xl border p-3", step.status === "active" ? "border-primary bg-primary/5" : "border-border bg-white")}>
              <span className={cn("w-9 h-9 rounded-full flex items-center justify-center text-sm font-bold border-2 shrink-0", step.status === "done" ? "bg-success text-success-foreground border-success" : step.status === "active" ? "bg-primary text-primary-foreground border-primary" : "bg-muted text-muted-foreground border-border")}>
                {step.status === "done" ? <CheckCircle2 className="w-5 h-5" aria-hidden="true" /> : i + 1}
              </span>
              <span>
                <span className="block text-sm font-semibold text-foreground">{i + 1}. {step.label}</span>
                <span className="block text-xs text-muted-foreground">{step.status === "done" ? "בוצע" : step.status === "active" ? "בביצוע עכשיו" : "בהמשך"}</span>
              </span>
            </li>
          ))}
        </ol>
      </section>

      {/* סוכני המערכת */}
      <Link to="/executive/agents" className="libi-card p-5 flex items-center gap-4 hover:border-primary/40">
        <span className="w-12 h-12 rounded-xl bg-primary/10 text-primary flex items-center justify-center shrink-0">
          <Bot className="w-7 h-7" aria-hidden="true" />
        </span>
        <span className="flex-1">
          <span className="block text-base font-semibold text-foreground">סוכני המערכת</span>
          <span className="block text-sm text-muted-foreground">מיפוי שירותים, התאמה, עדכון, מדידה, תמרוץ ומיקוד, ומנהל. מקור ההגדרה של כל אחד, מה רץ בכלי ומה מתוכנן.</span>
        </span>
        <ChevronLeft className="w-5 h-5 text-muted-foreground" aria-hidden="true" />
      </Link>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={Store} label="שירותים מאושרים בקטלוג ירושלים" value={catalogState.services} sub={`${catalogState.neighborhoods} שכונות והערוץ הארצי · ${servicesFor("פסגת זאב").length} מהם זמינים לתושבי פסגת זאב`} href="./hq/" />
        <Card icon={Wallet} label="סל לאזרח בחודש" value={`₪${basket.total}`} sub={`${amount(basket.personal_wallet)} בארנק האישי`} />
        <Card icon={Scale} label="כללים בהגדרות" value={rules.length} sub={`${decided} הוכרעו במפגש 2${agreedRules.length ? ` · ${agreedRules.length} כיוון מוסכם (28.10)` : ""} · ${proposals} הצעה`} />
        <Card icon={ClipboardCheck} label="אירועים מהשטח (הדגמה)" value={bookings + requests} sub={`${count(bookings, "הזמנה אחת", "הזמנות")} · ${count(requests, "בקשה אחת למלווה", "בקשות למלווה")}${incentivePoints ? ` · ${incentivePoints} נקודות תמריץ` : ""}`} />
      </div>

      {/* מגמות */}
      <section className="libi-card p-5" aria-labelledby="trends-h">
        <h2 id="trends-h" className="text-base font-semibold text-foreground">מגמות</h2>
        <p className="text-xs text-muted-foreground mb-4">נתוני הדגמה, עד שספק העל מעביר דוח מצטבר</p>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 [&>div]:overflow-hidden [&>div]:min-w-0">
          <div>
            <p className="text-sm text-foreground mb-2">מעורבות: % מהמשתתפים שפעילים בחודש</p>
            <ResponsiveContainer width="100%" height={150}>
              <LineChart data={ENGAGEMENT}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="m" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} domain={[30, 70]} />
                <Tooltip />
                <Line type="monotone" dataKey="v" stroke="hsl(var(--success))" strokeWidth={2} dot={{ r: 3 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
          <div>
            <p className="text-sm text-foreground mb-2">משתתפים בפיילוט (מצטבר)</p>
            <ResponsiveContainer width="100%" height={150}>
              <BarChart data={ENROLLMENT_SHARE.map((x) => ({ m: x.m, v: Math.round(x.f * participants) }))}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis dataKey="m" tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="v" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      <section className="libi-card p-5" aria-labelledby="hoods-h">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 id="hoods-h" className="text-base font-semibold text-foreground flex items-center gap-2">
            <MapPinned className="w-5 h-5 text-primary" aria-hidden="true" /> השכונות: מה יש ואיפה הפער
          </h2>
          <a href="./hq/" className="min-h-[44px] inline-flex items-center gap-1 text-sm font-semibold text-primary">
            פערים וחלופות באטלס המטה <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="טבלת שכונות">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted-foreground">
                <th scope="col" className="py-2 font-semibold">שכונה</th>
                <th scope="col" className="py-2 font-semibold">שירותים לתושבים</th>
                <th scope="col" className="py-2 font-semibold">בשכונה ובאזור</th>
                <th scope="col" className="py-2 font-semibold">תחומי ליבה ברצפה</th>
                <th scope="col" className="py-2 font-semibold">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {hoods.map(({ name, c }) => {
                const green = c?.categories.filter((x) => x.level === "green").length ?? 0;
                const total = c?.categories.length ?? 0;
                return (
                  <tr key={name} className="border-b border-border/60 last:border-0">
                    <td className="py-2.5 font-semibold text-foreground">{name}</td>
                    <td className="py-2.5 text-foreground">{c?.reachable ?? "-"}</td>
                    <td className="py-2.5 text-foreground">{c?.services ?? "-"}</td>
                    <td className="py-2.5">
                      <span className={cn("inline-flex items-center gap-1 font-semibold", green === total ? "text-success" : "text-destructive")}>
                        {green === total ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> : null}
                        {green} מתוך {total}
                      </span>
                    </td>
                    <td className="py-2.5 text-muted-foreground">{name === "פסגת זאב" ? "פעיל" : "מתוכנן"}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-3">
          לפי ההחלטות: פסגת זאב, תלפיות מזרח, רוממה, הר נוף, בית וגן, ובית חנינא בתגבור (מרץ 2027). הר נוף עוד לא בקטלוג ההדגמה. קטלוג הדגמה, נתונים בדויים.
        </p>
      </section>

      <section className="libi-card p-5" aria-labelledby="kpi-h">
        <h2 id="kpi-h" className="text-base font-semibold text-foreground flex items-center gap-2 mb-1">
          <Activity className="w-5 h-5 text-primary" aria-hidden="true" /> מדדי הפיילוט לפי שכונה
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          מהדיווח המצטבר של השטח, חודש {kpiMonth}. מיצוי מול יעד {pctOf(Number(settings.utilization_target))} ודגל אדום {pctOf(Number(settings.red_flag_avg))} (מפגש 2). אותן פונקציות כמו באטלס המטה.
        </p>
        <div className="overflow-x-auto" tabIndex={0} role="region" aria-label="טבלת מדדי השטח">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border text-right text-muted-foreground">
                <th scope="col" className="py-2 font-semibold">שכונה</th>
                <th scope="col" className="py-2 font-semibold">מחזיקי סל</th>
                <th scope="col" className="py-2 font-semibold">פעילים מתוך הזכאים</th>
                <th scope="col" className="py-2 font-semibold">מיצוי הארנק</th>
                <th scope="col" className="py-2 font-semibold">ימים לשירות ראשון</th>
              </tr>
            </thead>
            <tbody>
              {kpis.map((k) => (
                <tr key={k.name} className="border-b border-border/60 last:border-0">
                  <td className="py-2.5 font-semibold text-foreground">{k.name}</td>
                  <td className="py-2.5 text-foreground">{k.enrolled ?? "-"}</td>
                  <td className="py-2.5 text-foreground">{k.pen.suppressed ? "פחות מ-5" : k.pen.rate === null ? "-" : pctOf(k.pen.rate)}</td>
                  <td className={cn("py-2.5 font-semibold", k.util.flag === "red" ? "text-red-700" : k.util.flag === "below_target" ? "text-amber-800" : k.util.flag === "on_target" ? "text-emerald-800" : "text-muted-foreground")}>
                    {k.util.rate === null ? "-" : pctOf(k.util.rate)}
                    <span className="font-normal text-muted-foreground"> {k.util.flag === "red" ? "· דגל אדום" : k.util.flag === "below_target" ? "· מתחת ליעד" : k.util.flag === "on_target" ? "· ביעד" : ""}</span>
                  </td>
                  <td className={cn("py-2.5", k.first.overMax ? "text-red-700 font-semibold" : "text-foreground")}>{k.first.avgDays === null ? "-" : k.first.avgDays}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-muted-foreground mt-2">נתוני הדגמה בדויים. בפיילוט: מהדוח המצטבר של ספק העל, בלי פירוט לפי אדם, ותא קטן מוסתר.</p>
      </section>

      <section className="libi-card p-5" aria-labelledby="budget-h">
        <h2 id="budget-h" className="text-base font-semibold text-foreground flex items-center gap-2 mb-1">
          <Wallet className="w-5 h-5 text-primary" aria-hidden="true" /> התקציב החודשי של הפיילוט
        </h2>
        <p className="text-sm text-muted-foreground mb-3">
          <span className="font-semibold text-foreground">סימולציה.</span> חישוב: {participants} מחזיקי סל בתרחיש ההדגמה (אותו מספר כמו בטבלת המדדים) כפול חלוקת הסל שהוכרעה במפגש 2. לא תקציב מאושר.
        </p>
        <dl className="grid grid-cols-2 md:grid-cols-5 gap-3">
          {[
            ["סך הכל", participants * basket.total],
            ["ארנקים אישיים", participants * basket.personal_wallet],
            ["ליווי", participants * basket.companion],
            ["קהילה", participants * basket.community],
            ["תפעול", participants * basket.overhead],
          ].map(([label, v]) => (
            <div key={String(label)} className="rounded-lg border border-border p-3">
              <dt className="text-xs text-muted-foreground">{label}</dt>
              <dd className="text-lg font-bold text-foreground">₪{Number(v).toLocaleString("he-IL")}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="libi-card p-5" aria-labelledby="decided-h">
        <h2 id="decided-h" className="text-base font-semibold text-foreground flex items-center gap-2 mb-2">
          <Scale className="w-5 h-5 text-primary" aria-hidden="true" /> מה הוכרע במפגש 2
        </h2>
        {/* הרשימה נגזרת מאותו מקור כמו המונה למעלה: כל כלל שהוכרע, שורה אחת. */}
        <ul className="text-sm text-foreground grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
          {decidedRules.map((k) => (
            <li key={k} className="flex items-start gap-1.5">
              <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" aria-hidden="true" />
              <span>{settingLabel(k)}: {decidedValue(k, catalogState.seed.settings as unknown as Record<string, unknown>)}</span>
            </li>
          ))}
        </ul>
        <h3 className="text-sm font-semibold text-foreground mt-3">ועקרונות שהוכרעו</h3>
        <ul className="text-sm text-foreground grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mt-1">
          {DECIDED_PRINCIPLES_MEETING_2.map((x) => (
            <li key={x} className="flex items-start gap-1.5"><CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" aria-hidden="true" /> {x}</li>
          ))}
        </ul>
        {agreedRules.length ? (
          <>
            <h3 className="text-sm font-semibold text-foreground mt-3">{AGREED_DIRECTION_NOTE}</h3>
            <ul className="text-sm text-foreground grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1 mt-1">
              {agreedRules.map((k) => (
                <li key={k} className="flex items-start gap-1.5">
                  <Activity className="w-4 h-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />
                  <span>{settingLabel(k)}: {decidedValue(k, catalogState.seed.settings as unknown as Record<string, unknown>)}</span>
                </li>
              ))}
            </ul>
          </>
        ) : null}
        <p className="text-xs text-muted-foreground mt-2">{count(decidedRules.length, "כלל אחד הוכרע", "כללים הוכרעו")} במפגש 2. כל שאר הכללים בהגדרות מסומנים כהצעה, גם כאן וגם באטלס המטה.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        <BasketBreakdown headingId="basket-h" />

        <section className="libi-card p-5" aria-labelledby="engine-h">
          <div className="flex items-center justify-between mb-3">
            <h2 id="engine-h" className="text-base font-semibold text-foreground flex items-center gap-2">
              <Layers className="w-5 h-5 text-primary" aria-hidden="true" /> מנוע ההתאמה
            </h2>
            <Link to="/executive/algorithm" className="min-h-[44px] inline-flex items-center text-sm font-semibold text-primary">לפירוט</Link>
          </div>
          <ul className="space-y-1.5 text-sm">
            {MATCHING_LAYER_SOURCES.map((l) => (
              <li key={l.key} className="flex items-center justify-between">
                <span className="text-foreground">{l.label}</span>
                <span className="font-semibold text-foreground">{Math.round((weights[l.key] ?? 0) * 100)}%</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-3">{statusNote(catalogState.seed.settings, "matching_weights")}</p>
          <h3 className="text-sm font-semibold text-foreground mt-4">דירוג ספק: חמישה רכיבים</h3>
          <p className="text-sm text-foreground mt-1">{SUPPLIER_RATING_COMPONENTS.join(" · ")}</p>
          <p className="text-xs text-muted-foreground mt-1">ההרכב והמשקלות ייקבעו בהמשך. מוצג בשוק, ולא משנה את סדר ההתאמה.</p>
        </section>
      </div>

      {appSettings.incentives ? (
        <section className="libi-card p-5" aria-labelledby="inc-h">
          <h2 id="inc-h" className="text-base font-semibold text-foreground flex items-center gap-2 mb-2">
            <Award className="w-5 h-5 text-primary" aria-hidden="true" /> תמריצים לאזרחים: הצעה
          </h2>
          <ul className="text-sm text-foreground grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
            <li>התנדבות: {amount(appSettings.incentives.rates.volunteer_hour)} לשעה</li>
            <li>הדרכת חוג או הרצאה: {amount(appSettings.incentives.rates.teach_session)} למפגש</li>
            <li>התמדה במנוי (לפחות {Math.round(appSettings.incentives.persistence_min_share * 100)}% מהמפגשים): {amount(appSettings.incentives.rates.persistence_month)} לחודש</li>
            <li>עמידה ביעד אישי: {amount(appSettings.incentives.rates.goal)}</li>
          </ul>
          <p className="text-sm text-foreground mt-2">מותאם אישית ולא לכולם: המלווה מסמנת למי זה מתאים ומאשרת כל תמריץ. תקרה של {amount(appSettings.incentives.monthly_cap)} לאזרח בחודש.</p>
          <p className="text-xs text-muted-foreground mt-1">
            מקור המימון פתוח ({(appSettings.incentives.funding_note ?? "תקציב הקהילה או מקור נפרד").replace(/^להכרעה:\s*/, "")}). {incentivesOn() ? "מופעל בהדגמה אצל המלווה ובארנק." : "עד ההכרעה לא מוצג לאזרחים ולמלווה."}
          </p>
        </section>
      ) : null}

      <section className="libi-card p-5" aria-labelledby="hq-h">
        <h2 id="hq-h" className="text-base font-semibold text-foreground flex items-center gap-2 mb-3">
          <BookOpen className="w-5 h-5 text-primary" aria-hidden="true" /> כלי המטה באטלס
        </h2>
        <p className="text-sm text-foreground">
          אותו קטלוג, באטלס המטה: תמונה ארצית, פערים וחלופות, מחירי ייחוס, ספרייה וכללים, ייצוא תקן הקליטה לכל ספק, ופנקס למידה שמייצא רישום דרישות למכרז.
        </p>
        <a href="./hq/" className="mt-3 inline-flex items-center gap-2 min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold">
          לאטלס המטה <ExternalLink className="w-4 h-4" aria-hidden="true" />
        </a>
      </section>
    </div>
  );
}
