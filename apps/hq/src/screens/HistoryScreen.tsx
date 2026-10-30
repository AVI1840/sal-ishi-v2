// גרסאות ויומן ביקורת: כל גרסת בסיס שפורסמה עם השינויים שבה, השינויים שממתינים
// לפרסום, וכל פעולה במטה (קליטת חבילה, ערוץ ארצי, כללים) עם זמן.

import { PageHeader, TableWrap, EmptyState } from "@sal-ishi/ui";
import type { ChangeLogEntry } from "@sal-ishi/core";
import { useHq } from "../store";

const when = (iso: string) => new Date(iso).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" });
const short = (v: unknown) => {
  const text = typeof v === "string" ? v : JSON.stringify(v);
  return text === undefined ? "-" : text.length > 80 ? `${text.slice(0, 80)}...` : text;
};

function Changes(props: { changes: ChangeLogEntry[]; label: string }) {
  if (!props.changes.length) return <p className="muted">אין שינויים.</p>;
  return (
    <TableWrap label={props.label}>
      <table className="table">
        <thead>
          <tr>
            <th scope="col">מתי</th>
            <th scope="col">מה</th>
            <th scope="col">לפני</th>
            <th scope="col">אחרי</th>
            <th scope="col">הערה</th>
          </tr>
        </thead>
        <tbody>
          {props.changes.map((c, i) => (
            <tr key={i}>
              <td>{when(c.at)}</td>
              <td dir="ltr" style={{ textAlign: "right" }}>{c.key}</td>
              <td className="log-value" dir="ltr">{short(c.before)}</td>
              <td className="log-value" dir="ltr">{short(c.after)}</td>
              <td>{c.note ?? ""}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </TableWrap>
  );
}

export default function HistoryScreen() {
  const seed = useHq((s) => s.seed);
  const pending = useHq((s) => s.pending);
  const audit = useHq((s) => s.audit);
  const versions = ((seed.meta as { changelog?: { version: string; published_at: string; changes: ChangeLogEntry[] }[] }).changelog ?? []).slice().reverse();

  return (
    <>
      <PageHeader title="גרסאות ויומן ביקורת" description={`גרסת הכללים הפעילה: ${seed.meta.version}. כל שינוי בכללים נרשם, ונכנס לגרסה בפרסום.`} />
      <section className="card stack" aria-labelledby="pending-h">
        <h2 id="pending-h">ממתין לפרסום ({pending.length})</h2>
        <Changes changes={pending} label="שינויים שממתינים לפרסום" />
      </section>
      <section className="card stack" aria-labelledby="versions-h">
        <h2 id="versions-h">גרסאות שפורסמו ({versions.length})</h2>
        {versions.length === 0 ? <p className="muted">עוד לא פורסמה גרסה מהמטה הזה. הגרסה הפעילה היא הגרסה המובנית.</p> : null}
        {versions.map((v) => (
          <details key={v.version}>
            <summary>
              גרסה {v.version}, {when(v.published_at)}, {v.changes.length} שינויים
            </summary>
            <Changes changes={v.changes} label={`שינויים בגרסה ${v.version}`} />
          </details>
        ))}
      </section>
      <section className="card stack" aria-labelledby="audit-h">
        <h2 id="audit-h">יומן ביקורת ({audit.length})</h2>
        {audit.length === 0 ? (
          <EmptyState title="היומן ריק">כל קליטת חבילה, שינוי בערוץ הארצי, שינוי כלל ופרסום יירשמו כאן.</EmptyState>
        ) : (
          <TableWrap label="יומן ביקורת">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">מתי</th>
                  <th scope="col">פעולה</th>
                  <th scope="col">פרטים</th>
                </tr>
              </thead>
              <tbody>
                {audit
                  .slice()
                  .reverse()
                  .map((a, i) => (
                    <tr key={i}>
                      <td>{when(a.at)}</td>
                      <td>{a.action}</td>
                      <td>{a.detail}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </TableWrap>
        )}
      </section>
    </>
  );
}
