/**
 * פורטל ספקים: הצד של הספק באותו סיפור. הספק נכנס לשוק השכונתי דרך תקן קליטת
 * המפעילים: לכל שירות, האם הוא מוכן לקליטה ומה חסר. שורה אחת לכל שירות (עם
 * השכונות שלו), בלי הפניות (שירות שממומן במלואו על ידי מממן אחר אינו שירות של
 * הספק). דירוג הספק מוצג עם הרכיבים שלו. תשלומים, יתרות והזמנות אצל ספק העל.
 */
import { useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { CheckCircle2, AlertTriangle, FileJson, Info, ClipboardCheck, BarChart3, Building2, ListChecks, Target, MapPin, Languages, Accessibility, Phone } from "lucide-react";
import { DELIVERY_LABEL, SUPPLIER_TYPE_LABEL, opportunities } from "@/lib/supplierView";
import { buildCaseload } from "@/pilot/caseload";
import { attendedIn, monthOf, usedOf } from "@/pilot/services";
import { reportAttendance, usePilot } from "@/pilot/store";
import { amount } from "@/lib/wallet";
import { cn } from "@/lib/utils";
import { buildDemoAuthority, complementOf, defaultSeed, DEMO_JERUSALEM, entryTest, missingMandatoryFields, onboardingGaps, supplierScore, withSettings, ENTRY_STATUS } from "@sal-ishi/core";
import { SUPPLIER_RATING_COMPONENTS } from "@/lib/supplierRating";

/** "2026-Q3" מוצג כ"רבעון 3, 2026". */
const quarterText = (q: string) => q.replace(/^(\d{4})-Q(\d)$/, "רבעון $2, $1");

export default function ProviderDashboard() {
  const data = useMemo(() => buildDemoAuthority(DEMO_JERUSALEM), []);
  const suppliers = data.suppliers;
  const [params] = useSearchParams();
  const [code, setCode] = useState(() => (suppliers.some((s) => s.code === params.get("code")) ? params.get("code")! : suppliers[0]?.code ?? ""));
  const supplier = suppliers.find((s) => s.code === code);
  const hoodName = (id: string) => data.neighborhoods.find((n) => n.id === id)?.name ?? id;
  const all = data.services.filter((s) => s.supplierCode === code);
  // הפניה (מממן אחר משלם הכל) אינה שירות של הספק בשוק.
  const referrals = all.filter((s) => complementOf(s, defaultSeed).state === "full");
  const services = all.filter((s) => !referrals.includes(s));
  const score = supplier ? supplierScore(supplier, withSettings(defaultSeed, { supplier_rating_enabled: true }).settings) : null;

  // שורה אחת לכל שירות: אותו שם באותו ספק בכמה שכונות מתאחד, עם רשימת השכונות.
  const byName = new Map<string, typeof services>();
  for (const s of services) byName.set(s.name, [...(byName.get(s.name) ?? []), s]);
  const rows = [...byName.values()].map((group) => {
    const s = group[0];
    const entry = entryTest(s, defaultSeed);
    const missing = [...new Set(group.flatMap((g) => [...missingMandatoryFields(g, data.activity, defaultSeed).map((m) => m.label), ...onboardingGaps(g, defaultSeed)]))];
    const ready = group.every((g) => g.status === "אושר") && missing.length === 0 && entry.status === ENTRY_STATUS.in;
    return { s, hoods: [...new Set(group.map((g) => hoodName(g.neighborhoodId)))], statuses: [...new Set(group.map((g) => g.status))], entry, missing, ready };
  });
  const ready = rows.filter((r) => r.ready).length;

  // מהשוק: הצטרפויות והזמנות של אזרחים לשירותים של הספק (מיומן האירועים), עם דיווח נוכחות.
  const { derived } = usePilot();
  const people = useMemo(() => new Map(buildCaseload().map((p) => [p.id, p.name])), []);
  const mine = new Set(all.map((x) => x.id));
  const bookings = derived.bookings.filter((b) => mine.has(b.serviceId)).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const month = monthOf(new Date());
  // פעילות בחודש האחרון שדווח (נתוני השטח המצטברים).
  const lastMonth = [...data.activity.map((a) => a.month)].sort().at(-1) ?? "";
  const activity = rows
    .map((r) => {
      const ids = new Set(services.filter((x) => x.name === r.s.name).map((x) => x.id));
      const act = data.activity.filter((a) => a.month === lastMonth && ids.has(a.serviceId));
      return { name: r.s.name, participants: act.reduce((n, a) => n + a.uniqueParticipants, 0), sessions: act.reduce((n, a) => n + a.sessions, 0) };
    })
    .filter((x) => x.participants > 0 || x.sessions > 0);

  const gaps = opportunities(data, code);
  const toReport = bookings.filter((b) => b.status === "booked" && (b.mode === "subscription" ? attendedIn(b, month) < (b.sessionsPerMonth ?? 4) : !b.attendedSessions)).length;
  const notReady = rows.filter((r) => !r.ready);
  const next: string[] = [
    ...notReady.slice(0, 3).map((r) => `להשלים ב"${r.s.name}": ${r.missing.length ? r.missing.join(", ") : r.entry.reason ?? r.entry.status}`),
    ...(toReport ? [`לדווח נוכחות ל-${toReport} הצטרפויות פתוחות`] : []),
    ...gaps.filter((g) => g.canExpand).slice(0, 2).map((g) => `להרחיב "${g.what}" ל${g.neighborhood}: ${g.why}`),
  ];
  const modes = [...new Set(services.map((s) => DELIVERY_LABEL[s.deliveryMode] ?? s.deliveryMode))];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">פורטל ספקים</h1>
        <p className="text-sm text-muted-foreground mt-1">
          לכל שירות: האם הוא עומד בתקן קליטת המפעילים (גרסה 1.2), ומה חסר כדי להיכנס. ומה מגיע מהשוק: הצטרפויות, הזמנות ודיווח נוכחות.
        </p>
      </div>

      <div className="libi-card p-4 flex items-start gap-3 bg-accent/40">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-foreground">שירות שעומד בתקן נכנס לשוק השכונתי שהאזרחים והמלוות רואים. תשלומים, יתרות והזמנות נמצאים בפלטפורמה של ספק העל.</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          ספק (הדגמה)
          <select className="min-h-[44px] rounded-lg border border-border bg-white px-3" value={code} onChange={(e) => setCode(e.target.value)}>
            {suppliers.map((s) => (
              <option key={s.code} value={s.code}>
                {s.displayName}
              </option>
            ))}
          </select>
        </label>
        <div className="libi-stat-card">
          <div className="text-2xl font-bold text-foreground">
            {ready} מתוך {rows.length}
          </div>
          <div className="text-sm text-foreground mt-0.5">שירותים מוכנים לקליטה</div>
        </div>
        <div className="libi-stat-card">
          <div className="text-2xl font-bold text-foreground">{score ? `${score.score.toFixed(1)} מתוך 5` : "אין עדיין"}</div>
          <div className="text-sm text-foreground mt-0.5">דירוג הספק{score ? ` (${quarterText(score.quarter)})` : ""}</div>
        </div>
        {supplier ? <p className="text-sm text-muted-foreground">שפות: {supplier.languages.join(", ")} · נגיש: {supplier.accessible ? "כן" : "לא"}</p> : null}
      </div>

      <nav aria-label="בדף הזה" className="flex flex-wrap gap-2 text-sm">
        {[
          ["#prov-profile", "הפרופיל"],
          ["#prov-next", "מה לעשות עכשיו"],
          ["#prov-services", "השירותים והתקן"],
          ["#market-h", "הצטרפויות ונוכחות"],
          ["#prov-gaps", "הזדמנויות בשכונות"],
        ].map(([href, label]) => (
          <a key={href} href={href} onClick={(e) => { e.preventDefault(); document.querySelector(href)?.scrollIntoView({ behavior: "smooth", block: "start" }); }} className="min-h-[40px] inline-flex items-center px-3 rounded-full border border-border bg-white text-foreground hover:border-primary">
            {label}
          </a>
        ))}
      </nav>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <section id="prov-profile" className="libi-card p-5" aria-labelledby="prof-h">
          <h2 id="prof-h" className="text-base font-semibold text-foreground flex items-center gap-2 mb-3">
            <Building2 className="w-5 h-5 text-primary" aria-hidden="true" /> הפרופיל של הספק
          </h2>
          {supplier ? (
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
              <div><dt className="text-muted-foreground">סוג</dt><dd className="text-foreground font-medium">{SUPPLIER_TYPE_LABEL[supplier.type] ?? supplier.type}</dd></div>
              <div><dt className="text-muted-foreground flex items-center gap-1"><MapPin className="w-3.5 h-3.5" aria-hidden="true" /> שכונות</dt><dd className="text-foreground font-medium">{supplier.neighborhoods.map(hoodName).join(", ") || "-"}</dd></div>
              <div><dt className="text-muted-foreground flex items-center gap-1"><Languages className="w-3.5 h-3.5" aria-hidden="true" /> שפות</dt><dd className="text-foreground font-medium">{supplier.languages.join(", ")}</dd></div>
              <div><dt className="text-muted-foreground flex items-center gap-1"><Accessibility className="w-3.5 h-3.5" aria-hidden="true" /> נגישות</dt><dd className="text-foreground font-medium">{supplier.accessible ? "נגיש" : "לא נגיש (חוסם חלק מהמשתתפים)"}</dd></div>
              <div><dt className="text-muted-foreground">איפה ניתן השירות</dt><dd className="text-foreground font-medium">{modes.join(", ") || "-"}</dd></div>
              <div><dt className="text-muted-foreground flex items-center gap-1"><Phone className="w-3.5 h-3.5" aria-hidden="true" /> איש קשר</dt><dd className="text-foreground font-medium">{supplier.contact?.phone || supplier.contact?.email ? "קיים, אצל ספק העל" : "חסר: להשלים אצל ספק העל"}</dd></div>
            </dl>
          ) : null}
        </section>

        <section id="prov-next" className="libi-card p-5" aria-labelledby="next-h">
          <h2 id="next-h" className="text-base font-semibold text-foreground flex items-center gap-2 mb-3">
            <ListChecks className="w-5 h-5 text-primary" aria-hidden="true" /> מה לעשות עכשיו
          </h2>
          {next.length ? (
            <ol className="space-y-2 text-sm list-decimal pr-5">
              {next.map((n) => <li key={n} className="text-foreground">{n}</li>)}
            </ol>
          ) : (
            <p className="text-sm text-foreground flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-success" aria-hidden="true" /> הכל מעודכן. כל השירותים בתקן ואין נוכחות פתוחה.</p>
          )}
          <div className="grid grid-cols-3 gap-2 mt-4 text-center">
            <div className="rounded-lg bg-muted/50 p-2"><div className="text-lg font-bold text-foreground">{bookings.filter((b) => b.status === "booked").length}</div><div className="text-xs text-foreground">הצטרפויות פעילות</div></div>
            <div className="rounded-lg bg-muted/50 p-2"><div className="text-lg font-bold text-foreground">{toReport}</div><div className="text-xs text-foreground">נוכחות לדווח</div></div>
            <div className="rounded-lg bg-muted/50 p-2"><div className="text-lg font-bold text-foreground">{gaps.length}</div><div className="text-xs text-foreground">הזדמנויות</div></div>
          </div>
        </section>
      </div>

      <div id="prov-services" className="libi-card overflow-x-auto" tabIndex={0} role="region" aria-label="שירותי הספק">
        <table className="w-full text-sm">
          <thead className="bg-muted/60">
            <tr>
              <th scope="col" className="text-right p-3 font-semibold">שירות</th>
              <th scope="col" className="text-right p-3 font-semibold">מבחן כניסה</th>
              <th scope="col" className="text-right p-3 font-semibold">מה חסר</th>
              <th scope="col" className="text-right p-3 font-semibold">בתקן</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ s, hoods, statuses, entry, missing, ready: ok }) => (
              <tr key={s.id} className="border-t border-border align-top">
                <td className="p-3">
                  <div className="font-medium text-foreground">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.unit} · {statuses.join(", ")} · {hoods.join(", ")}</div>
                </td>
                <td className="p-3">{entry.status === ENTRY_STATUS.in ? "עובר" : `${entry.status}: ${entry.reason}`}</td>
                <td className="p-3">{missing.length ? missing.join(", ") : "-"}</td>
                <td className="p-3">
                  <span className={cn("inline-flex items-center gap-1 px-2 py-1 rounded-md text-xs font-semibold", ok ? "bg-success-soft text-success" : "bg-warning-soft text-warning-foreground")}>
                    {ok ? <CheckCircle2 className="w-3.5 h-3.5" aria-hidden="true" /> : <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" />}
                    {ok ? "מוכן" : "דורש השלמה"}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <section className="libi-card p-5" aria-labelledby="market-h">
        <h2 id="market-h" className="text-base font-semibold text-foreground flex items-center gap-2 mb-1">
          <ClipboardCheck className="w-5 h-5 text-primary" aria-hidden="true" /> מהשוק: הצטרפויות והזמנות
        </h2>
        <p className="text-sm text-muted-foreground mb-3">מה שאזרחים בחרו בשוק השכונתי, ודיווח הנוכחות שהופך "שמור" ל"נוצל" בארנק שלהם.</p>
        {bookings.length ? (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-border text-right text-muted-foreground">
                  <th scope="col" className="py-2 font-semibold">משתתף/ת</th>
                  <th scope="col" className="py-2 font-semibold">שירות</th>
                  <th scope="col" className="py-2 font-semibold">מסלול</th>
                  <th scope="col" className="py-2 font-semibold">נוכחות החודש</th>
                  <th scope="col" className="py-2 font-semibold"><span className="sr-only">פעולה</span></th>
                </tr>
              </thead>
              <tbody>
                {bookings.map((b) => {
                  const sub = b.mode === "subscription";
                  const att = sub ? attendedIn(b, month) : b.attendedSessions ?? 0;
                  const name = people.get(b.citizenId) ?? b.citizenId;
                  return (
                    <tr key={b.id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 font-semibold text-foreground">{name}</td>
                      <td className="py-2.5 text-foreground">{b.serviceName}</td>
                      <td className="py-2.5 text-foreground">{sub ? `מנוי חודשי, ${amount(b.coveredShekel)}` : `חד-פעמי, ${amount(b.coveredShekel)}`}{b.status === "cancelled" ? " · עזב/ה" : b.status === "paused" ? " · מוקפא (אשפוז)" : ""}</td>
                      <td className="py-2.5 text-foreground">
                        {sub ? `${att} מתוך ${b.sessionsPerMonth ?? 4}` : att ? "השתתף/ה" : "-"}
                        {usedOf(b) ? <span className="text-muted-foreground"> · נוצל {amount(usedOf(b))}</span> : null}
                      </td>
                      <td className="py-2.5">
                        {b.status === "booked" && (sub ? att < (b.sessionsPerMonth ?? 4) : !att) ? (
                          <button
                            type="button"
                            className="min-h-[40px] px-3 rounded-lg border border-primary text-primary text-sm font-semibold"
                            aria-label={`לדווח נוכחות: ${name}, ${b.serviceName}`}
                            onClick={() => reportAttendance({ citizenId: b.citizenId, bookingId: b.id })}
                          >
                            לדווח נוכחות
                          </button>
                        ) : null}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">עוד אין הצטרפויות מהשוק לשירותים של הספק הזה.</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">בפיילוט: המשתתף מזוהה במזהה בדוי של ספק העל, והדיווח עובר דרך הפלטפורמה שלו.</p>
      </section>

      {activity.length ? (
        <section className="libi-card p-5" aria-labelledby="act-h">
          <h2 id="act-h" className="text-base font-semibold text-foreground flex items-center gap-2 mb-3">
            <BarChart3 className="w-5 h-5 text-primary" aria-hidden="true" /> פעילות בחודש {lastMonth.split("-").reverse().join("/")}
          </h2>
          <ul className="space-y-1.5 text-sm">
            {activity.map((x) => (
              <li key={x.name} className="flex items-center justify-between">
                <span className="text-foreground">{x.name}</span>
                <span className="text-muted-foreground">{x.participants} משתתפים · {x.sessions} מפגשים</span>
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground mt-2">מהדיווח המצטבר לאטלס (נתוני הדגמה).</p>
        </section>
      ) : null}

      <section id="prov-gaps" className="libi-card p-5" aria-labelledby="gaps-h">
        <h2 id="gaps-h" className="text-base font-semibold text-foreground flex items-center gap-2 mb-1">
          <Target className="w-5 h-5 text-primary" aria-hidden="true" /> הזדמנויות בשכונות שלך
        </h2>
        <p className="text-sm text-muted-foreground mb-3">מה חסר בשכונות שבהן הספק פועל: בקשות של מלוות שאין להן מענה, ותחומים מתחת לרצפה. למעלה: מה שהספק כבר יודע לתת.</p>
        {gaps.length ? (
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {gaps.slice(0, 8).map((g) => (
              <li key={`${g.neighborhood}-${g.what}-${g.why}`} className={cn("rounded-lg border p-3 text-sm", g.canExpand ? "border-primary/50 bg-accent/40" : "border-border bg-white")}>
                <span className="block font-semibold text-foreground">{g.what} · {g.neighborhood}</span>
                <span className="block text-muted-foreground">{g.why}</span>
                {g.canExpand ? <span className="block text-xs font-semibold text-primary mt-1">כבר נותנים את זה: אפשר להרחיב</span> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-sm text-muted-foreground">אין פערים פתוחים בשכונות של הספק.</p>
        )}
        <p className="text-xs text-muted-foreground mt-2">נתוני הדגמה. הצעה להרחבה עוברת דרך המטה וספק העל.</p>
      </section>

      <div className="libi-card p-4 space-y-1">
        <p className="text-sm font-semibold text-foreground">איך נבנה דירוג הספק</p>
        <p className="text-sm text-foreground">{SUPPLIER_RATING_COMPONENTS.join(" · ")}</p>
        <p className="text-xs text-muted-foreground">ההרכב והמשקלות ייקבעו בהמשך. בהדגמה הדירוג מההערכה הרבעונית האחרונה באטלס.</p>
      </div>

      {referrals.length ? (
        <p className="text-sm text-muted-foreground">
          {referrals.length === 1
            ? "הפניה אחת (מימון מלא ממממן אחר) לא מופיעה כאן: היא לא שירות של הספק בשוק."
            : `${referrals.length} הפניות (מימון מלא ממממן אחר) לא מופיעות כאן: הן לא שירות של הספק בשוק.`}
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <FileJson className="w-4 h-4" aria-hidden="true" /> התקן והסכמה פתוחים לכל ספק. המטה מייצא אותם במסך "ייצוא" באטלס.
      </p>
    </div>
  );
}
