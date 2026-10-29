/**
 * "לפנות היום" בלוח הבקרה של המלווה (0.5 מאוחד): המיון לפי הכללים הקיימים
 * (אשפוז, בקשות פתוחות, התראה קוגניטיבית, יותר מ-14 יום בלי שירות ראשון,
 * מיצוי רבעוני מתחת ל-35%), ולכל אדם תובנה ופעולה, לא רק התראה.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BedDouble, Brain, Check, Clock, FileText, Hourglass, Phone, TrendingDown, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { CITIZENS } from "@/data/mockData";
import { catalogState } from "@/data/catalogSource";
import { buildCaseload, triage, type TriageItem } from "@/pilot/caseload";
import type { Request } from "@/pilot/model";
import { appSettings, type TriageRule } from "@/pilot/settings";
import { decideRequest, logVisit, usePilot } from "@/pilot/store";

const RULE: Record<TriageRule, { icon: typeof Clock; label: string; action: string }> = {
  hospitalization: { icon: BedDouble, label: "אשפוז", action: "לבדוק מועד שחרור ולעדכן את הספקים" },
  callback: { icon: Phone, label: "ביקש/ה שיחה", action: "שיחה קצרה היום" },
  gated_request: { icon: Hourglass, label: "מחכה לאישור", action: "לאשר או לדחות, עם סיבה" },
  claim_task: { icon: FileText, label: "משימת מיצוי", action: "לעזור בהגשה למממן האחר" },
  cognitive_alert: { icon: Brain, label: "התראה קוגניטיבית", action: "שיחה והצעה לאימון קוגניטיבי" },
  no_first_service: { icon: Clock, label: "בלי שירות ראשון", action: "שיחה קצרה והצעה לשיעור ניסיון" },
  low_utilization: { icon: TrendingDown, label: "מיצוי נמוך", action: "לבדוק מה לא עובד ולהציע חלופה" },
};

const PERSONAS = new Set(["c1", "c2", "c3"]);

/** אישור שירות מותנה בשלוש נגיעות: לאשר או לא, סיבה, לתעד. */
export function Decide(props: { request: Request; name: string }) {
  const r = props.request;
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  if (r.kind === "callback" || r.kind === "claim_help") {
    return (
      <button
        type="button"
        className="min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold hover:opacity-90"
        onClick={() => {
          if (r.kind === "callback") logVisit({ citizenId: r.citizenId, kind: "phone", note: "חזרה לבקשת שיחזרו אליי" });
          decideRequest({ citizenId: r.citizenId, requestId: r.id, decision: "done", reason: r.kind === "callback" ? "חזרתי בטלפון" : "ההגשה בוצעה" });
        }}
      >
        {r.kind === "callback" ? "חזרתי בטלפון: לסגור ולתעד" : "ההגשה בוצעה: לסגור"}
      </button>
    );
  }
  if (!mode) {
    return (
      <div className="flex gap-2">
        <button type="button" aria-label={`לאשר: ${r.serviceName} ל${props.name}`} className="min-h-[44px] px-4 rounded-lg bg-primary text-primary-foreground text-sm font-semibold inline-flex items-center gap-1" onClick={() => setMode("approve")}>
          <Check className="w-4 h-4" aria-hidden="true" /> לאשר
        </button>
        <button type="button" aria-label={`לא לאשר: ${r.serviceName} ל${props.name}`} className="min-h-[44px] px-4 rounded-lg border border-border text-sm font-semibold inline-flex items-center gap-1" onClick={() => setMode("reject")}>
          <X className="w-4 h-4" aria-hidden="true" /> לא לאשר
        </button>
      </div>
    );
  }
  return (
    <fieldset className="space-y-2">
      <legend className="text-sm font-semibold text-foreground mb-1">{mode === "approve" ? "סיבת האישור" : "סיבה (האזרח יראה אותה)"}</legend>
      {appSettings.companion.approval_reasons[mode].map((x) => (
        <label key={x} className={cn("flex items-center gap-2 min-h-[44px] px-3 rounded-lg border cursor-pointer text-sm", reason === x ? "border-primary bg-accent" : "border-border")}>
          <input type="radio" name={`reason-${r.id}`} checked={reason === x} onChange={() => setReason(x)} className="w-4 h-4 accent-[hsl(var(--primary))]" />
          {x}
        </label>
      ))}
      <div className="flex gap-2">
        <button
          type="button"
          disabled={!reason}
          className={cn("min-h-[44px] px-4 rounded-lg text-sm font-semibold disabled:opacity-50", mode === "approve" ? "bg-primary text-primary-foreground" : "bg-destructive text-destructive-foreground")}
          onClick={() => reason && decideRequest({ citizenId: r.citizenId, requestId: r.id, decision: mode === "approve" ? "approved" : "rejected", reason })}
        >
          {mode === "approve" ? "לאשר ולתעד" : "לדחות ולתעד"}
        </button>
        <button type="button" className="min-h-[44px] px-4 rounded-lg border border-border text-sm" onClick={() => (setMode(null), setReason(null))}>
          לחזור
        </button>
      </div>
    </fieldset>
  );
}

