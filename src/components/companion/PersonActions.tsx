/**
 * פעולות המלווה בתיק האזרח, בשפה של לוח המלווה הקיים (libi-card).
 * בקשות פתוחות עם אישור בשלוש נגיעות, יומן ביקור, הזמנה בשם האזרח (הרשאת
 * פעולה, לא ייפוי כוח), אשפוז ושחרור, ומעבר לפגישה המשותפת ולמעקב החודשי.
 * הכל נרשם כאירוע (pilot/store) ומופיע אצל האזרח ובסנכרון לספק.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { BedDouble, CalendarPlus, ClipboardList, NotebookPen, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import type { PersonalProfile } from "@/data/types";
import type { RealService } from "@/data/realServices";
import { formatSlot } from "@/pilot/i18n";
import { he } from "@/pilot/i18n/he";
import type { VisitKind } from "@/pilot/model";
import { book, logVisit, setHospitalized, usePilot } from "@/pilot/store";
import { cancelRuleOf, isSubscription, priceOf, serviceById, sessionsPerMonth, slotsFor, walletOf } from "@/pilot/services";
import { matchServicesForCitizen } from "@/lib/matchingEngine";
import { amount } from "@/lib/wallet";
import { basketSentence } from "@/lib/basket";
import { catalogState } from "@/data/catalogSource";
import { personalRecommendations, withAnswers } from "@/lib/personalMatch";
import { appSettings } from "@/pilot/settings";
import { describe } from "@/pilot/companion/Log";
import { Decide } from "./TodayTriage";

/** הדמויות שיש להן שאלון ומעקב חודשי בהדגמה. */
const PERSONAS = new Set(["c1", "c2", "c3"]);

const VISIT_KINDS: { id: VisitKind; label: string }[] = [
  { id: "home", label: "ביקור בבית" },
  { id: "phone", label: "שיחת טלפון" },
  { id: "no_answer", label: "לא נענה" },
];

const btn = "min-h-[44px] px-4 rounded-lg text-sm font-semibold inline-flex items-center gap-2 disabled:opacity-50";
const primary = cn(btn, "bg-primary text-primary-foreground hover:opacity-90");
const outline = cn(btn, "border border-border text-foreground hover:bg-muted");

function choice(selected: boolean) {
  return cn("flex items-center gap-2 min-h-[44px] px-3 rounded-lg border cursor-pointer text-sm", selected ? "border-primary bg-accent" : "border-border");
}

function VisitPanel(props: { citizenId: string; onDone: () => void }) {
  const [kind, setKind] = useState<VisitKind | null>(null);
  const [note, setNote] = useState("");
  return (
    <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
      <h3 className="text-sm font-semibold text-foreground">תיעוד ביקור</h3>
      <div className="flex flex-wrap gap-2" role="group" aria-label="סוג הקשר">
        {VISIT_KINDS.map((k) => (
          <button key={k.id} type="button" aria-pressed={kind === k.id} className={kind === k.id ? primary : outline} onClick={() => setKind(k.id)}>
            {k.label}
          </button>
        ))}
      </div>
      <label htmlFor="visit-note" className="block text-sm font-semibold text-foreground">הערה (לא חובה)</label>
      <textarea id="visit-note" rows={2} value={note} onChange={(e) => setNote(e.target.value)} className="w-full rounded-lg border border-border bg-background p-2 text-sm" />
      <p className="text-xs text-muted-foreground">בלי פרטים רפואיים ובלי מידע מזהה. הערה קצרה על מה סוכם.</p>
      <button
        type="button"
        className={primary}
        disabled={!kind}
        onClick={() => {
          if (!kind) return;
          logVisit({ citizenId: props.citizenId, kind, note: note.trim() || undefined });
          props.onDone();
        }}
      >
        לשמור ביומן
      </button>
    </div>
  );
}

