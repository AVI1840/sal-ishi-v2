/**
 * האזרחים שלי: לוח העבודה של המלווה. כל התיק מאותו מקור כמו "לפנות היום"
 * (buildCaseload ומיון לפי הכללים), בכמה מבטים: בסיכון, התראות, לא מימשו,
 * פניות ובקשות, משימות ותעדוף (עם סימון בוצע וחשוב, נשמר במכשיר), ושירותים
 * שחסרים בקהילה שלה. סיבת הפנייה במקום "רמת סיכון", כדי שיהיה מקור אחד.
 */
import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, Bell, CheckSquare, ChevronLeft, Inbox, ListChecks, MapPinned, Search, Square, Star, TrendingDown, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar } from "@/components/shared/Avatar";
import { UnmetDemandPanel } from "@/components/atlas/UnmetDemandPanel";
import { buildCaseload, RULE_LABEL, triage, type TriageItem } from "@/pilot/caseload";
import { usePilot } from "@/pilot/store";
import { catalogState } from "@/data/catalogSource";
import { communityFor } from "@/lib/community";
import { COMPANION_NEIGHBORHOOD } from "./CoordinatorCommunity";

const PERSONAS = new Set(["c1", "c2", "c3"]);
const TASKS_KEY = "sal-ishi-companion-tasks";

const BUCKET_LABEL: Record<TriageItem["bucket"], { text: string; cls: string }> = {
  today: { text: "היום", cls: "bg-destructive-soft text-destructive border-destructive/30" },
  week: { text: "השבוע", cls: "bg-warning-soft text-warning-foreground border-warning/40" },
  watch: { text: "למעקב", cls: "bg-info-soft text-info border-info/30" },
  ok: { text: "בסדר", cls: "bg-success-soft text-success border-success/30" },
};

/** מה לעשות, לכל סיבה: תובנה ופעולה. */
const ACTION: Record<string, string> = {
  hospitalization: "לבדוק מועד שחרור ולעדכן את הספקים",
  callback: "לחזור בטלפון היום",
  gated_request: "להחליט על הבקשה, עם סיבה",
  claim_task: "לעזור בהגשה למממן האחר",
  cognitive_alert: "ביקור בית והצעה לאימון קוגניטיבי",
  no_first_service: "שיחה קצרה והצעה לשיעור ניסיון",
  low_utilization: "לבדוק מה לא עובד ולהציע חלופה",
};

type View = "risk" | "alerts" | "unused" | "requests" | "tasks" | "gaps" | "all";

interface TaskMarks {
  done: string[];
  star: string[];
}

function useTaskMarks(): [TaskMarks, (m: TaskMarks) => void] {
  const [marks, setMarks] = useState<TaskMarks>(() => {
    try {
      return { done: [], star: [], ...JSON.parse(localStorage.getItem(TASKS_KEY) ?? "{}") };
    } catch {
      return { done: [], star: [] };
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(TASKS_KEY, JSON.stringify(marks));
    } catch {
      /* אחסון חסום */
    }
  }, [marks]);
  return [marks, setMarks];
}

function PersonRow({ item, extra }: { item: TriageItem; extra?: string }) {
  const { person, reasons, bucket } = item;
  const b = BUCKET_LABEL[bucket];
  const body = (
    <>
      <Avatar name={person.name} size={40} tone="primary" />
      <div className="flex-1 min-w-0">
        <p className="text-base font-semibold text-foreground">{person.name}</p>
        <p className="text-sm text-muted-foreground">
          {person.age} · {person.neighborhood} · {person.language} · קשר אחרון לפני {person.lastContactDays} ימים
        </p>
        {reasons.length ? (
          <p className="text-sm text-foreground mt-0.5 flex flex-wrap gap-1">
            {reasons.map((r) => (
              <span key={r.rule + (r.request?.id ?? "")} className="px-1.5 py-0.5 rounded bg-muted text-xs font-semibold">{RULE_LABEL[r.rule]}</span>
            ))}
          </p>
        ) : null}
        {extra ? <p className="text-sm text-primary font-medium mt-0.5">{extra}</p> : null}
      </div>
      <div className="hidden sm:block w-28 shrink-0" aria-label={`מיצוי ברבעון ${Math.round(person.utilization * 100)}%`}>
        <div className="text-xs text-muted-foreground mb-1">מיצוי {Math.round(person.utilization * 100)}%</div>
        <div className="h-2 rounded-full bg-muted overflow-hidden">
          <div className={cn("h-full rounded-full", person.utilization < (catalogState.seed.settings.red_flag_avg ?? 0.35) ? "bg-destructive" : "bg-success")} style={{ width: `${Math.max(4, person.utilization * 100)}%` }} />
        </div>
      </div>
      <span className={cn("shrink-0 text-xs font-semibold px-2 py-1 rounded-md border", b.cls)}>{b.text}</span>
      {PERSONAS.has(person.id) ? <ChevronLeft className="w-5 h-5 text-muted-foreground shrink-0" aria-hidden="true" /> : null}
    </>
  );
  return (
    <li>
      {PERSONAS.has(person.id) ? (
        <Link to={`/coordinator/patients/${person.id}`} className="flex items-center gap-3 p-3 hover:bg-muted/40" aria-label={`לתיק של ${person.name}`}>
          {body}
        </Link>
      ) : (
        <div className="flex items-center gap-3 p-3">{body}</div>
      )}
    </li>
  );
}

