import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertTriangle, BedDouble, Brain, Clock, Hourglass, Phone, TrendingDown } from "lucide-react";
import { RULE_LABEL, type TriageItem, type TriageReason } from "../caseload";
import type { Request } from "../model";
import type { TriageRule } from "../settings";
import { appSettings } from "../settings";
import { decideRequest, logVisit } from "../store";

const RULE_ICON: Record<TriageRule, typeof Clock> = {
  hospitalization: BedDouble,
  callback: Phone,
  gated_request: Hourglass,
  cognitive_alert: Brain,
  no_first_service: Clock,
  low_utilization: TrendingDown,
};

const BUCKET_TEXT = { today: "היום", week: "השבוע", watch: "במעקב", ok: "תקין" } as const;

export function ReasonChip(props: { reason: TriageReason; bucket: TriageItem["bucket"] }) {
  const Icon = RULE_ICON[props.reason.rule];
  const tone = props.bucket === "ok" ? "watch" : props.bucket;
  return (
    <span className={`p-chip p-chip--${tone}`}>
      <Icon aria-hidden="true" size={15} />
      {RULE_LABEL[props.reason.rule]}
    </span>
  );
}

export function BucketBadge(props: { bucket: TriageItem["bucket"] }) {
  if (props.bucket === "ok") return <span className="p-badge p-badge--ok">תקין</span>;
  return (
    <span className={`p-chip p-chip--${props.bucket}`}>
      <AlertTriangle aria-hidden="true" size={15} />
      {BUCKET_TEXT[props.bucket]}
    </span>
  );
}

/** כרטיס אדם בתיק: מי, למה לפנות, ופעולה אחת. */
export function PersonCard(props: { item: TriageItem }) {
  const { person, reasons, bucket } = props.item;
  return (
    <li className="p-card">
      <div className="p-person">
        <div>
          <p className="p-person__name">{person.name}</p>
          <p className="p-muted p-small">
            {person.age}, {person.neighborhood}
            {person.language !== "עברית" ? `, ${person.language}` : ""}
          </p>
        </div>
        <BucketBadge bucket={bucket} />
      </div>
      {reasons.length ? (
        <ul className="p-stack" style={{ gap: "0.35em", listStyle: "none", padding: 0, margin: 0 }}>
          {reasons.map((r) => (
            <li key={r.rule + (r.request?.id ?? "")} className="p-row" style={{ alignItems: "flex-start" }}>
              <ReasonChip reason={r} bucket={bucket} />
              <span>{r.text}</span>
            </li>
          ))}
        </ul>
      ) : (
        <p className="p-muted">אין כרגע סיבה לפנות.</p>
      )}
      <Link to={`/companion/person/${person.id}`} className="p-btn p-btn--secondary">
        לפתוח את התיק<span className="p-visually-hidden"> של {person.name}</span>
      </Link>
    </li>
  );
}

/**
 * החלטה על בקשה בשלוש נגיעות: לאשר או לא, סיבה, ולאשר ולתעד.
 * בקשת "שיחזרו אליי" נסגרת בנגיעה אחת, עם תיעוד שיחה ביומן.
 */
export function DecisionPanel(props: { request: Request; personName: string }) {
  const r = props.request;
  const [mode, setMode] = useState<"approve" | "reject" | null>(null);
  const [reason, setReason] = useState<string | null>(null);
  const reasons = mode ? appSettings.companion.approval_reasons[mode] : [];

  if (r.status !== "open") {
    const text = r.status === "approved" ? "אושר" : r.status === "rejected" ? "לא אושר" : "טופל";
    return (
      <p className={`p-badge ${r.status === "rejected" ? "p-badge--bad" : "p-badge--ok"}`}>
        {text}
        {r.reason ? `: ${r.reason}` : ""}
      </p>
    );
  }

  if (r.kind === "callback") {
    return (
      <button
        type="button"
        className="p-btn p-btn--primary"
        onClick={() => {
          logVisit({ citizenId: r.citizenId, kind: "phone", note: "חזרה לבקשת שיחזרו אליי" });
          decideRequest({ citizenId: r.citizenId, requestId: r.id, decision: "done", reason: "חזרתי בטלפון" });
        }}
      >
        <Phone aria-hidden="true" size={18} />
        חזרתי בטלפון: לסגור ולתעד
      </button>
    );
  }

  if (!mode) {
    return (
      <div className="p-row">
        <button type="button" className="p-btn p-btn--primary" onClick={() => setMode("approve")}>
          לאשר<span className="p-visually-hidden">: {r.serviceName} ל{props.personName}</span>
        </button>
        <button type="button" className="p-btn p-btn--ghost" onClick={() => setMode("reject")}>
          לא לאשר<span className="p-visually-hidden">: {r.serviceName} ל{props.personName}</span>
        </button>
      </div>
    );
  }

  return (
    <div className="p-stack">
      <fieldset className="p-choices">
        <legend style={{ fontSize: "1em" }}>{mode === "approve" ? "סיבת האישור" : "סיבה (האזרח יראה אותה)"}</legend>
        {reasons.map((x) => (
          <label key={x} className="p-choice">
            <input type="radio" name={`reason-${r.id}`} checked={reason === x} onChange={() => setReason(x)} />
            {x}
          </label>
        ))}
      </fieldset>
      <div className="p-row">
        <button
          type="button"
          className={`p-btn ${mode === "approve" ? "p-btn--primary" : "p-btn--danger"}`}
          disabled={!reason}
          onClick={() => reason && decideRequest({ citizenId: r.citizenId, requestId: r.id, decision: mode === "approve" ? "approved" : "rejected", reason })}
        >
          {mode === "approve" ? "לאשר ולתעד" : "לדחות ולתעד"}
        </button>
        <button type="button" className="p-btn p-btn--ghost" onClick={() => (setMode(null), setReason(null))}>
          לחזור
        </button>
      </div>
    </div>
  );
}