/** הרשאת פעולה: מקריאים לאזרח את הפרטים, מקבלים אישור בעל פה, והאישור נרשם עם מה שהוקרא. */
function OnBehalfPanel(props: { citizenId: string; name: string; options: RealService[]; onDone: () => void }) {
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [consent, setConsent] = useState(false);
  const s = props.options.find((x) => x.id === serviceId);
  const slot = s ? slotsFor(s)[0] ?? null : null;
  const price = s ? priceOf(s) : null;
  const rule = s ? cancelRuleOf(s) : null;
  const readBack =
    s && price
      ? [
          s.name,
          slot ? formatSlot(he, slot) : he.coordinated,
          price.unknown ? he.costUnknown(price.total) : he.costLine(price.covered, price.copay),
          rule?.noticeHours != null && rule.charged ? he.rule.notice(rule.noticeHours) : he.rule.free,
        ].join(". ")
      : "";

  return (
    <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
      <h3 className="text-sm font-semibold text-foreground">להזמין בשם {props.name}</h3>
      <p className="text-xs text-muted-foreground">הרשאת פעולה: מקריאים את הפרטים ומקבלים אישור בעל פה. האישור נרשם ביומן. זה לא ייפוי כוח.</p>
      {props.options.length === 0 ? (
        <p className="text-sm text-foreground">אין כרגע שירות מתאים שלא הוזמן. אפשר לבדוק בפגישה המשותפת.</p>
      ) : (
        <fieldset className="space-y-2">
          <legend className="text-sm font-semibold text-foreground mb-1">1. איזה שירות?</legend>
          {props.options.map((o) => (
            <label key={o.id} className={choice(serviceId === o.id)}>
              <input type="radio" name="behalf-service" checked={serviceId === o.id} onChange={() => (setServiceId(o.id), setConsent(false))} className="w-4 h-4" />
              {o.name}
            </label>
          ))}
        </fieldset>
      )}
      {s ? (
        <>
          <p className="text-sm font-semibold text-foreground">2. להקריא ל{props.name}:</p>
          <p className="text-sm p-3 rounded-lg bg-info-soft border border-border text-foreground">{readBack}</p>
          <label className={choice(consent)}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} className="w-4 h-4" />
            3. {props.name} שמע/ה את הפרטים ואישר/ה בעל פה
          </label>
          <button
            type="button"
            className={primary}
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
    </div>
  );
}

export function PersonActions({ citizen }: { citizen: PersonalProfile }) {
  const { state, derived } = usePilot();
  const [panel, setPanel] = useState<"visit" | "behalf" | "hospital" | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const first = citizen.name.split(" ")[0];
  const hospitalized = derived.hospitalized.has(citizen.id);
  const bookings = derived.bookings.filter((b) => b.citizenId === citizen.id && b.status !== "cancelled");
  const open = derived.requests.filter((r) => r.citizenId === citizen.id && r.status === "open");
  const events = state.events.filter((e) => e.citizenId === citizen.id).slice(-6).reverse();

  // הסל בשקלים: בדמות האזרחית, עם בסיס ההדגמה של החודש, כמו במסך שלה.
  // אותו ארנק כמו אצל האזרח: מהאירועים בלבד (שמור, נוצל, תמריצים).
  const wallet = walletOf(derived.bookings, derived.incentives, citizen.id);

  // אותה המלצה שהאזרח רואה: קודם מה שסיפר (לשרה: המקהלה), אחר כך תחומים אחרים.
  const options = useMemo(() => {
    const booked = new Set(bookings.map((b) => b.serviceId));
    const profile = withAnswers(citizen, derived.answers.get(citizen.id));
    const results = matchServicesForCitizen(profile, { topN: 500, minScore: 0 }).filter((r) => !booked.has(r.service.id));
    return personalRecommendations(profile, results, 6)
      .map((p) => serviceById(p.result.service.id))
      .filter((s): s is RealService => Boolean(s) && !s!.gatedByCompanion)
      .slice(0, 3);
  }, [citizen, derived, bookings]);

  const toggle = (p: typeof panel) => setPanel(panel === p ? null : p);
  const done = (text: string) => {
    setPanel(null);
    setNotice(text);
  };

  return (
    <section className="libi-card p-5 space-y-4" aria-labelledby="actions-h">
      <div className="flex items-start justify-between gap-3 flex-wrap">
        <div>
          <h2 id="actions-h" className="text-base font-semibold text-foreground">פעולות בתיק</h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            ארנק אישי: נשארו {amount(wallet.left)} מתוך {amount(wallet.total + wallet.bonus)} · שמור {amount(wallet.reserved)} · נוצל {amount(wallet.used)}. {bookings.length === 1 ? "פעילות אחת" : `${bookings.length} פעילויות`}.
          </p>
          <p className="text-xs text-muted-foreground mt-0.5">{basketSentence()}.</p>
        </div>
        {hospitalized ? <span className="text-xs font-semibold px-2 py-1 rounded-md bg-warning-soft text-warning-foreground border border-border">באשפוז: הפעילויות מוקפאות</span> : null}
      </div>

      {notice ? (
        <p role="status" className="text-sm p-3 rounded-lg bg-success-soft border border-border text-foreground">{notice}</p>
      ) : null}

      {open.length ? (
        <ul className="space-y-2" aria-label="בקשות פתוחות">
          {open.map((r) => (
            <li key={r.id} className="p-3 rounded-lg border border-destructive/30 bg-destructive-soft/40 space-y-2">
              <p className="text-sm font-semibold text-foreground">
                {r.kind === "callback" ? `${first} ביקש/ה שיחזרו` : r.kind === "claim_help" ? `עזרה בהגשה: ${r.serviceName}` : `ממתין לאישור: ${r.serviceName}`}
              </p>
              <Decide request={r} name={citizen.name} />
            </li>
          ))}
        </ul>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <button type="button" className={primary} aria-expanded={panel === "visit"} onClick={() => toggle("visit")}>
          <NotebookPen className="w-4 h-4" aria-hidden="true" /> תיעוד ביקור
        </button>
        <button type="button" className={outline} aria-expanded={panel === "behalf"} disabled={hospitalized} onClick={() => toggle("behalf")}>
          <CalendarPlus className="w-4 h-4" aria-hidden="true" /> להזמין בשמו/ה
        </button>
        <button type="button" className={outline} aria-expanded={panel === "hospital"} onClick={() => toggle("hospital")}>
          <BedDouble className="w-4 h-4" aria-hidden="true" /> {hospitalized ? "שחרור מאשפוז" : "אשפוז"}
        </button>
        {PERSONAS.has(citizen.id) ? (
          <>
            <Link to={`/coordinator/patients/${citizen.id}/session`} className={outline}>
              <Users className="w-4 h-4" aria-hidden="true" /> פגישה משותפת
            </Link>
            <Link to={`/coordinator/patients/${citizen.id}/review`} className={outline}>
              <ClipboardList className="w-4 h-4" aria-hidden="true" /> מעקב חודשי
            </Link>
          </>
        ) : null}
      </div>

      {panel === "visit" ? <VisitPanel citizenId={citizen.id} onDone={() => done("הביקור נשמר ביומן.")} /> : null}
      {panel === "behalf" ? <OnBehalfPanel citizenId={citizen.id} name={first} options={options} onDone={() => done("ההזמנה נרשמה, עם האישור בעל פה ביומן.")} /> : null}
      {panel === "hospital" ? (
        <div className="space-y-3 p-4 rounded-lg border border-border bg-muted/30">
          <h3 className="text-sm font-semibold text-foreground">{hospitalized ? "שחרור מאשפוז" : "אירוע אשפוז"}</h3>
          <p className="text-sm text-foreground">
            {hospitalized
              ? "הפעילויות שהוקפאו יחזרו לפעול."
              : `${bookings.length} פעילויות יוקפאו. לפי הכלל: בפעילות קבוצתית החזר מלא לסל, בפרטני לפי החוזה. הספקים יקבלו עדכון בסנכרון.`}
          </p>
          {!hospitalized ? <p className="text-xs font-semibold text-warning-foreground">הכלל: הצעה, ממתין להכרעה</p> : null}
          <button
            type="button"
            className={primary}
            onClick={() => {
              setHospitalized(citizen.id, !hospitalized);
              done(hospitalized ? "השחרור נרשם." : "האשפוז נרשם והפעילויות הוקפאו.");
            }}
          >
            {hospitalized ? "לרשום שחרור" : "לרשום אשפוז"}
          </button>
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">פעילויות</h3>
          {bookings.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין פעילויות פעילות.</p>
          ) : (
            <ul className="space-y-1 text-sm text-foreground">
              {bookings.map((b) => (
                <li key={b.id}>
                  {b.serviceName}: {b.slot ? formatSlot(he, b.slot) : "מועד בתיאום"}
                  {b.status === "paused" ? " (מוקפא)" : ""}
                  {b.onBehalf ? " (הוזמן בשמו/ה)" : ""}
                </li>
              ))}
            </ul>
          )}
        </div>
        <div>
          <h3 className="text-sm font-semibold text-foreground mb-2">יומן אחרון</h3>
          {events.length === 0 ? (
            <p className="text-sm text-muted-foreground">אין רישומים עדיין.</p>
          ) : (
            <ul className="space-y-1 text-sm text-foreground">
              {events.map((e) => (
                <li key={e.id}>
                  <span className="text-muted-foreground">{new Date(e.at).toLocaleDateString("he-IL")}: </span>
                  {describe(e)}
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}
