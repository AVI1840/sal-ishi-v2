import { useMemo, useState } from "react";
import { triage } from "../caseload";
import { useTitle } from "../components/Frame";
import { usePilot } from "../store";
import { useCaseload } from "./CompanionShell";
import { PersonCard } from "./parts";

const FILTERS = [
  { id: "attention", label: "דורש פנייה" },
  { id: "all", label: "כולם" },
  { id: "ok", label: "תקין" },
] as const;

export default function CompanionCaseload() {
  const { derived } = usePilot();
  const people = useCaseload();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("attention");
  useTitle("כל התיק");
  const items = useMemo(() => triage(people, derived), [people, derived]);
  const shown = items
    .filter((i) => (filter === "all" ? true : filter === "ok" ? i.bucket === "ok" : i.bucket !== "ok"))
    .filter((i) => !q.trim() || i.person.name.includes(q.trim()) || i.person.neighborhood.includes(q.trim()));

  return (
    <>
      <h1>כל התיק ({people.length})</h1>
      <div className="p-stack">
        <label htmlFor="q" style={{ fontWeight: 600 }}>
          חיפוש לפי שם או שכונה
        </label>
        <input id="q" className="p-input" value={q} onChange={(e) => setQ(e.target.value)} type="search" autoComplete="off" />
        <div className="p-tabs" role="group" aria-label="סינון">
          {FILTERS.map((f) => (
            <button key={f.id} type="button" aria-pressed={filter === f.id} onClick={() => setFilter(f.id)}>
              {f.label}
            </button>
          ))}
        </div>
        <p className="p-muted" role="status">
          {shown.length} מוצגים
        </p>
      </div>
      <ul className="p-list">
        {shown.map((i) => (
          <PersonCard key={i.person.id} item={i} />
        ))}
      </ul>
    </>
  );
}
