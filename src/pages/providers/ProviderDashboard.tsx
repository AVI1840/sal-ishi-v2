/**
 * פורטל ספקים (0.5 מאוחד): קליטה לפי תקן קליטת המפעילים ובדיקת השלמות בלבד.
 * תשלומים, יתרות, הזמנות ודירוג נמצאים אצל ספק העל, והכלי לא מבצע אותם.
 */
import { useMemo, useState } from "react";
import { CheckCircle2, AlertTriangle, FileJson, Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { buildDemoAuthority, defaultSeed, entryTest, missingMandatoryFields, onboardingGaps, ENTRY_STATUS } from "@sal-ishi/core";

export default function ProviderDashboard() {
  const data = useMemo(() => buildDemoAuthority(2), []);
  const suppliers = data.suppliers;
  const [code, setCode] = useState(suppliers[0]?.code ?? "");
  const supplier = suppliers.find((s) => s.code === code);
  const services = data.services.filter((s) => s.supplierCode === code);

  const rows = services.map((s) => {
    const entry = entryTest(s, defaultSeed);
    const missing = [...missingMandatoryFields(s, data.activity, defaultSeed).map((m) => m.label), ...onboardingGaps(s, defaultSeed)];
    const ready = s.status === "אושר" && missing.length === 0 && entry.status === ENTRY_STATUS.in;
    return { s, entry, missing, ready };
  });
  const ready = rows.filter((r) => r.ready).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">פורטל ספקים: קליטה לפי התקן</h1>
        <p className="text-sm text-muted-foreground mt-1">
          לכל שירות: האם הוא עומד בתקן קליטת המפעילים (operator_onboarding_standard 1.1), ומה חסר כדי להיכנס.
        </p>
      </div>

      <div className="libi-card p-4 flex items-start gap-3 bg-accent/40">
        <Info className="w-5 h-5 text-primary shrink-0 mt-0.5" aria-hidden="true" />
        <p className="text-sm text-foreground">תשלומים, יתרות, הזמנות ודירוג ספקים נמצאים בפלטפורמה של ספק העל. כאן רק בודקים שהשירות מוכן לקליטה.</p>
      </div>

      <div className="flex flex-wrap items-end gap-4">
        <label className="flex flex-col gap-1 text-sm font-medium text-foreground">
          ספק (הדגמה)
          <select className="min-h-[44px] rounded-lg border border-border bg-white px-3" value={code} onChange={(e) => setCode(e.target.value)}>
            {suppliers.map((s) => (
              <option key={s.code} value={s.code}>
                {s.code}
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
            {rows.map(({ s, entry, missing, ready: ok }) => (
              <tr key={s.id} className="border-t border-border align-top">
                <td className="p-3">
                  <div className="font-medium text-foreground">{s.name}</div>
                  <div className="text-xs text-muted-foreground">{s.unit} · {s.status}</div>
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

      <p className="text-sm text-muted-foreground flex items-center gap-2">
        <FileJson className="w-4 h-4" aria-hidden="true" /> התקן והסכמה פתוחים: schema/operator_onboarding_standard_1.1.schema.json. המטה מייצא אותו במסך "ייצוא".
      </p>
    </div>
  );
}
