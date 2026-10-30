import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { BedDouble, CalendarPlus, NotebookPen } from "lucide-react";
import { CITIZENS } from "@/data/mockData";
import type { RealService } from "@/data/realServices";
import { reasonsFor, triage } from "../caseload";
import { Alert, useTitle } from "../components/Frame";
import { formatSlot, STRINGS } from "../i18n";
import type { VisitKind } from "../model";
import { book, logVisit, setHospitalized, usePilot } from "../store";
import { cancelRuleOf, priceOf, recommend, servicesFor, slotsFor } from "../services";
import { useCaseload } from "./CompanionShell";
import { BucketBadge, DecisionPanel, ReasonChip } from "./parts";
import { EventList } from "./Log";

const VISIT_KINDS: { id: VisitKind; label: string }[] = [
  { id: "home", label: "ביקור בבית" },
  { id: "phone", label: "שיחת טלפון" },
  { id: "no_answer", label: "לא נענה" },
];

const he = STRINGS.he;

/** יומן ביקור: סוג בנגיעה, הערה קצרה אם רוצים, ושמירה. */
function VisitPanel(props: { citizenId: string; onDone: () => void }) {
  const [kind, setKind] = useState<VisitKind | null>(null);
  const [note, setNote] = useState("");
  return (
    <section className="p-card" aria-labelledby="visit-h">
      <h2 id="visit-h">תיעוד ביקור</h2>
      <div className="p-tabs" role="group" aria-label="סוג הקשר">
        {VISIT_KINDS.map((k) => (
          <button key={k.id} type="button" aria-pressed={kind === k.id} onClick={() => setKind(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      <label htmlFor="visit-note" style={{ fontWeight: 600 }}>
        הערה (לא חובה)
      </label>
      <textarea id="visit-note" className="p-input" rows={2} value={note} onChange={(e) => setNote(e.target.value)} />
      <p className="p-muted p-small">בלי פרטים רפואיים ובלי מידע מזהה. הערה קצרה על מה סוכם.</p>
      <button
        type="button"
        className="p-btn p-btn--primary"
        disabled={!kind}
        onClick={() => {
          if (!kind) return;
          logVisit({ citizenId: props.citizenId, kind, note: note.trim() || undefined });
          props.onDone();
        }}
      >
        לשמור ביומן
      </button>
    </section>
  );
}

/**
 * הזמנה בשם האזרח: "הרשאת פעולה", לא ייפוי כוח. המלווה מקריאה לאזרח את
 * הפרטים, האזרח מאשר בעל פה, והאישור נרשם ביומן עם מה שהוקרא.
 */
function OnBehalfPanel(props: { citizenId: string; name: string; options: RealService[]; onDone: () => void }) {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const s = props.options.find((x) => x.id === serviceId);
  const slot = s ? slotsFor(s)[0] ?? null : null;
  const price = s ? priceOf(s) : null;
  const rule = s ? cancelRuleOf(s) : null;
  const readBack = s && price
    ? [
        s.name,
        slot ? formatSlot(he, slot) : he.coordinated,
        price.unknown ? he.costUnknown(price.total) : he.costLine(price.covered, price.copay),
        rule?.noticeHours != null && rule.charged ? he.rule.notice(rule.noticeHours) : he.rule.free,
      ].join(". ")
    : "";

  return (
    <section className="p-card" aria-labelledby="behalf-h">
      <h2 id="behalf-h">להזמין בשם {props.name}</h2>
      <p className="p-muted p-small">הרשאת פעולה: מקריאים את הפרטים ומקבלים אישור בעל פה. האישור נרשם ביומן. זה לא ייפוי כוח.</p>
      <fieldset className="p-choices">
        <legend style={{ fontSize: "1em" }}>1. איזה שירות?</legend>
        {props.options.map((o) => (
          <label key={o.id} className="p-choice">
            <input type="radio" name="behalf-service" checked={serviceId === o.id} onChange={() => (setServiceId(o.id), setConsent(false))} />
            {o.name}
          </label>
        ))}
      </fieldset>
      {s ? (
        <>
          <div className="p-stack" style={{ gap: "0.35em" }}>
            <p style={{ fontWeight: 600 }}>2. להקריא ל{props.name}:</p>
            <p className="p-alert p-alert--info">{readBack}</p>
          </div>
          <label className="p-choice">
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
            3. {props.name} שמע/ה את הפרטים ואישר/ה בעל פה
          </label>
          <button
            type="button"
            className="p-btn p-btn--primary"
            disabled={!consent}
            onClick={() => {
              if (!price) return;
              book({
                citizenId: props.citizenId,
                serviceId: s.id,
                serviceName: s.name,
                slot,
                coveredShekel: price.covered,
                copayShekel: price.copay,
                actor: "companion",
                onBehalf: { consent: "verbal", readBack, confirmedAt: new Date().toISOString() },
              });
              props.onDone();
            }}
          >
            להזמין ולתעד את האישור
          </button>
        </>
      ) : null}
    </section>
  );
}

export default function CompanionPerson() {
  const { id = "" } = useParams();
  const { derived } = usePilot();
  const people = useCaseload();
  const person = people.find((p) => p.id === id);
  const [panel, setPanel] = useState<"visit" | "behalf" | "hospital" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  useTitle(person?.name ?? "תיק");

  const options = useMemo(() => {
    if (!person) return [];
    const profile = CITIZENS.find((c) => c.id === person.id);
    const booked = new Set(derived.bookings.filter((b) => b.citizenId === person.id && b.status !== "cancelled").map((b) => b.serviceId));
    if (profile) return recommend(profile, derived.interests.get(profile.id) ?? [], booked).filter((s) => !s.gatedByCompanion).slice(0, 3);
    return servicesFor(person.neighborhood).filter((s) => !booked.has(s.id) && !s.gatedByCompanion).slice(0, 3);
  }, [person, derived]);

  if (!person) {
    return (
      <>
        <h1>לא נמצא בתיק</h1>
        <Link to="/companion/caseload" className="p-btn p-btn--secondary">לכל התיק</Link>
      </>
    );
  }

  const item = triage([person], derived)[0];
  const reasons = reasonsFor(person, derived);
  const hospitalized = derived.hospitalized.has(person.id);
  const bookings = derived.bookings.filter((b) => b.citizenId === person.id && b.status !== "cancelled");
  const openRequests = derived.requests.filter((r) => r.citizenId === person.id && r.status === "open");
  const done = (text: string) => {
    setPanel(null);
    setNotice(text);
  };

  return (
    <>
      <div className="p-person">
        <div>
          <h1>{person.name}</h1>
          <p className="p-muted">
            {person.age}, {person.neighborhood}, שפה: {person.language}. קשר אחרון לפני {person.lastContactDays} ימים.
          </p>
        </div>
        <BucketBadge bucket={item.bucket} />
      </div>
      {notice ? (
        <Alert tone="success" live>
          <p>{notice}</p>
        </Alert>
      ) : null}

      {reasons.length ? (
        <section className="p-card" aria-labelledby="why-h">
          <h2 id="why-h">למה לפנות</h2>
          <ul className="p-stack" style={{ listStyle: "none", padding: 0, margin: 0, gap: "0.4em" }}>
            {reasons.map((r) => (
              <li key={r.rule + (r.request?.id ?? "")} className="p-row">
                <ReasonChip reason={r} bucket={item.bucket} />
                <span>{r.text}</span>
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      {openRequests.map((r) => (
        <section key={r.id} className="p-card p-card--accent" aria-label="בקשה פתוחה">
          <h2>{r.kind === "callback" ? "ביקש/ה שיחזרו אליו/ה" : `ממתין לאישור: ${r.serviceName}`}</h2>
          <DecisionPanel request={r} personName={person.name} />
        </section>
      ))}

      {["c1", "c2", "c3"].includes(person.id) ? (
        <div className="p-row">
          <Link to={`/companion/session/${person.id}`} className="p-btn p-btn--primary">
            פגישה משותפת: שאלון והמלצות
          </Link>
          <Link to={`/companion/review/${person.id}`} className="p-btn p-btn--secondary">
            מעקב חודשי
          </Link>
        </div>
      ) : null}

      <div className="p-row">
        <button type="button" className="p-btn p-btn--primary" aria-expanded={panel === "visit"} onClick={() => setPanel(panel === "visit" ? null : "visit")}>
          <NotebookPen aria-hidden="true" size={18} />
          תיעוד ביקור
        </button>
        <button type="button" className="p-btn p-btn--secondary" aria-expanded={panel === "behalf"} disabled={hospitalized} onClick={() => setPanel(panel === "behalf" ? null : "behalf")}>
          <CalendarPlus aria-hidden="true" size={18} />
          להזמין בשמו/ה
        </button>
        <button type="button" className="p-btn p-btn--ghost" aria-expanded={panel === "hospital"} onClick={() => setPanel(panel === "hospital" ? null : "hospital")}>
          <BedDouble aria-hidden="true" size={18} />
          {hospitalized ? "שחרור מאשפוז" : "אשפוז"}
        </button>
      </div>

      {panel === "visit" ? <VisitPanel citizenId={person.id} onDone={() => done("הביקור נשמר ביומן.")} /> : null}
      {panel === "behalf" ? <OnBehalfPanel citizenId={person.id} name={person.name} options={options} onDone={() => done("ההזמנה נרשמה, עם האישור בעל פה ביומן.")} /> : null}
      {panel === "hospital" ? (
        <section className="p-card" aria-labelledby="hosp-h">
          <h2 id="hosp-h">{hospitalized ? "שחרור מאשפוז" : "אירוע אשפוז"}</h2>
          <p>
            {hospitalized
              ? "הפעילויות שהוקפאו יחזרו לפעול."
              : `${bookings.length} פעילויות יוקפאו. לפי הכלל: בפעילות קבוצתית החזר מלא לסל, בפרטני לפי החוזה. הספקים יקבלו עדכון בסנכרון.`}
          </p>
          {!hospitalized ? <p className="p-badge p-badge--wait">הכלל: הצעה, ממתין להכרעה</p> : null}
          <button
            type="button"
            className="p-btn p-btn--primary"
            onClick={() => {
              setHospitalized(person.id, !hospitalized);
              done(hospitalized ? "השחרור נרשם." : "האשפוז נרשם והפעילויות הוקפאו.");
            }}
          >
            {hospitalized ? "לרשום שחרור" : "לרשום אשפוז"}
          </button>
        </section>
      ) : null}

      {bookings.length ? (
        <section className="p-card" aria-labelledby="bk-h">
          <h2 id="bk-h">פעילויות</h2>
          <ul className="p-stack" style={{ paddingInlineStart: "1.2em", margin: 0 }}>
            {bookings.map((b) => (
              <li key={b.id}>
                {b.serviceName}: {b.slot ? formatSlot(he, b.slot) : "מועד בתיאום"}
                {b.status === "paused" ? " (מוקפא)" : ""}
                {b.onBehalf ? " (הוזמן בשמו/ה)" : ""}
              </li>
            ))}
          </ul>
        </section>
      ) : null}

      <section className="p-stack" aria-labelledby="hist-h">
        <h2 id="hist-h">יומן</h2>
        <EventList citizenId={person.id} />
      </section>
    </>
  );
}
