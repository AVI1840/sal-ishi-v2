/**
 * ספריית הסל מול השטח: כל סוגי השירות בספרייה (seed 0.4), לפי תחום וקטגוריה,
 * ולכל סוג: כמה שירותים מאושרים יש בקטלוג של ירושלים ובאילו שכונות. סוג בלי
 * שירות הוא פער: החלופות באטלס המטה. הכל מהקטלוג ומהספרייה, בלי מספר ידני.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { BookOpen, CheckCircle2, CircleDashed } from "lucide-react";
import { catalogState } from "@/data/catalogSource";
import { realServices } from "@/data/realServices";
import { useTitle } from "@/pilot/components/Frame";
import { cn } from "@/lib/utils";

interface Row {
  id: string;
  name: string;
  unit: string;
  format: string;
  note?: string;
  count: number;
  where: string[];
}

export default function BasketLibrary() {
  useTitle("ספריית הסל");
  const seed = catalogState.seed as unknown as {
    categories: { code: string; name: string; layer: string }[];
    core_categories: { id: string; name: string; codes: string[] }[];
    service_types: { id: string; category: string; name: string; unit: string; format: string; note?: string }[];
  };
  const byType = useMemo(() => {
    const m = new Map<string, { count: number; where: Set<string> }>();
    for (const s of realServices) {
      if (!s.serviceTypeId) continue;
      const e = m.get(s.serviceTypeId) ?? { count: 0, where: new Set<string>() };
      e.count += 1;
      e.where.add(s.reach === "national" ? "ארצי" : s.neighborhood);
      m.set(s.serviceTypeId, e);
    }
    return m;
  }, []);
  const rowsOf = (code: string): Row[] =>
    seed.service_types
      .filter((t) => t.category === code)
      .map((t) => ({ id: t.id, name: t.name, unit: t.unit, format: t.format, note: t.note, count: byType.get(t.id)?.count ?? 0, where: [...(byType.get(t.id)?.where ?? [])] }));
  const groups = [
    ...seed.core_categories.map((c) => ({ id: c.id, name: c.name, codes: c.codes })),
    { id: "qol", name: "איכות חיים", codes: seed.categories.filter((c) => c.layer === "איכות חיים" || c.layer === "בתנאים").map((c) => c.code) },
  ];
  const outside = seed.categories.filter((c) => c.layer === "בחוץ" || c.layer === "תפקיד המלווה");
  const inGroups = groups.flatMap((g) => g.codes.flatMap(rowsOf));
  const covered = inGroups.filter((r) => r.count > 0).length;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-primary" aria-hidden="true" /> ספריית הסל מול השטח
        </h1>
        <p className="text-base text-muted-foreground mt-1 max-w-4xl">
          {inGroups.length} סוגי שירות בספרייה (seed 0.4), {covered} מהם כבר בקטלוג של ירושלים, ב-{realServices.length} שירותים מאושרים. סוג בלי שירות הוא פער: החלופות באטלס המטה.
        </p>
      </div>

      {groups.map((g) => {
        const rows = g.codes.flatMap(rowsOf);
        if (!rows.length) return null;
        const groupCovered = rows.filter((r) => r.count > 0).length;
        return (
          <section key={g.id} className="libi-card p-5" aria-labelledby={`lib-${g.id}`}>
            <div className="flex items-center justify-between flex-wrap gap-2 mb-3">
              <h2 id={`lib-${g.id}`} className="text-lg font-semibold text-foreground">{g.name}</h2>
              <span className="text-sm text-muted-foreground">{groupCovered} מתוך {rows.length} סוגים בשטח</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border text-right text-muted-foreground">
                    <th scope="col" className="py-2 font-semibold">סוג שירות</th>
                    <th scope="col" className="py-2 font-semibold">יחידה ואופן</th>
                    <th scope="col" className="py-2 font-semibold">בקטלוג</th>
                    <th scope="col" className="py-2 font-semibold">איפה</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((r) => (
                    <tr key={r.id} className="border-b border-border/60 last:border-0 align-top">
                      <td className="py-2">
                        <span className="font-semibold text-foreground">{r.name}</span>
                        {r.note ? <div className="text-xs text-muted-foreground">{r.note}</div> : null}
                      </td>
                      <td className="py-2 text-foreground">{r.unit} · {r.format}</td>
                      <td className="py-2">
                        <span className={cn("inline-flex items-center gap-1 font-semibold", r.count ? "text-success" : "text-muted-foreground")}>
                          {r.count ? <CheckCircle2 className="w-4 h-4" aria-hidden="true" /> : <CircleDashed className="w-4 h-4" aria-hidden="true" />}
                          {r.count ? `${r.count} שירותים` : "אין עדיין"}
                        </span>
                      </td>
                      <td className="py-2 text-foreground">{r.where.join(", ") || "-"}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>
        );
      })}

      <section className="libi-card p-5" aria-labelledby="lib-out">
        <h2 id="lib-out" className="text-base font-semibold text-foreground mb-2">מחוץ לארנק</h2>
        <ul className="text-sm text-foreground space-y-1">
          {outside.map((c) => (
            <li key={c.code}>{c.name}: {c.layer === "בחוץ" ? "מחוץ לסל (מממן אחר)" : "חלק מתפקיד המלווה"}</li>
          ))}
        </ul>
        <Link to="/executive/atlas" className="mt-3 inline-flex min-h-[44px] items-center text-sm font-semibold text-primary">לפערים ולחלופות באטלס המטה</Link>
      </section>
    </div>
  );
}
