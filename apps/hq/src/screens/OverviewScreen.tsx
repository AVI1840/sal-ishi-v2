// סקירה: מה שגורם מטה צריך לראות בלי הסבר. הקטלוג, הכללים, המדדים והייצוא
// נגזרים מאותו מקור (המצב המאוחד וגרסת הבסיס), וכל כלל פתוח מסומן כהצעה.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, BookOpenCheck, CheckCircle2, History, Info, XCircle } from "lucide-react";
import { buildOnboardingStandard, isPublishable, proposalKeys, statusNote, validateOnboardingStandard } from "@sal-ishi/core";
import { Badge, PageHeader, ProposalBadge } from "@sal-ishi/ui";
import { useHqAnalysis } from "../analysis";
import { useHq } from "../store";

const SCOPE_URL = import.meta.env.DEV ? "http://localhost:5173/#/scope" : "../#/scope";

export default function OverviewScreen() {
  const { state, seed, coverage, summaries } = useHqAnalysis();
  const pending = useHq((s) => s.pending.length);
  const [exported, setExported] = useState<{ count: number; skipped: number; valid: boolean } | null>(null);

  useEffect(() => {
    let alive = true;
    buildOnboardingStandard(state, seed)
      .then((r) => {
        let valid = true;
        try {
          validateOnboardingStandard(r.export);
        } catch {
          valid = false;
        }
        if (alive) setExported({ count: r.export.services.length, skipped: r.skipped.length, valid });
      })
      .catch(() => alive && setExported({ count: 0, skipped: 0, valid: false }));
    return () => {
      alive = false;
    };
  }, [state, seed]);

  const approved = state.services.filter((s) => isPublishable(s, seed.settings)).length;
  const proposals = proposalKeys(seed.settings).filter((k) => !k.endsWith("_status"));
  const red = coverage.cells.filter((c) => c.level === "red");
  const redHoods = new Set(red.map((c) => c.neighborhoodId)).size;

  const steps = [
    { to: "/intake", title: "1. קטלוג", value: `${approved} שירותים מאושרים`, note: `${summaries.length} רשויות, ${state.neighborhoods.length} שכונות` },
    { to: "/rules", title: "2. כללים", value: `גרסת בסיס ${seed.meta.version}`, note: `${proposals.length} כללים פתוחים${pending ? `, ${pending} שינויים לפני פרסום` : ""}` },
    { to: "/national", title: "3. מדדים", value: red.length ? `${red.length} פערי כיסוי אדומים` : "אין פערי כיסוי אדומים", note: `${redHoods ? `ב-${redHoods} שכונות. ` : ""}גם מיצוי, חדירה, פריסה, מחיר לשעה וזמן לשירות ראשון` },
    {
      to: "/export",
      title: "4. ייצוא לספק",
      value: exported ? `${exported.count} שירותים בתקן 1.1` : "מחשב...",
      note: exported ? (exported.valid ? "עובר את ה-JSON Schema" : "לא עובר את הסכמה") + (exported.skipped ? `, ${exported.skipped} דורשים השלמה` : "") : "",
    },
  ];

  return (
    <>
      <PageHeader title="סקירה" description="ארבעה שלבים, מקור אחד: מה שמאושר בקטלוג ומה שנקבע בכללים הוא מה שנמדד ומה שיוצא לספק." />
      <ol className="overview-flow" aria-label="מהקטלוג לייצוא">
        {steps.map((s, i) => (
          <li key={s.to}>
            <Link to={s.to} className="card overview-step">
              <span className="overview-step__title">{s.title}</span>
              <strong>{s.value}</strong>
              <span className="muted">{s.note}</span>
              {s.to === "/export" && exported ? (
                exported.valid ? (
                  <Badge tone="success">תקין</Badge>
                ) : (
                  <Badge tone="error">דורש תיקון</Badge>
                )
              ) : null}
            </Link>
            {i < steps.length - 1 ? <ArrowLeft className="overview-arrow" aria-hidden="true" size={22} /> : null}
          </li>
        ))}
      </ol>

      <section className="card stack" aria-labelledby="open-h">
        <h2 id="open-h">כללים שממתינים להכרעה ({proposals.length})</h2>
        <p className="muted">כל אחד מהם מוצג בכל מקום בכלי כ"הצעה, ממתין להכרעה", ושינוי שלו בספרייה וכללים מתעדכן בייצוא מיד.</p>
        <ul className="overview-proposals">
          {proposals.map((k) => (
            <li key={k}>
              <code dir="ltr">{k}</code> <ProposalBadge />
              <span className="muted"> {statusNote(seed.settings, k).replace(/^\s*proposal\s*-?\s*/i, "")}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="actions">
        <Link to="/learning" className="btn btn--secondary">
          <BookOpenCheck aria-hidden="true" size={18} /> פנקס למידה
        </Link>
        <Link to="/history" className="btn btn--secondary">
          <History aria-hidden="true" size={18} /> גרסאות ויומן ביקורת
        </Link>
        <a href={SCOPE_URL} className="btn btn--ghost">
          <Info aria-hidden="true" size={18} /> מה הכלי כן ולא עושה
        </a>
      </div>

      <section className="card stack" aria-labelledby="scope-h">
        <h2 id="scope-h">הגבול בין הכלי לספק</h2>
        <ul className="overview-scope">
          <li>
            <CheckCircle2 aria-hidden="true" size={18} color="#367c39" /> הכלי: שירותים, כללים, מדדים, ותקן קליטה פתוח שכל ספק יכול לקרוא.
          </li>
          <li>
            <XCircle aria-hidden="true" size={18} color="#c93435" /> לא בכלי: נקודות חיות, יתרות, תשלומים, רישום אזרחים, אימות נוכחות, שרת.
          </li>
        </ul>
      </section>
    </>
  );
}
