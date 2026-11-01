import { useMemo, useState } from "react";
import { catalogState } from "@/data/catalogSource";
import { triage } from "../caseload";
import { useTitle } from "../components/Frame";
import { usePilot } from "../store";
import { useCaseload } from "./CompanionShell";
import { PersonCard } from "./parts";

/** "מי דורש פנייה היום": המסך הראשון של המלווה. */
export default function CompanionToday() {
  const { derived } = usePilot();
  const people = useCaseload();
  const items = useMemo(() => triage(people, derived), [people, derived]);
  const [showWeek, setShowWeek] = useState(false);
  useTitle("היום");

  const today = items.filter((i) => i.bucket === "today");
  const week = items.filter((i) => i.bucket === "week");
  const watch = items.filter((i) => i.bucket === "watch");

  return (
    <>
      <div className="p-stack" style={{ gap: "0.25em" }}>
        <h1>לפנות היום</h1>
        <p className="p-muted">
          {people.length} אנשים בתיק. המיון לפי הכללים: אשפוז, בקשות פתוחות, התראה קוגניטיבית, יותר מ-{catalogState.seed.settings.first_service_max_days} יום בלי שירות ראשון, ומיצוי ברבעון מתחת ל-{Math.round(catalogState.seed.settings.red_flag_avg * 100)}%.
        </p>
      </div>
      <div className="p-kpis" role="list" aria-label="סיכום התיק">
        <div className="p-kpi" role="listitem">
          <strong>{today.length}</strong>היום
        </div>
        <div className="p-kpi" role="listitem">
          <strong>{week.length}</strong>השבוע
        </div>
        <div className="p-kpi" role="listitem">
          <strong>{watch.length}</strong>במעקב
        </div>
      </div>

      <section className="p-stack" aria-labelledby="today-h">
        <h2 id="today-h">היום ({today.length})</h2>
        {today.length ? (
          <ul className="p-list">
            {today.map((i) => (
              <PersonCard key={i.person.id} item={i} />
            ))}
          </ul>
        ) : (
          <p>אין פניות דחופות היום.</p>
        )}
      </section>

      <section className="p-stack" aria-labelledby="week-h">
        <h2 id="week-h">השבוע ({week.length})</h2>
        <ul className="p-list">
          {(showWeek ? week : week.slice(0, 3)).map((i) => (
            <PersonCard key={i.person.id} item={i} />
          ))}
        </ul>
        {week.length > 3 ? (
          <button type="button" className="p-btn p-btn--ghost" onClick={() => setShowWeek(!showWeek)} aria-expanded={showWeek}>
            {showWeek ? "להציג פחות" : `להציג את כל ${week.length}`}
          </button>
        ) : null}
      </section>
      <p className="p-muted p-small">
        מיצוי וימים לשירות ראשון: בפיילוט הנתונים מגיעים מדוח ספק העל. בהדגמה התיק בדוי.
      </p>
    </>
  );
}
