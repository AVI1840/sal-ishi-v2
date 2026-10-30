import { useTitle } from "../components/Frame";
import { usePilot } from "../store";
import { usePersonName } from "./CompanionShell";
import { DecisionPanel } from "./parts";

export default function CompanionRequests() {
  const { derived } = usePilot();
  const nameOf = usePersonName();
  useTitle("בקשות");
  const open = derived.requests.filter((r) => r.status === "open");
  const closed = derived.requests.filter((r) => r.status !== "open").reverse();

  return (
    <>
      <h1>בקשות</h1>
      <section className="p-stack" aria-labelledby="open-h">
        <h2 id="open-h">פתוחות ({open.length})</h2>
        {open.length === 0 ? <p>אין בקשות פתוחות.</p> : null}
        <ul className="p-list">
          {open.map((r) => (
            <li key={r.id} className="p-card">
              <p className="p-person__name">{nameOf(r.citizenId)}</p>
              <p>{r.kind === "callback" ? "ביקש/ה שיחזרו אליו/ה" : `מבקש/ת: ${r.serviceName}`}</p>
              {r.note ? <p className="p-muted">{r.note}</p> : null}
              <p className="p-muted p-small">{new Date(r.createdAt).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" })}</p>
              <DecisionPanel request={r} personName={nameOf(r.citizenId)} />
            </li>
          ))}
        </ul>
      </section>
      {closed.length ? (
        <section className="p-stack" aria-labelledby="closed-h">
          <h2 id="closed-h">טופלו</h2>
          <ul className="p-list">
            {closed.map((r) => (
              <li key={r.id} className="p-card">
                <p className="p-person__name">{nameOf(r.citizenId)}</p>
                <p>{r.kind === "callback" ? "שיחזרו אליי" : r.serviceName}</p>
                <DecisionPanel request={r} personName={nameOf(r.citizenId)} />
              </li>
            ))}
          </ul>
        </section>
      ) : null}
    </>
  );
}
