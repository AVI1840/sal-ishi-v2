/**
 * תמריצים בתיק (הצעה): למי זה מתאים, הצעות של המערכת (התמדה), ורישום תמריץ
 * באישור המלווה, עד התקרה החודשית. לא לכולם: רק מי שהמלווה סימנה.
 */
import { useState } from "react";
import { Award, HandHeart } from "lucide-react";
import { cn } from "@/lib/utils";
import { amount } from "@/lib/wallet";
import { incentiveRoom, monthlyCap, persistenceSuggestion, rateOf } from "@/lib/incentives";
import { attendedIn, monthOf } from "@/pilot/services";
import { grantIncentive, setEligibility, usePilot } from "@/pilot/store";
import type { IncentiveRole } from "@/pilot/model";
import { appSettings } from "@/pilot/settings";

const btn = "min-h-[44px] px-3 rounded-lg text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50";

export function IncentivesPanel({ citizenId, firstName, female }: { citizenId: string; firstName: string; female?: boolean }) {
  const g = (f: string, m: string, both: string) => (female === true ? f : female === false ? m : both);
  const { derived } = usePilot();
  const roles = derived.eligibility.get(citizenId) ?? [];
  const room = incentiveRoom(derived.incentives, citizenId);
  const persistence = persistenceSuggestion(derived.bookings, derived.incentives, citizenId);
  const [hours, setHours] = useState(1);
  const [goal, setGoal] = useState("");
  const [msg, setMsg] = useState<string | null>(null);

  const toggle = (r: IncentiveRole) => setEligibility(citizenId, roles.includes(r) ? roles.filter((x) => x !== r) : [...roles, r]);
  const grant = (reason: Parameters<typeof grantIncentive>[0]["reason"], points: number, note?: string) => {
    const p = Math.min(points, room.left);
    if (p <= 0) return setMsg(`הגיע לתקרה החודשית (${amount(monthlyCap())}).`);
    grantIncentive({ citizenId, reason, points: p, note });
    setMsg(`נוספו ל${firstName} ${amount(p)}${p < points ? " (עד התקרה החודשית)" : ""}.`);
  };

  return (
    <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <h3 className="text-sm font-semibold text-foreground flex items-center gap-2">
          <HandHeart className="w-4 h-4 text-primary" aria-hidden="true" /> תמריצים: נתינה לקהילה והתמדה
        </h3>
        <span className="text-xs text-muted-foreground">החודש: {amount(room.given)} מתוך תקרה של {amount(monthlyCap())} · הצעה</span>
      </div>

      <fieldset>
        <legend className="text-sm text-foreground mb-1">{firstName} {g("מתאימה", "מתאים", "מתאים/ה")} ל:</legend>
        <div className="flex flex-wrap gap-2">
          {([
            ["teach", "להעביר חוג או הרצאה"],
            ["volunteer", "להתנדב בשכונה"],
          ] as const).map(([r, label]) => (
            <label key={r} className={cn("flex items-center gap-2 min-h-[44px] px-3 rounded-lg border cursor-pointer text-sm", roles.includes(r) ? "border-primary bg-accent" : "border-border")}>
              <input type="checkbox" className="w-4 h-4" checked={roles.includes(r)} onChange={() => toggle(r)} />
              {label}
            </label>
          ))}
        </div>
        <p className="text-xs text-muted-foreground mt-1">רק מי שמסומן רואה אצלו את ההצעה "לתת לקהילה".</p>
      </fieldset>

      {persistence ? (
        <div className="p-3 rounded-lg border border-success/30 bg-success-soft flex items-center justify-between gap-3 flex-wrap">
          <p className="text-sm text-foreground">
            <Award className="w-4 h-4 inline text-success ml-1" aria-hidden="true" />
            {firstName} {g("השתתפה", "השתתף", "השתתפ/ה")} ב-{attendedIn(persistence, monthOf(new Date()))} מתוך {persistence.sessionsPerMonth ?? 4} מפגשים ב{persistence.serviceName} החודש.
          </p>
          <button type="button" className={cn(btn, "bg-primary text-primary-foreground")} onClick={() => grant("persistence", rateOf("persistence"), persistence.serviceName)}>
            להעניק תמריץ התמדה ({amount(rateOf("persistence"))})
          </button>
        </div>
      ) : null}

      <div className="flex flex-wrap items-end gap-2">
        {roles.includes("teach") ? (
          <button type="button" className={cn(btn, "border border-border bg-background")} onClick={() => grant("teach", rateOf("teach"))}>
            {g("העבירה", "העביר", "העביר/ה")} חוג או הרצאה ({amount(rateOf("teach"))})
          </button>
        ) : null}
        {roles.includes("volunteer") ? (
          <span className="inline-flex items-end gap-2">
            <label className="text-sm text-foreground flex flex-col">
              שעות התנדבות
              <select className="min-h-[44px] rounded-lg border border-border bg-background px-2" value={hours} onChange={(e) => setHours(Number(e.target.value))}>
                {[1, 2, 3, 4].map((h) => <option key={h} value={h}>{h}</option>)}
              </select>
            </label>
            <button type="button" className={cn(btn, "border border-border bg-background")} onClick={() => grant("volunteer", rateOf("volunteer", hours), `${hours} שעות`)}>
              לרשום התנדבות ({amount(rateOf("volunteer", hours))})
            </button>
          </span>
        ) : null}
        <span className="inline-flex items-end gap-2">
          <label className="text-sm text-foreground flex flex-col">
            יעד אישי שהושג
            <input className="min-h-[44px] rounded-lg border border-border bg-background px-2" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="למשל: הגיעה לכל מפגשי המקהלה" />
          </label>
          <button type="button" className={cn(btn, "border border-border bg-background")} disabled={!goal.trim()} onClick={() => (grant("goal", rateOf("goal"), goal.trim()), setGoal(""))}>
            עמידה ביעד ({amount(rateOf("goal"))})
          </button>
        </span>
      </div>
      {msg ? <p role="status" className="text-sm text-foreground">{msg}</p> : null}
      <p className="text-xs text-muted-foreground">{appSettings.incentives?.funding_note ?? ""}</p>
    </div>
  );
}
