import { useState } from "react";
import { CheckCircle2, CloudOff, Download, RefreshCw } from "lucide-react";
import { downloadBytes, todayStamp } from "@sal-ishi/ui";
import { formatSlot, STRINGS } from "../i18n";
import { amount } from "@/lib/wallet";
import type { PilotEvent } from "../model";
import { useOnline, useTitle } from "../components/Frame";
import { pendingSync, usePilot } from "../store";
import { eventsFile, syncAdapterName, syncNow } from "../sync";
import { usePersonName } from "./CompanionShell";

const ACTOR = { citizen: "האזרח/ית", companion: "המלווה", system: "המערכת" } as const;
const VISIT = { home: "ביקור בבית", phone: "שיחת טלפון", no_answer: "לא נענה" } as const;
const DECISION = { approved: "אושר", rejected: "לא אושר", done: "טופל" } as const;
export const INCENTIVE = { volunteer: "התנדבות בקהילה", teach: "הדרכת חוג או הרצאה", persistence: "התמדה", goal: "עמידה ביעד אישי" } as const;
export const ROLE = { volunteer: "התנדבות", teach: "הדרכת חוג או הרצאה" } as const;

export function describe(e: PilotEvent): string {
  switch (e.type) {
    case "booking.created":
      return e.mode === "subscription"
        ? `הצטרפות: ${e.serviceName}. ${amount(e.coveredShekel)} בחודש מהארנק${e.copayShekel ? `, השתתפות ₪${e.copayShekel}` : ""}.`
        : `הזמנה: ${e.serviceName}${e.slot ? `, ${formatSlot(STRINGS.he, e.slot)}` : ""}. ${amount(e.coveredShekel)} מהארנק${e.copayShekel ? `, השתתפות ₪${e.copayShekel}` : ""}.`;
    case "attendance.reported":
      return e.sessions === 1 ? "הספק דיווח על השתתפות במפגש." : `הספק דיווח על השתתפות ב-${e.sessions} מפגשים.`;
    case "incentive.granted":
      return `תמריץ: ${amount(e.points)} על ${INCENTIVE[e.reason]}${e.note ? ` (${e.note})` : ""}.`;
    case "incentive.eligibility":
      return e.roles.length ? `סומן/ה כמתאים/ה ל${e.roles.map((r) => ROLE[r]).join(" ול")}.` : "הסימון לתמריצים הוסר.";
    case "booking.cancelled":
      return `ביטול הזמנה${e.charged ? " (מאוחר, מחויב)" : " (בלי חיוב)"}.`;
    case "request.created":
      return e.kind === "callback" ? `בקשה: שיחזרו אליי${e.note ? ` (${e.note})` : ""}.` : e.kind === "claim_help" ? `בקשה לעזרה בהגשה: ${e.serviceName}${e.note ? ` (${e.note})` : ""}.` : `בקשה לשירות מותנה: ${e.serviceName}.`;
    case "request.decided":
      return `החלטה: ${DECISION[e.decision]}. סיבה: ${e.reason}.`;
    case "visit.logged":
      return `${VISIT[e.kind]}${e.note ? `: ${e.note}` : ""}.`;
    case "hospitalization.started":
      return "אשפוז נרשם. הפעילויות הוקפאו.";
    case "hospitalization.ended":
      return "שחרור מאשפוז נרשם.";
    case "needs.updated":
      return e.answers ? "שאלון משותף: עודכנו רצונות, יכולות ומגבלות." : "עודכן מה חשוב לאזרח/ית.";
    case "review.logged":
      return `מעקב חודשי: ${e.serviceId}, ${e.verdict === "worked" ? "עבד" : e.verdict === "partly" ? "עבד חלקית" : "להחליף"}.`;
  }
}

export function EventList(props: { citizenId?: string }) {
  const { state } = usePilot();
  const nameOf = usePersonName();
  const events = state.events.filter((e) => !props.citizenId || e.citizenId === props.citizenId).slice().reverse();
  if (!events.length) return <p className="p-muted">עוד אין רישומים.</p>;
  return (
    <ul className="p-list">
      {events.map((e) => (
        <li key={e.id} className="p-card" style={{ gap: "0.35em" }}>
          <p className="p-row p-small p-muted">
            <span>{new Date(e.at).toLocaleString("he-IL", { dateStyle: "short", timeStyle: "short" })}</span>
            <span>{ACTOR[e.actor]}</span>
            {!props.citizenId ? <span>{nameOf(e.citizenId)}</span> : null}
            {e.synced ? (
              <span className="p-badge p-badge--ok">
                <CheckCircle2 aria-hidden="true" size={14} />
                נשלח
              </span>
            ) : (
              <span className="p-badge p-badge--wait">
                <CloudOff aria-hidden="true" size={14} />
                ממתין
              </span>
            )}
          </p>
          <p>{describe(e)}</p>
          {e.onBehalf ? (
            <p className="p-small">
              <strong>בשם האזרח/ית, אישור בעל פה.</strong> הוקרא: {e.onBehalf.readBack}
            </p>
          ) : null}
        </li>
      ))}
    </ul>
  );
}

export default function CompanionLog() {
  const { state } = usePilot();
  const online = useOnline();
  const [msg, setMsg] = useState<string | null>(null);
  useTitle("יומן");
  const pending = pendingSync(state).length;

  return (
    <>
      <h1>יומן וסנכרון</h1>
      <section className="p-card" aria-labelledby="sync-h">
        <h2 id="sync-h">סנכרון</h2>
        <p>
          {pending ? `${pending} רישומים ממתינים.` : "כל הרישומים נשלחו."} חיבור: {syncAdapterName()}.
        </p>
        <div className="p-row">
          <button
            type="button"
            className="p-btn p-btn--primary"
            disabled={!online || !pending}
            onClick={async () => setMsg(`נשלחו ${await syncNow()} רישומים.`)}
          >
            <RefreshCw aria-hidden="true" size={18} />
            לסנכרן עכשיו
          </button>
          <button
            type="button"
            className="p-btn p-btn--secondary"
            onClick={() => downloadBytes(`אירועי_פיילוט_${todayStamp()}.json`, new TextEncoder().encode(JSON.stringify(eventsFile(state.events), null, 2)), "application/json")}
          >
            <Download aria-hidden="true" size={18} />
            להוריד קובץ אירועים
          </button>
        </div>
        {!online ? <p className="p-muted">אין חיבור. הסנכרון ירוץ לבד כשהחיבור יחזור.</p> : null}
        {msg ? <p role="status">{msg}</p> : null}
        <p className="p-muted p-small">הקובץ לפי schema/pilot/pilot-events-1.0.schema.json. ספק שמחבר מערכת מקבל את אותם אירועים דרך PilotSyncAdapter.</p>
      </section>
      <section className="p-stack" aria-labelledby="all-h">
        <h2 id="all-h">כל הרישומים</h2>
        <EventList />
      </section>
    </>
  );
}
