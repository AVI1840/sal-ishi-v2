/**
 * ניהול ספקים במטה: כל הספקים ברשות, באיזה שלב הם בקליטה לפי התקן, מה חוסם,
 * מה מגיע אליהם מהשוק, ומה חסר בשכונות (לגיוס או להרחבה של ספק קיים).
 * בלי תשלומים ובלי דירוג: אלה אצל ספק העל.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, CheckCircle2, ChevronDown, ExternalLink, Search, Store, Target, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { usePilot } from "@/pilot/store";
import { STAGE_LABEL, SUPPLIER_TYPE_LABEL, opportunities, summarize, supplierData, supplierName, suppliersOfType, type SupplierStage } from "@/lib/supplierView";

const STAGE_STYLE: Record<SupplierStage, string> = {
  active: "bg-success-soft text-success",
  onboarding: "bg-accent text-primary",
  blocked: "bg-warning-soft text-warning-foreground",
};

export default function ExecutiveSuppliers() {
  const data = supplierData();
  const { derived } = usePilot();
  const all = useMemo(() => data.suppliers.map((s) => summarize(data, s, derived.bookings)), [data, derived.bookings]);
  const gaps = useMemo(() => opportunities(data), [data]);
  const [stage, setStage] = useState<SupplierStage | "all">("all");
  const [q, setQ] = useState("");
  const [open, setOpen] = useState<string | null>(null);

  const shown = all
    .filter((x) => stage === "all" || x.stage === stage)
    .filter((x) => !q.trim() || supplierName(x.supplier).includes(q.trim()) || x.rows.some((r) => r.service.name.includes(q.trim())))
    .sort((a, b) => (a.stage === b.stage ? b.rows.length - a.rows.length : a.stage === "blocked" ? -1 : b.stage === "blocked" ? 1 : 0));
  const count = (s: SupplierStage) => all.filter((x) => x.stage === s).length;
  const services = all.reduce((n, x) => n + x.rows.length, 0);
  const readyServices = all.reduce((n, x) => n + x.ready, 0);
  const blockers = new Map<string, number>();
  for (const x of all) for (const r of x.rows) for (const m of r.missing) blockers.set(m, (blockers.get(m) ?? 0) + 1);
  const topBlockers = [...blockers.entries()].sort((a, b) => b[1] - a[1]).slice(0, 5);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">ניהול ספקים</h1>
        <p className="text-sm text-muted-foreground mt-1">כל הספקים ברשות: איפה כל אחד בקליטה לפי התקן, מה חוסם, מה מגיע אליו מהשוק, ומה חסר בשכונות.</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        {[
          { label: "ספקים ברשות", value: all.length },
          { label: STAGE_LABEL.active, value: count("active") },
          { label: STAGE_LABEL.onboarding, value: count("onboarding") },
          { label: STAGE_LABEL.blocked, value: count("blocked") },
          { label: "שירותים מוכנים לקליטה", value: `${readyServices} מתוך ${services}` },
        ].map((k) => (
          <div key={k.label} className="libi-stat-card">
            <div className="text-2xl font-bold text-foreground">{k.value}</div>
            <div className="text-sm text-foreground mt-0.5">{k.label}</div>
          </div>
        ))}
      </div>

      {/* מסע הספק */}
      <section className="libi-card p-5" aria-labelledby="journey-h">
        <h2 id="journey-h" className="text-base font-semibold text-foreground mb-3">המסע של ספק, מקצה לקצה</h2>
        <ol className="grid grid-cols-2 md:grid-cols-6 gap-2 text-sm">
          {["נרשם אצל ספק העל", "ממלא לפי התקן (1.2)", "מבחן כניסה: סל משלים", "המטה מאשר", "נכנס לשוק השכונתי", "מדווח נוכחות ומקבל ביקוש"].map((s, i) => (
            <li key={s} className="rounded-lg border border-border p-3 bg-white">
              <span className="block text-xs text-muted-foreground">שלב {i + 1}</span>
              <span className="text-foreground font-medium">{s}</span>
            </li>
          ))}
        </ol>
        <p className="text-xs text-muted-foreground mt-3">תשלומים, חוזים ודירוג אצל ספק העל. המטה רואה עמידה בתקן, ביקוש ופערים.</p>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <section className="libi-card p-5 lg:col-span-2" aria-labelledby="list-h">
          <div className="flex flex-wrap items-end justify-between gap-3 mb-3">
            <h2 id="list-h" className="text-base font-semibold text-foreground flex items-center gap-2">
              <Store className="w-5 h-5 text-primary" aria-hidden="true" /> הספקים
            </h2>
            <label className="relative">
              <span className="sr-only">חיפוש ספק או שירות</span>
              <Search className="w-4 h-4 absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground" aria-hidden="true" />
              <input type="search" value={q} onChange={(e) => setQ(e.target.value)} placeholder="ספק או שירות" className="min-h-[44px] rounded-lg border border-border bg-white pr-9 pl-3 text-sm" />
            </label>
          </div>
          <div role="radiogroup" aria-label="שלב" className="flex flex-wrap gap-2 mb-4">
            {(["all", "blocked", "onboarding", "active"] as const).map((s) => (
              <button
                key={s}
                type="button"
                role="radio"
                aria-checked={stage === s}
                onClick={() => setStage(s)}
                className={cn("min-h-[40px] px-3 rounded-full border text-sm", stage === s ? "bg-primary text-primary-foreground border-primary" : "bg-white text-foreground border-border")}
              >
                {s === "all" ? `כולם (${all.length})` : `${STAGE_LABEL[s]} (${count(s)})`}
              </button>
            ))}
          </div>
          <ul className="divide-y divide-border">
            {shown.map((x) => {
              const id = x.supplier.code;
              const isOpen = open === id;
              return (
                <li key={id} className="py-3">
                  <button type="button" aria-expanded={isOpen} onClick={() => setOpen(isOpen ? null : id)} className="w-full flex flex-wrap items-center gap-3 text-right min-h-[44px]">
                    <span className="flex-1 min-w-[180px]">
                      <span className="block font-semibold text-foreground">{supplierName(x.supplier)}</span>
                      <span className="block text-xs text-muted-foreground">
                        {SUPPLIER_TYPE_LABEL[x.supplier.type] ?? x.supplier.type} · {x.hoods.join(", ") || "אין שכונה"} · {x.supplier.languages.join(", ")}
                      </span>
                    </span>
                    <span className="text-sm text-foreground">{x.ready} מתוך {x.rows.length} בתקן</span>
                    <span className="text-sm text-foreground">{x.activeBookings} הצטרפויות</span>
                    <span className={cn("px-2 py-1 rounded-md text-xs font-semibold", STAGE_STYLE[x.stage])}>{STAGE_LABEL[x.stage]}</span>
                    <ChevronDown className={cn("w-4 h-4 text-muted-foreground transition-transform", isOpen && "rotate-180")} aria-hidden="true" />
                  </button>
                  {x.flags.length ? (
                    <p className="text-xs text-warning-foreground mt-1 flex items-center gap-1">
                      <AlertTriangle className="w-3.5 h-3.5" aria-hidden="true" /> {x.flags.join(" · ")}
                    </p>
                  ) : null}
                  {isOpen ? (
                    <div className="mt-3 rounded-lg bg-muted/40 p-3 space-y-2">
                      <ul className="space-y-1.5 text-sm">
                        {x.rows.map((r) => (
                          <li key={r.service.id} className="flex items-start gap-2">
                            {r.ready ? <CheckCircle2 className="w-4 h-4 text-success shrink-0 mt-0.5" aria-hidden="true" /> : <AlertTriangle className="w-4 h-4 text-warning shrink-0 mt-0.5" aria-hidden="true" />}
                            <span className="text-foreground">
                              <span className="font-medium">{r.service.name}</span>
                              <span className="text-muted-foreground"> · {r.ready ? "מוכן" : r.missing.length ? `חסר: ${r.missing.join(", ")}` : `${r.entry.status}${r.entry.reason ? `: ${r.entry.reason}` : ""}`}</span>
                            </span>
                          </li>
                        ))}
                      </ul>
                      <p className="text-xs text-muted-foreground">
                        {x.participants ? `${x.participants} משתתפים בחודש האחרון שדווח. ` : ""}
                        {x.referrals ? `${x.referrals} הפניות למממן אחר לא נספרות כשירות בשוק.` : ""}
                      </p>
                      <Link to={`/providers?code=${encodeURIComponent(id)}`} className="inline-flex items-center gap-1 text-sm text-primary font-semibold min-h-[44px]">
                        לדף של הספק <ExternalLink className="w-4 h-4" aria-hidden="true" />
                      </Link>
                    </div>
                  ) : null}
                </li>
              );
            })}
            {!shown.length ? <li className="py-6 text-sm text-muted-foreground">אין ספקים שמתאימים לסינון.</li> : null}
          </ul>
        </section>

        <div className="space-y-4">
          <section className="libi-card p-5" aria-labelledby="block-h">
            <h2 id="block-h" className="text-base font-semibold text-foreground mb-2">מה הכי חוסם קליטה</h2>
            {topBlockers.length ? (
              <ul className="space-y-1.5 text-sm">
                {topBlockers.map(([m, n]) => (
                  <li key={m} className="flex justify-between gap-2">
                    <span className="text-foreground">{m}</span>
                    <span className="text-muted-foreground">{n} שירותים</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-sm text-muted-foreground">אין חסמים פתוחים.</p>
            )}
            <p className="text-xs text-muted-foreground mt-2">כדאי להוציא לספקים הנחיה אחת על השדה שחוסם הכי הרבה.</p>
          </section>

          <section className="libi-card p-5" aria-labelledby="gaps-h">
            <h2 id="gaps-h" className="text-base font-semibold text-foreground flex items-center gap-2 mb-2">
              <Target className="w-5 h-5 text-primary" aria-hidden="true" /> מה לגייס
            </h2>
            <ul className="space-y-3 text-sm">
              {gaps.slice(0, 6).map((g) => {
                const who = suppliersOfType(data, g.what);
                return (
                  <li key={`${g.neighborhood}-${g.what}`}>
                    <span className="block font-medium text-foreground">{g.what} · {g.neighborhood}</span>
                    <span className="block text-muted-foreground">{g.why}</span>
                    <span className="block text-xs text-foreground mt-0.5 flex items-center gap-1">
                      <Users className="w-3.5 h-3.5" aria-hidden="true" />
                      {who.length ? `לפנות קודם ל: ${who.slice(0, 2).join(", ")} (כבר נותנים את זה)` : "אין ספק קיים: לגיוס חדש"}
                    </span>
                  </li>
                );
              })}
            </ul>
            <p className="text-xs text-muted-foreground mt-2">מהכיסוי מול הרצפה ומ"ביקשו ואין" של המלוות (נתוני הדגמה).</p>
          </section>
        </div>
      </div>
    </div>
  );
}