function Row(props: { item: TriageItem }) {
  const { person, reasons } = props.item;
  const top = reasons[0]!;
  const meta = RULE[top.rule];
  const Icon = meta.icon;
  const request = reasons.find((r) => r.request)?.request;
  // תובנה אנושית: מה האדם אמר שחשוב לו (בדמויות ההדגמה).
  const persona = CITIZENS.find((c) => c.id === person.id);
  const quote = persona ? `${persona.name.split(" ")[0]} אמר/ה: "${persona.meaningStatement}"` : null;
  return (
    <li className={cn("p-3 rounded-lg border", props.item.bucket === "today" ? "border-destructive/30 bg-destructive-soft/40" : "border-border")}>
      <div className="flex items-start gap-3">
        <div className={cn("w-9 h-9 rounded-lg flex items-center justify-center shrink-0", props.item.bucket === "today" ? "bg-destructive text-destructive-foreground" : "bg-warning text-warning-foreground")}>
          <Icon className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="flex-1 min-w-0 space-y-1">
          <div className="flex items-center gap-2 flex-wrap">
            {PERSONAS.has(person.id) ? (
              <Link to={`/coordinator/patients/${person.id}`} className="text-sm font-bold text-foreground underline-offset-2 hover:underline">
                {person.name}
              </Link>
            ) : (
              <span className="text-sm font-bold text-foreground">{person.name}</span>
            )}
            <span className="text-xs text-muted-foreground">
              {person.age}, {person.neighborhood}
            </span>
            {reasons.map((r) => (
              <span key={r.rule + (r.request?.id ?? "")} className="text-xs font-semibold px-2 py-0.5 rounded-md bg-background border border-border">
                {RULE[r.rule].label}
              </span>
            ))}
          </div>
          <p className="text-sm text-foreground">{top.text}</p>
          {quote ? <p className="text-sm text-muted-foreground italic">{quote}</p> : null}
          <p className="text-sm font-semibold text-primary">מה לעשות: {meta.action}</p>
          {request && request.status === "open" ? <Decide request={request} name={person.name} /> : null}
        </div>
      </div>
    </li>
  );
}

export function TodayTriage() {
  const { derived } = usePilot();
  const people = useMemo(() => buildCaseload(), []);
  const items = useMemo(() => triage(people, derived), [people, derived]);
  const [all, setAll] = useState(false);
  const today = items.filter((i) => i.bucket === "today");
  const week = items.filter((i) => i.bucket === "week");
  const shown = all ? [...today, ...week] : [...today, ...week].slice(0, 3);
  const s = catalogState.seed.settings;

  return (
    <section className="libi-card p-5" aria-labelledby="today-title">
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <h2 id="today-title" className="text-base font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-destructive" aria-hidden="true" /> לפנות היום
          </h2>
          <p className="text-xs text-muted-foreground mt-0.5">
            {today.length} היום, {week.length} השבוע, מתוך {people.length} בתיק. לפי הכללים: אשפוז, בקשות פתוחות, התראה קוגניטיבית, יותר מ-{s.first_service_max_days} יום בלי שירות ראשון, מיצוי רבעוני מתחת ל-{Math.round(s.red_flag_avg * 100)}%.
          </p>
        </div>
      </div>
      <ul className="space-y-2">
        {shown.map((i) => (
          <Row key={i.person.id} item={i} />
        ))}
      </ul>
      {today.length + week.length > 3 ? (
        <button type="button" className="mt-3 min-h-[44px] px-4 rounded-lg border border-border text-sm font-semibold" aria-expanded={all} onClick={() => setAll(!all)}>
          {all ? "להציג פחות" : `להציג את כל ${today.length + week.length}`}
        </button>
      ) : null}
    </section>
  );
}
