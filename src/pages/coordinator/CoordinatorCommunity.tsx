/**
 * הקהילה שלי: השכונה של המלווה מהאטלס, באותם כללים שהמטה רואה. מה יש בכל
 * תחום מול הרצפה (3) ויעד העושר (5, מדד בלבד), מי מפעיל (מספרים מצטברים לפי
 * סוג), ואיפה יש פער ומה החלופות. בלי נתוני אזרחים.
 */
import { useMemo } from "react";
import { CheckCircle2, AlertTriangle, MapPinned, Store, Accessibility, HandHeart } from "lucide-react";
import { buildCaseload } from "@/pilot/caseload";
import { cn } from "@/lib/utils";
import { communityFor } from "@/lib/community";
import { catalogState } from "@/data/catalogSource";
import { appSettings } from "@/pilot/settings";

const LEVEL = {
  green: { text: "עומד ברצפה", cls: "bg-success-soft text-success border-success/30", Icon: CheckCircle2 },
  orange: { text: "חסר שירות אחד", cls: "bg-warning-soft text-warning-foreground border-warning/40", Icon: AlertTriangle },
  red: { text: "פער ברצפה", cls: "bg-destructive-soft text-destructive border-destructive/30", Icon: AlertTriangle },
  not_checked: { text: "לא נבדק", cls: "bg-muted text-foreground border-border", Icon: AlertTriangle },
} as const;

export const COMPANION_NEIGHBORHOOD = appSettings.companion.neighborhood ?? "פסגת זאב";

export default function CoordinatorCommunity() {
  const c = useMemo(() => communityFor(COMPANION_NEIGHBORHOOD), []);
  const s = catalogState.seed.settings;
  const budgetPer = (s as unknown as { community: number }).community;
  const caseload = useMemo(() => buildCaseload().length, []);
  if (!c) return <p className="text-base">השכונה לא נמצאה בקטלוג.</p>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">הקהילה שלי: {c.neighborhood}</h1>
        <p className="text-base text-muted-foreground mt-1">
          מה יש בשכונה מהאטלס, באותם כללים שהמטה רואה. מספרים מצטברים בלבד, בלי נתוני אזרחים.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="libi-card p-5">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5"><Store className="w-4 h-4" aria-hidden="true" /> שירותים מאושרים בשכונה</p>
          <p className="text-3xl font-bold text-foreground mt-1">{c.services}</p>
          <p className="text-sm text-muted-foreground mt-1">ועוד {c.reachable - c.services} ארציים ומרחוק. בשוק של התושבים: {c.reachable}.</p>
        </div>
        <div className="libi-card p-5">
          <p className="text-sm text-muted-foreground flex items-center gap-1.5"><MapPinned className="w-4 h-4" aria-hidden="true" /> מפעילים</p>
          <ul className="mt-2 space-y-0.5 text-sm text-foreground">
            {c.suppliers.map((x) => (
              <li key={x.label}>{x.count} {x.label}</li>
            ))}
          </ul>
        </div>
        <div className="libi-card p-5">
          <p className="text-sm text-muted-foreground">הכללים</p>
          <p className="text-sm text-foreground mt-2">רצפה: {s.core_floor} שירותים רציפים בכל תחום ליבה. <span className="font-semibold">הוכרע במפגש 2.</span></p>
          <p className="text-sm text-foreground mt-1">גיוון, יעד עושר של 5 (מדד, לא חסימה) ושירות נגיש אחד לפחות: <span className="font-semibold">הצעה.</span></p>
          <p className="text-xs text-muted-foreground mt-1">מוצרי מניעה ובטיחות לא נספרים ברצפה.</p>
        </div>
      </div>

      <section className="libi-card p-5" aria-labelledby="budget-h">
        <h2 id="budget-h" className="text-base font-semibold text-foreground flex items-center gap-2">
          <HandHeart className="w-5 h-5 text-primary" aria-hidden="true" /> תקציב הקהילה שלי
        </h2>
        <p className="text-3xl font-bold text-foreground mt-2">₪{(budgetPer * caseload).toLocaleString("he-IL")} בחודש</p>
        <p className="text-sm text-foreground mt-1">
          ₪{budgetPer} לכל אזרח בתיק, כפול {caseload} אזרחים. המלווה מנהלת אותו לפעילות קהילתית שהיא יוזמת: מפגשים, ימי הולדת, פרחים, יציאות משותפות.
        </p>
        <p className="text-xs text-muted-foreground mt-1">מההגדרות (חלוקת ₪760, מפגש 2). אופן השימוש: הצעה.</p>
      </section>

      <section className="libi-card p-5" aria-labelledby="cat-h">
        <h2 id="cat-h" className="text-base font-semibold text-foreground mb-4">מה יש בכל תחום</h2>
        <ul className="space-y-3">
          {c.categories.map((x) => {
            const lv = LEVEL[x.level];
            return (
              <li key={x.id} className="p-4 rounded-lg border border-border">
                <div className="flex items-start justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-base font-semibold text-foreground">{x.name}</p>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {x.count} נספרים ברצפה · רצפה {x.floor}
                      {x.target ? ` · יעד ${x.target}` : ""}
                      {x.accessible != null ? (
                        <span className="inline-flex items-center gap-1 mr-1"> · <Accessibility className="w-3.5 h-3.5" aria-hidden="true" /> {x.accessible} נגישים</span>
                      ) : null}
                    </p>
                  </div>
                  <span className={cn("inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg border", lv.cls)}>
                    <lv.Icon className="w-4 h-4" aria-hidden="true" /> {lv.text}
                  </span>
                </div>
                {x.alerts.length ? (
                  <ul className="mt-2 space-y-1 text-sm text-foreground">
                    {x.alerts.map((a) => <li key={a}>{a}</li>)}
                  </ul>
                ) : null}
                {x.alternatives.length ? (
                  <p className="mt-2 text-sm text-foreground">
                    <span className="font-semibold">חלופות להצעה:</span> {x.alternatives.join(", ")}
                  </p>
                ) : null}
              </li>
            );
          })}
        </ul>
      </section>

      <p className="text-sm text-muted-foreground">
        המקור: הקטלוג המאושר באטלס ({appSettings.demo.data_label}). פער או שינוי בקטלוג מטופלים אצל הרשות (אטלס השטח) ובמטה.
      </p>
    </div>
  );
}
