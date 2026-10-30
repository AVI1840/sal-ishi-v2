/**
 * פורטל ספקים: הצד של הספק באותו סיפור. הספק נכנס לשוק השכונתי דרך תקן קליטת
 * המפעילים: לכל שירות, האם הוא מוכן לקליטה ומה חסר. שורה אחת לכל שירות (עם
 * השכונות שלו), בלי הפניות (שירות שממומן במלואו על ידי מממן אחר אינו שירות של
 * הספק). דירוג הספק מוצג עם הרכיבים שלו. תשלומים, יתרות והזמנות אצל ספק העל.
 */
import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, FileJson, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildDemoAuthority, complementOf, defaultSeed, DEMO_JERUSALEM, entryTest, missingMandatoryFields, onboardingGaps, supplierScore, withSettings, ENTRY_STATUS } from "@sal-ishi/core";
import { SUPPLIER_RATING_COMPONENTS } from "@/lib/supplierRating";

/** "2026-Q3" מוצג כ"רבעון 3, 2026". */
const quarterText = (q: string) => q.replace(/^(\d{4})-Q(\d)$/, "רבעון $2, $1");

export default function ProviderDashboard() {
  const data = useMemo(() => buildDemoAuthority(DEMO_JERUSALEM), []);
  const suppliers = data.suppliers;
  const [code, setCode] = useState(suppliers[0]?.code ?? "");
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

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">פורטל ספקים: קליטה לפי התקן</h1>
        <p className="text-sm text-muted-foreground mt-1">
          לכל שירות: האם הוא עומד בתקן קליטת המפעילים (גרסה 1.1), ומה חסר כדי להיכנס.
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

      <div className="libi-card overflow-x-auto" tabIndex={0} role="region" aria-label="שירותי הספק">
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

      <div className="libi-card p-4 space-y-1">
        <p className="text-sm font-semibold text-foreground">איך נבנה דירוג הספק</p>
        <p className="text-sm text-foreground">{SUPPLIER_RATING_COMPONENTS.join(" · ")}</p>
        <p className="text-xs text-muted-foreground">ההרכב והמשקלות ייקבעו בהמשך. בהדגמה הדירוג מההערכה הרבעונית האחרונה באטלס.</p>
      </div>

      {referrals.length ? (
        <p className="text-sm text-muted-foreground">
          {referrals.length === 1 ? "הפניה אחת" : `${referrals.length} הפניות`} (מימון מלא ממממן אחר) לא מופיעות כאן: הן לא שירות של הספק בשוק.
        </p>
      ) : null}

      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <FileJson className="w-4 h-4" aria-hidden="true" /> התקן והסכמה פתוחים לכל ספק. המטה מייצא אותם במסך "ייצוא" באטלס.
      </p>
    </div>
  );
}
