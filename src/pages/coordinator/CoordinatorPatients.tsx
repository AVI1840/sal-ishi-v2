/**
 * האזרחים שלי: כל התיק של המלווה, מאותו מקור כמו "לפנות היום" (buildCaseload
 * ומיון לפי הכללים). סיבת הפנייה במקום "רמת סיכון": אותה שיטת תעדוף בכל המסכים.
 * בהדגמה יש תיק מלא לשלוש הדמויות. לשאר: השורה בלבד.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, Search } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/shared/Avatar";
import { buildCaseload, RULE_LABEL, triage, type TriageItem } from "@/pilot/caseload";
import { usePilot } from "@/pilot/store";

const PERSONAS = new Set(["c1", "c2", "c3"]);

const BUCKET_LABEL: Record<TriageItem["bucket"], { text: string; cls: string }> = {
  today: { text: "היום", cls: "bg-destructive-soft text-destructive border-destructive/30" },
  week: { text: "השבוע", cls: "bg-warning-soft text-warning-foreground border-warning/40" },
  watch: { text: "למעקב", cls: "bg-info-soft text-info border-info/30" },
  ok: { text: "בסדר", cls: "bg-success-soft text-success border-success/30" },
};

const FILTERS: { id: "all" | TriageItem["bucket"]; label: string }[] = [
  { id: "all", label: "כולם" },
  { id: "today", label: "לפנות היום" },
  { id: "week", label: "השבוע" },
  { id: "ok", label: "בסדר" },
];

export default function CoordinatorPatients() {
  const { derived } = usePilot();
  const people = useMemo(() => buildCaseload(), []);
  const items = useMemo(() => triage(people, derived), [people, derived]);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<(typeof FILTERS)[number]["id"]>("all");
  const shown = items.filter((i) => (filter === "all" || i.bucket === filter) && (!query.trim() || i.person.name.includes(query.trim()) || i.person.neighborhood.includes(query.trim())));

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">האזרחים שלי</h1>
        <p className="text-base text-muted-foreground mt-1">
          {people.length} בתיק, ממוינים לפי הכללים: מי לפנות קודם ולמה. תיק מלא בהדגמה: שרה, אהרון ויוסף.
        </p>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" aria-hidden="true" />
          <input
            type="search"
            aria-label="חיפוש לפי שם או שכונה"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="חיפוש לפי שם או שכונה"
            className="w-full min-h-[44px] pr-9 pl-3 rounded-lg border border-border bg-background text-sm"
          />
        </div>
        <div className="flex gap-1.5" role="group" aria-label="סינון">
          {FILTERS.map((f) => (
            <button
              key={f.id}
              type="button"
              aria-pressed={filter === f.id}
              onClick={() => setFilter(f.id)}
              className={cn("min-h-[44px] px-3 rounded-lg text-sm font-semibold border", filter === f.id ? "bg-primary text-primary-foreground border-primary" : "border-border text-foreground")}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      <p className="sr-only" role="status" aria-live="polite">{shown.length} אזרחים</p>

      <ul className="libi-card divide-y divide-border">
        {shown.map(({ person, reasons, bucket }) => {
          const b = BUCKET_LABEL[bucket];
          const row = (
            <>
              <Avatar name={person.name} size={40} tone="primary" />
              <div className="flex-1 min-w-0">
                <p className="text-base font-semibold text-foreground">{person.name}</p>
                <p className="text-sm text-muted-foreground">
                  {person.age} · {person.neighborhood} · {person.language} · קשר אחרון לפני {person.lastContactDays} ימים
                </p>
                {reasons.length ? <p className="text-sm text-foreground mt-0.5">{reasons.map((r) => RULE_LABEL[r.rule]).join(" · ")}</p> : null}
              </div>
              <span className={cn("shrink-0 text-xs font-semibold px-2 py-1 rounded-md border", b.cls)}>{b.text}</span>
              {PERSONAS.has(person.id) ? <ChevronLeft className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" /> : null}
            </>
          );
          return (
            <li key={person.id}>
              {PERSONAS.has(person.id) ? (
                <Link to={`/coordinator/patients/${person.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/40" aria-label={`לתיק של ${person.name}`}>
                  {row}
                </Link>
              ) : (
                <div className="flex items-center gap-3 p-3">{row}</div>
              )}
            </li>
          );
        })}
      </ul>
    </div>
  );
}