export default function CoordinatorPatients() {
  const { derived } = usePilot();
  const people = useMemo(() => buildCaseload(), []);
  const items = useMemo(() => triage(people, derived), [people, derived]);
  const community = useMemo(() => communityFor(COMPANION_NEIGHBORHOOD), []);
  const [query, setQuery] = useState("");
  const [view, setView] = useState<View>("risk");
  const [showDone, setShowDone] = useState(false);
  const [marks, setMarks] = useTaskMarks();

  const has = (i: TriageItem, ...rules: string[]) => i.reasons.some((r) => rules.includes(r.rule));
  const byName = (i: TriageItem) => !query.trim() || i.person.name.includes(query.trim()) || i.person.neighborhood.includes(query.trim());
  const lists = {
    risk: items.filter((i) => i.bucket === "today" || i.bucket === "week"),
    alerts: items.filter((i) => has(i, "hospitalization", "cognitive_alert")),
    unused: items.filter((i) => has(i, "no_first_service", "low_utilization")),
    requests: items.filter((i) => i.reasons.some((r) => r.request)),
    all: items,
  };
  const tasks = items.flatMap((i) => i.reasons.map((r) => ({ id: `${i.person.id}:${r.rule}:${r.request?.id ?? ""}`, item: i, rule: r.rule, text: r.text })));
  const sortedTasks = [...tasks].sort((a, b) => Number(marks.star.includes(b.id)) - Number(marks.star.includes(a.id)));
  const openTasks = tasks.filter((t) => !marks.done.includes(t.id)).length;
  const gaps = community?.categories.filter((c) => c.level !== "green" && c.level !== "not_checked") ?? [];

  const TABS: { id: View; label: string; icon: typeof Users; count: number }[] = [
    { id: "risk", label: "בסיכון", icon: AlertTriangle, count: lists.risk.length },
    { id: "alerts", label: "התראות", icon: Bell, count: lists.alerts.length },
    { id: "unused", label: "לא מימשו", icon: TrendingDown, count: lists.unused.length },
    { id: "requests", label: "פניות ובקשות", icon: Inbox, count: lists.requests.length },
    { id: "tasks", label: "משימות ותעדוף", icon: ListChecks, count: openTasks },
    { id: "gaps", label: "שירותים חסרים", icon: MapPinned, count: gaps.length },
    { id: "all", label: "כולם", icon: Users, count: items.length },
  ];
  const toggle = (key: "done" | "star", id: string) =>
    setMarks({ ...marks, [key]: marks[key].includes(id) ? marks[key].filter((x) => x !== id) : [...marks[key], id] });

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-foreground">האזרחים שלי</h1>
        <p className="text-base text-muted-foreground mt-1">
          {people.length} בתיק, ממוינים לפי הכללים: מי לפנות קודם ולמה. תיק מלא בהדגמה: שרה, אהרון ויוסף.
        </p>
      </div>

      {/* מבטים, עם כמה בכל אחד */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2" role="tablist" aria-label="מבט על התיק">
        {TABS.map((t) => (
          <button
            key={t.id}
            type="button"
            role="tab"
            aria-selected={view === t.id}
            onClick={() => setView(t.id)}
            className={cn("libi-card p-3 text-right min-h-[72px] border-2", view === t.id ? "border-primary bg-primary/5" : "border-transparent")}
          >
            <span className="flex items-center gap-1.5 text-sm font-semibold text-foreground">
              <t.icon className="w-4 h-4 text-primary" aria-hidden="true" /> {t.label}
            </span>
            <span className="block text-2xl font-bold text-foreground mt-1">{t.count}</span>
          </button>
        ))}
      </div>

      {view !== "gaps" ? (
        <div className="relative max-w-md">
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
      ) : null}

      {view === "tasks" ? (
        <section className="libi-card p-4 space-y-2" aria-labelledby="tasks-h">
          <div className="flex items-center justify-between gap-2">
            <h2 id="tasks-h" className="text-base font-semibold text-foreground">משימות ותעדוף ({openTasks} פתוחות)</h2>
            <label className="flex items-center gap-2 text-sm min-h-[44px]">
              <input type="checkbox" checked={showDone} onChange={(e) => setShowDone(e.target.checked)} className="w-4 h-4" /> להראות גם מה שבוצע
            </label>
          </div>
          <p className="text-sm text-muted-foreground">כוכב מעלה משימה לראש הרשימה. הסימונים נשמרים במכשיר הזה.</p>
          <ul className="divide-y divide-border">
            {sortedTasks
              .filter((t) => byName(t.item) && (showDone || !marks.done.includes(t.id)))
              .map((t) => {
                const done = marks.done.includes(t.id);
                const star = marks.star.includes(t.id);
                return (
                  <li key={t.id} className="flex items-start gap-3 py-2.5">
                    <button type="button" aria-pressed={done} aria-label={`${done ? "בוצע" : "לסמן כבוצע"}: ${t.item.person.name}, ${RULE_LABEL[t.rule]}`} onClick={() => toggle("done", t.id)} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg hover:bg-muted">
                      {done ? <CheckSquare className="w-6 h-6 text-success" aria-hidden="true" /> : <Square className="w-6 h-6 text-muted-foreground" aria-hidden="true" />}
                    </button>
                    <div className={cn("flex-1 min-w-0", done && "line-through text-muted-foreground")}>
                      <p className="text-sm font-semibold text-foreground">
                        {ACTION[t.rule]}: {t.item.person.name}
                      </p>
                      <p className="text-xs text-muted-foreground">{t.text}</p>
                    </div>
                    <span className={cn("shrink-0 text-xs font-semibold px-2 py-1 rounded-md border self-center", BUCKET_LABEL[t.item.bucket].cls)}>{BUCKET_LABEL[t.item.bucket].text}</span>
                    <button type="button" aria-pressed={star} aria-label={`חשוב: ${t.item.person.name}`} onClick={() => toggle("star", t.id)} className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center rounded-lg hover:bg-muted">
                      <Star className={cn("w-5 h-5", star ? "fill-amber-400 text-amber-500" : "text-muted-foreground")} aria-hidden="true" />
                    </button>
                  </li>
                );
              })}
          </ul>
        </section>
      ) : view === "gaps" ? (
        <div className="space-y-4">
          <section className="libi-card p-5" aria-labelledby="gaps-h">
            <h2 id="gaps-h" className="text-base font-semibold text-foreground">מה חסר בקהילה שלי: {COMPANION_NEIGHBORHOOD}</h2>
            <p className="text-sm text-muted-foreground mt-0.5 mb-3">תחומים מתחת לרצפה (3 שירותים רציפים), והתראות נגישות. חלופות כהצעה.</p>
            {gaps.length === 0 ? <p className="text-sm text-foreground">כל תחומי הליבה עומדים ברצפה.</p> : null}
            <ul className="space-y-3">
              {gaps.map((c) => (
                <li key={c.id} className="p-3 rounded-lg border border-warning/40 bg-warning-soft/30">
                  <p className="text-sm font-semibold text-foreground">
                    {c.name}: {c.count} מתוך {c.floor}
                  </p>
                  {c.alerts.map((a) => (
                    <p key={a} className="text-xs text-foreground mt-0.5">{a}</p>
                  ))}
                  {c.alternatives.length ? <p className="text-xs text-primary mt-1">חלופות: {c.alternatives.join(", ")}</p> : null}
                </li>
              ))}
            </ul>
            {community?.categories.some((c) => c.alerts.length && c.level === "green") ? (
              <ul className="mt-3 space-y-1">
                {community.categories.filter((c) => c.alerts.length && c.level === "green").map((c) => (
                  <li key={c.id} className="text-sm text-foreground">{c.name}: {c.alerts.join(" · ")}</li>
                ))}
              </ul>
            ) : null}
          </section>
          <UnmetDemandPanel />
        </div>
      ) : (
        <>
          <p className="sr-only" role="status" aria-live="polite">{lists[view].filter(byName).length} אזרחים</p>
          <ul className="libi-card divide-y divide-border">
            {lists[view].filter(byName).map((i) => (
              <PersonRow key={i.person.id} item={i} extra={i.reasons[0] ? `מה לעשות: ${ACTION[i.reasons[0].rule]}` : undefined} />
            ))}
          </ul>
          {lists[view].filter(byName).length === 0 ? <p className="text-sm text-muted-foreground">אין אזרחים במבט הזה.</p> : null}
        </>
      )}
    </div>
  );
}
