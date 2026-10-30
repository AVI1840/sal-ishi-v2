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
import { BookOpen, CheckCircle2, ClipboardCheck, ExternalLink, Layers, MapPinned, Scale, Store, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { catalogState, MATCHING_LAYER_SOURCES } from "@/data/catalogSource";
import { DECIDED_PRINCIPLES_MEETING_2, isDecided, ruleKeys, statusNote } from "@sal-ishi/core";
import { communityFor } from "@/lib/community";
import { SUPPLIER_RATING_COMPONENTS } from "@/lib/supplierRating";
import { statusText } from "@/lib/statusText";
import { amount } from "@/lib/wallet";
import { appSettings } from "@/pilot/settings";
import { usePilot } from "@/pilot/store";

/** שכונות הפיילוט לפי ההחלטות. הר נוף עוד לא בקטלוג ההדגמה. */
const PILOT_NEIGHBORHOODS = ["פסגת זאב", "תלפיות מזרח", "בית וגן", "רוממה", "בית חנינא"];

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
  const settings = catalogState.seed.settings as unknown as Record<string, unknown>;
  const basket = settings as Record<"total" | "personal_wallet" | "companion" | "community" | "overhead", number>;
  const weights = catalogState.seed.settings.matching_weights as Record<string, number>;
  // מקור אחד לסטטוס הכללים, אותו כמו באטלס המטה (הליבה).
  const rules = ruleKeys(catalogState.seed.settings);
  const decided = rules.filter((k) => isDecided(catalogState.seed.settings, k)).length;
  const proposals = rules.length - decided;
  const hoods = useMemo(() => PILOT_NEIGHBORHOODS.map((n) => ({ name: n, c: communityFor(n) })), []);
  const bookings = derived.bookings.filter((b) => b.status !== "cancelled").length;
  const requests = derived.requests.length;
  const incentivePoints = derived.incentives.reduce((n, i) => n + i.points, 0);

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-l from-[#1B3A5C] to-[#2d5a8c] rounded-2xl p-8 text-white">
        <h1 className="text-2xl font-bold">הסל האישי: מבט מטה</h1>
        <p className="text-base text-white/90 mt-2 max-w-3xl">
          המדינה מחזיקה בקטלוג, בכללים ובנתונים. ספק העל מפעיל את הנקודות והתשלומים, והתקן הפתוח מאפשר לכל ספק להתחבר.
        </p>
        <p className="text-sm text-white/80 mt-3">
          פיילוט ירושלים · {appSettings.program.pilot_participants} משתתפים
          {appSettings.background ? ` · ${appSettings.background.pilot_months} חודשי פיילוט · 2027: ${appSettings.background.authorities_2027} רשויות, ${appSettings.background.budget_label}` : ""}
        </p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card icon={Store} label="שירותים מאושרים בקטלוג" value={catalogState.services} sub={`${catalogState.neighborhoods} שכונות באטלס`} href="./hq/" />
        <Card icon={Wallet} label="סל לאזרח בחודש" value={`₪${basket.total}`} sub={`${amount(basket.personal_wallet)} בארנק האישי`} />
        <Card icon={Scale} label="כללים בהגדרות" value={rules.length} sub={`${decided} הוכרעו (מפגש 2) · ${proposals} הצעה`} />
        <Card icon={ClipboardCheck} label="אירועים מהשטח (הדגמה)" value={bookings + requests} sub={`${count(bookings, "הזמנה אחת", "הזמנות")} · ${count(requests, "בקשה אחת למלווה", "בקשות למלווה")}${incentivePoints ? ` · ${incentivePoints} נקודות תמריץ` : ""}`} />
      </div>

      <section className="libi-card p-5" aria-labelledby="hoods-h">
        <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
          <h2 id="hoods-h" className="text-base font-semibold text-foreground flex items-center gap-2">
            <MapPinned className="w-5 h-5 text-primary" aria-hidden="true" /> השכונות: מה יש ואיפה הפער
          </h2>
          <a href="./hq/" className="min-h-[44px] inline-flex items-center gap-1 text-sm font-semibold text-primary">
            פערים וחלופות באטלס המטה <ExternalLink className="w-4 h-4" aria-hidden="true" />
          </a>
        </div>
        <div className="overflow-x-auto">
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

      <section className="libi-card p-5" aria-labelledby="decided-h">
        <h2 id="decided-h" className="text-base font-semibold text-foreground flex items-center gap-2 mb-2">
          <Scale className="w-5 h-5 text-primary" aria-hidden="true" /> מה הוכרע במפגש 2
        </h2>
        <ul className="text-sm text-foreground grid grid-cols-1 md:grid-cols-2 gap-x-6 gap-y-1">
          {["חלוקת ₪760: ארנק 500, ליווי 181, קהילה 20, תפעול 59", "רצפה של 3 שירותים בכל תחום ליבה", "השתתפות עצמית 0, 20 ועד 50", "תקרת איכות חיים 100", "יעד מיצוי 70%, דגל אדום 35%", ...DECIDED_PRINCIPLES_MEETING_2].map((x) => (
            <li key={x} className="flex items-start gap-1.5"><CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" aria-hidden="true" /> {x}</li>
          ))}
        </ul>
        <p className="text-xs text-muted-foreground mt-2">כל שאר הכללים בהגדרות מסומנים כהצעה, גם כאן וגם באטלס המטה.</p>
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
