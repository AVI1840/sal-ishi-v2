/**
 * התיק במספרים ומה קרה בתיק. הכל מחושב: המדדים מהתיק (מיצוי, שירות ראשון, קשר
 * אחרון, שפה) מול הספים שבהגדרות, והעדכונים מיומן האירועים. בלי מספר שהוקלד ביד.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { Activity, History } from "lucide-react";
import { catalogState } from "@/data/catalogSource";
import { count } from "@/lib/hebrew";
import { cn } from "@/lib/utils";
import { buildCaseload } from "@/pilot/caseload";
import { usePilot } from "@/pilot/store";
import type { PilotEvent } from "@/pilot/model";

const pct = (n: number) => `${Math.round(n * 100)}%`;

function Bar(props: { label: string; value: number; of: number; tone: "ok" | "warn" | "bad"; hint?: string }) {
  const share = props.of ? props.value / props.of : 0;
  return (
    <li>
      <div className="flex items-center justify-between text-sm">
        <span className="text-foreground">{props.label}</span>
        <span className="font-semibold text-foreground">{props.value} <span className="text-muted-foreground font-normal">({pct(share)})</span></span>
      </div>
      <div className="h-2 rounded-full bg-muted mt-1 overflow-hidden" aria-hidden="true">
        <div className={cn("h-full rounded-full", props.tone === "ok" ? "bg-success" : props.tone === "warn" ? "bg-warning" : "bg-destructive")} style={{ width: `${Math.round(share * 100)}%` }} />
      </div>
      {props.hint ? <p className="text-xs text-muted-foreground mt-0.5">{props.hint}</p> : null}
    </li>
  );
}

export function CaseloadPulse() {
  const people = useMemo(() => buildCaseload(), []);
  const s = catalogState.seed.settings as unknown as { utilization_target: number; red_flag_avg: number };
  const target = Number(s.utilization_target ?? 0.7);
  const red = Number(s.red_flag_avg ?? 0.35);
  const n = people.length;
  const avg = people.reduce((a, p) => a + p.utilization, 0) / (n || 1);
  const atTarget = people.filter((p) => p.utilization >= target).length;
  const below = people.filter((p) => p.firstServiceDone && p.utilization < red).length;
  const noFirst = people.filter((p) => !p.firstServiceDone);
  const late = noFirst.filter((p) => p.daysSinceEnrollment > 14).length;
  const noContact = people.filter((p) => p.lastContactDays > 30).length;
  const langs = Object.entries(people.reduce<Record<string, number>>((m, p) => ((m[p.language] = (m[p.language] ?? 0) + 1), m), {})).sort((a, b) => b[1] - a[1]);

  return (
    <section className="libi-card p-5" aria-labelledby="pulse-h">
      <h2 id="pulse-h" className="text-base font-semibold text-foreground flex items-center gap-2 mb-1">
        <Activity className="w-5 h-5 text-primary" aria-hidden="true" /> התיק שלי במספרים
      </h2>
      <p className="text-sm text-muted-foreground mb-3">
        מיצוי ממוצע ברבעון {pct(avg)} מול יעד {pct(target)}. דגל אדום מתחת ל-{pct(red)}. מההגדרות (מפגש 2).
      </p>
      <ul className="space-y-3">
        <Bar label="ביעד המיצוי" value={atTarget} of={n} tone="ok" />
        <Bar label={`מיצוי מתחת ל-${pct(red)}`} value={below} of={n} tone="bad" hint="לשיחה: מה לא מתאים, ומה להחליף" />
        <Bar label="עוד לא התחילו שירות ראשון" value={noFirst.length} of={n} tone="warn" hint={`${count(late, "אחד מהם", "מהם")} יותר מ-14 יום מהקליטה`} />
        <Bar label="בלי קשר יותר מ-30 יום" value={noContact} of={n} tone="warn" />
      </ul>
      <p className="text-sm text-foreground mt-3">
        שפת שיחה: {langs.map(([l, c]) => `${l} ${c}`).join(" · ")}
      </p>
      <p className="text-xs text-muted-foreground mt-1">תיק הדגמה בדוי. בפיילוט: מהנוכחות שהספקים מדווחים ומהיומן של המלווה.</p>
    </section>
  );
}

const WHAT: Partial<Record<PilotEvent["type"], (e: PilotEvent) => string | null>> = {
  "booking.created": (e) => (e.type === "booking.created" ? `${e.mode === "subscription" ? "הצטרפות ל" : "הזמנה: "}${e.serviceName}` : null),
  "booking.cancelled": () => "ביטול או עזיבה",
  "attendance.reported": (e) => (e.type === "attendance.reported" ? `הספק דיווח נוכחות (${e.sessions === 1 ? "מפגש אחד" : `${e.sessions} מפגשים`})` : null),
  "request.created": (e) => (e.type === "request.created" ? (e.kind === "callback" ? "ביקש/ה שיחזרו" : `בקשה: ${e.serviceName ?? "שירות מותנה"}`) : null),
  "needs.updated": () => "עדכן/ה מה חשוב לו/לה",
  "review.logged": () => "מעקב חודשי",
};

export function RecentInCaseload() {
  const { state } = usePilot();
  const people = useMemo(() => new Map(buildCaseload().map((p) => [p.id, p])), []);
  const items = state.events
    .filter((e) => e.actor !== "companion" && WHAT[e.type] && people.has(e.citizenId))
    .slice(-8)
    .reverse()
    .map((e) => ({ e, text: WHAT[e.type]!(e) }))
    .filter((x) => x.text);
  if (!items.length) return null;
  return (
    <section className="libi-card p-5" aria-labelledby="recent-h">
      <h2 id="recent-h" className="text-base font-semibold text-foreground flex items-center gap-2 mb-3">
        <History className="w-5 h-5 text-primary" aria-hidden="true" /> מה קרה בתיק
      </h2>
      <ul className="space-y-2">
        {items.map(({ e, text }) => {
          const p = people.get(e.citizenId)!;
          const mins = Math.max(0, Math.round((Date.now() - new Date(e.at).getTime()) / 60000));
          const when = mins < 60 ? "עכשיו" : mins < 1440 ? `לפני ${Math.round(mins / 60)} שעות` : `לפני ${Math.round(mins / 1440)} ימים`;
          return (
            <li key={e.id} className="flex items-start justify-between gap-3 text-sm">
              <span className="text-foreground">
                <Link to={`/coordinator/patients/${p.id}`} className="font-semibold hover:underline">{p.name}</Link> · {text}
              </span>
              <span className="text-muted-foreground shrink-0">{when}</span>
            </li>
          );
        })}
      </ul>
      <p className="text-xs text-muted-foreground mt-2">מיומן האירועים: מה שהאזרחים והספקים עשו, בלי מה שהמלווה עצמה רשמה.</p>
    </section>
  );
}
