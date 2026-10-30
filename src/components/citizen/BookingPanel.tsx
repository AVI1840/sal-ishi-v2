/**
 * הזמנה מתוך דף השירות, בשפה של הכלי הקיים. שירות רציף: הצטרפות לקבוצה
 * (מנוי חודשי, אפשר לעזוב). חד-פעמי ומוצר: מועד, בדיקה ואישור, סיום.
 * המחיר, כללי הביטול והמועדים מהמנוע של 0.5 (pilot/services). ההזמנה
 * נרשמת כאירוע, ומופיעה ב"הפעילויות שלי" ובתיק אצל המלווה.
 */
import { useEffect, useRef, useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import type { RealService } from "@/data/realServices";
import { formatSlot } from "@/pilot/i18n";
import { he } from "@/pilot/i18n/he";
import { book } from "@/pilot/store";
import { isCoordinated, isProduct, isSubscription, priceLabel, priceOf, sessionsPerMonth, slotsFor } from "@/pilot/services";
import { amount } from "@/lib/wallet";
import { useOnline } from "@/pilot/components/Frame";
import { ruleText, whereText } from "@/pilot/citizen/Service";
import { useCitizen } from "@/pilot/citizen/common";

const primary = "w-full min-h-[52px] bg-[#1B3A5C] text-white rounded-xl text-lg font-bold hover:bg-[#15304d] transition-colors flex items-center justify-center gap-2 disabled:opacity-50";
const secondary = "w-full min-h-[48px] bg-white border border-[#1B3A5C] text-[#1B3A5C] rounded-xl text-base font-semibold flex items-center justify-center gap-2";

/** כותרת הצעד: מקבלת פוקוס כשהצעד נפתח, כדי שקורא המסך יודיע עליו. */
function StepTitle(props: { id: string; className: string; children: ReactNode }) {
  const ref = useRef<HTMLHeadingElement>(null);
  useEffect(() => ref.current?.focus(), []);
  return (
    <h2 id={props.id} ref={ref} tabIndex={-1} className={cn(props.className, "outline-none")}>
      {props.children}
    </h2>
  );
}

/** "כל יום ראשון בשעה 16:30": מועד קבוע בשבוע, יחסי לתאריך של היום. */
export function weeklyText(iso: string): string {
  const d = new Date(iso);
  const time = `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;
  return `כל יום ${he.weekdays[d.getDay()]} בשעה ${time}`;
}

/** הצטרפות לשירות רציף: מנוי חודשי, נשמר בהצטרפות ונוצל לפי השתתפות. */
function JoinPanel({ service }: { service: RealService }) {
  const online = useOnline();
  const { profile } = useCitizen();
  const price = priceOf(service);
  const first = slotsFor(service)[0] ?? null;
  const when = first ? weeklyText(first) : he.coordinated;
  const [step, setStep] = useState<"idle" | "confirm" | "done">("idle");

  if (step === "idle") {
    return (
      <button type="button" className={primary} onClick={() => setStep("confirm")}>
        <CalendarCheck className="w-5 h-5" aria-hidden="true" /> להצטרף לקבוצה
      </button>
    );
  }
  if (step === "done") {
    return (
      <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3" aria-labelledby="joined-title">
        <StepTitle id="joined-title" className="text-xl font-bold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6" aria-hidden="true" /> הצטרפת לקבוצה
        </StepTitle>
        <p className="text-base text-gray-900" role="status">הצטרפת ל{service.name}. {when}.</p>
        <p className="text-base text-gray-800">{amount(price.covered)} שמורות בארנק לחודש הזה, ונוצלות לפי ההשתתפות.</p>
        {!online ? <p className="text-base text-amber-900">{he.bookedOffline}</p> : null}
        <Link to="/citizen/activities" className={primary}>{he.toActivities}</Link>
        <Link to="/citizen" className={secondary}>{he.toHome}</Link>
      </section>
    );
  }
  return (
    <section className="bg-white rounded-xl p-5 border-2 border-[#1B3A5C] space-y-3" aria-labelledby="join-title">
      <StepTitle id="join-title" className="text-xl font-bold text-gray-900">לבדוק ולהצטרף</StepTitle>
      <dl className="space-y-2 text-base">
        {[
          [he.when, when],
          [he.where, whereText(he, service)],
          [he.cost, `${priceLabel(service, amount)}. נשמר בארנק בהצטרפות, ונוצל לפי ההשתתפות.`],
          ["אם רוצים לעזוב", "אפשר לעזוב בכל חודש. מה שלא נוצל חוזר לארנק."],
        ].map(([term, text]) => (
          <div key={term}>
            <dt className="text-sm text-gray-600">{term}</dt>
            <dd className="text-gray-900 font-medium">{text}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        className={primary}
        onClick={() => {
          book({
            citizenId: profile.id,
            serviceId: service.id,
            serviceName: service.name,
            slot: first,
            coveredShekel: price.covered,
            copayShekel: price.copay,
            actor: "citizen",
            mode: "subscription",
            sessionsPerMonth: sessionsPerMonth(),
          });
          setStep("done");
        }}
      >
        לאשר את ההצטרפות
      </button>
      <button type="button" className={secondary} onClick={() => setStep("idle")}>{he.back}</button>
    </section>
  );
}

export function BookingPanel({ service }: { service: RealService }) {
  if (isSubscription(service)) return <JoinPanel service={service} />;
  return <SinglePanel service={service} />;
}

function SinglePanel({ service }: { service: RealService }) {
  const online = useOnline();
  const { profile } = useCitizen();
  const slots = slotsFor(service);
  const price = priceOf(service);
  const [step, setStep] = useState<"idle" | "time" | "confirm" | "done">("idle");
  const [slot, setSlot] = useState<string | null>(null);
  const when = slot ? formatSlot(he, slot) : isProduct(service) ? he.delivered : isCoordinated(service) ? he.coordinated : "-";

  if (step === "idle") {
    return (
      <button type="button" className={primary} onClick={() => setStep(slots.length ? "time" : "confirm")}>
        <CalendarCheck className="w-5 h-5" aria-hidden="true" /> {he.book}
      </button>
    );
  }

  if (step === "done") {
    return (
      <section className="bg-emerald-50 border border-emerald-200 rounded-xl p-5 space-y-3" aria-labelledby="booked-title">
        <StepTitle id="booked-title" className="text-xl font-bold text-emerald-900 flex items-center gap-2">
          <CheckCircle2 className="w-6 h-6" aria-hidden="true" /> {he.bookedTitle}
        </StepTitle>
        <p className="text-base text-gray-900" role="status">{he.bookedText(service.name)} {when}</p>
        {!online ? <p className="text-base text-amber-900">{he.bookedOffline}</p> : null}
        {!isProduct(service) ? <p className="text-base text-gray-800">{ruleText(he, service)[0]}</p> : null}
        <Link to="/citizen/activities" className={primary}>{he.toActivities}</Link>
        <Link to="/citizen" className={secondary}>{he.toHome}</Link>
      </section>
    );
  }

  if (step === "time") {
    return (
      <section className="bg-white rounded-xl p-5 border border-gray-200 space-y-3" aria-labelledby="time-title">
        <StepTitle id="time-title" className="text-xl font-bold text-gray-900">{he.chooseTime}</StepTitle>
        <fieldset className="space-y-2">
          <legend className="sr-only">{he.chooseTime}</legend>
          {slots.map((iso) => (
            <label
              key={iso}
              className={cn(
                "flex items-center gap-3 min-h-[52px] px-4 rounded-xl border text-base cursor-pointer",
                slot === iso ? "border-[#1B3A5C] bg-[#1B3A5C]/5 font-semibold" : "border-gray-200",
              )}
            >
              <input type="radio" name="slot" value={iso} checked={slot === iso} onChange={() => setSlot(iso)} className="w-5 h-5 accent-[#1B3A5C]" />
              {formatSlot(he, iso)}
            </label>
          ))}
        </fieldset>
        <p className="text-sm text-gray-700">{he.chooseTimeHint}</p>
        <button type="button" className={primary} disabled={!slot} onClick={() => setStep("confirm")}>{he.confirmTitle}</button>
        <button type="button" className={secondary} onClick={() => setStep("idle")}>{he.back}</button>
      </section>
    );
  }

  return (
    <section className="bg-white rounded-xl p-5 border-2 border-[#1B3A5C] space-y-3" aria-labelledby="confirm-title">
      <StepTitle id="confirm-title" className="text-xl font-bold text-gray-900">{he.confirmTitle}</StepTitle>
      <dl className="space-y-2 text-base">
        {[
          [he.when, when],
          [he.where, whereText(he, service)],
          [he.cost, priceLabel(service, amount)],
          ...(!isProduct(service) ? [[he.cancelTitle, ruleText(he, service)[0]]] : []),
        ].map(([term, text]) => (
          <div key={term}>
            <dt className="text-sm text-gray-600">{term}</dt>
            <dd className="text-gray-900 font-medium">{text}</dd>
          </div>
        ))}
      </dl>
      <button
        type="button"
        className={primary}
        onClick={() => {
          book({ citizenId: profile.id, serviceId: service.id, serviceName: service.name, slot, coveredShekel: price.covered, copayShekel: price.copay, actor: "citizen" });
          setStep("done");
        }}
      >
        {he.confirm}
      </button>
      <button type="button" className={secondary} onClick={() => setStep(slots.length ? "time" : "idle")}>{he.back}</button>
    </section>
  );
}
