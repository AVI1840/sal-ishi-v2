/**
 * "חדש בתיק": מה שאזרחים בתיק עשו בעצמם ביומיים האחרונים (הצטרפות או הזמנה),
 * עם הצעה לפעולה של המלווה. נעלם אחרי שהמלווה פעלה (נרשם קשר ביומן).
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { PhoneCall, Sparkles } from "lucide-react";
import { CITIZENS } from "@/data/mockData";
import { buildCaseload } from "@/pilot/caseload";
import { logVisit, usePilot } from "@/pilot/store";

const WINDOW_HOURS = 48;
const PERSONAS = new Set(["c1", "c2", "c3"]);

export function NewInCaseload() {
  const { derived } = usePilot();
  const people = useMemo(() => new Map(buildCaseload().map((p) => [p.id, p])), []);
  const since = Date.now() - WINDOW_HOURS * 3600000;
  const items = derived.bookings
    .filter((b) => b.createdBy === "citizen" && b.status === "booked" && new Date(b.createdAt).getTime() >= since && people.has(b.citizenId))
    // המלווה כבר פעלה אחרי ההזמנה: לא חדש.
    .filter((b) => !derived.visits.some((v) => v.citizenId === b.citizenId && v.at > b.createdAt))
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 3);
  if (!items.length) return null;

  return (
    <section className="libi-card p-5 border-primary/40 bg-primary/5" aria-labelledby="new-h">
      <h2 id="new-h" className="text-base font-semibold text-foreground flex items-center gap-2 mb-3">
        <Sparkles className="w-5 h-5 text-primary" aria-hidden="true" /> חדש בתיק
      </h2>
      <ul className="space-y-3">
        {items.map((b) => {
          const person = people.get(b.citizenId)!;
          const female = CITIZENS.find((c) => c.id === b.citizenId)?.gender === "female";
          const first = person.name.split(" ")[0];
          const verb = b.mode === "subscription" ? (female ? "נרשמה ל" : "נרשם ל") : female ? "הזמינה את " : "הזמין את ";
          return (
            <li key={b.id} className="flex items-start justify-between gap-3 flex-wrap">
              <div>
                <p className="text-base text-foreground">
                  {PERSONAS.has(b.citizenId) ? (
                    <Link to={`/coordinator/patients/${b.citizenId}`} className="font-bold underline-offset-2 hover:underline">{first}</Link>
                  ) : (
                    <span className="font-bold">{first}</span>
                  )}{" "}
                  {verb}{b.serviceName}.
                </p>
                <p className="text-sm text-muted-foreground mt-0.5">להציע ליווי למפגש הראשון? קשר בשבוע הראשון מגדיל את הסיכוי להתמיד.</p>
              </div>
              <button
                type="button"
                className="min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-2"
                onClick={() => logVisit({ citizenId: b.citizenId, kind: "phone", note: `הוצע ליווי למפגש הראשון: ${b.serviceName}` })}
              >
                <PhoneCall className="w-4 h-4" aria-hidden="true" /> התקשרתי והצעתי ליווי
              </button>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
