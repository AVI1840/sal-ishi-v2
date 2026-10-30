/**
 * CitizenActivities: "הפעילויות שלי", בשפה של הכלי הקיים.
 * ההזמנות והבקשות למלווה נגזרות מהאירועים (pilot/store). ביטול מציג את
 * הכלל לפני האישור: בזמן, הכסף חוזר לסל. מאוחר, בשירות שמחייב, לא חוזר.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { CalendarCheck, CheckCircle2, Clock, PauseCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSlot } from "@/pilot/i18n";
import { he } from "@/pilot/i18n/he";
import { cancelBooking, usePilot } from "@/pilot/store";
import { lateCancelCharged, serviceById, usedOf } from "@/pilot/services";
import { amount } from "@/lib/wallet";
import { weeklyText } from "@/components/citizen/BookingPanel";
import ServiceRating from "@/components/shared/ServiceRating";
import type { Booking } from "@/pilot/model";
import { useCitizen } from "@/pilot/citizen/common";

const BADGE = {
  booked: { cls: "bg-emerald-50 text-emerald-800 border-emerald-200", Icon: CheckCircle2 },
  paused: { cls: "bg-amber-50 text-amber-900 border-amber-200", Icon: PauseCircle },
  cancelled: { cls: "bg-gray-100 text-gray-700 border-gray-200", Icon: XCircle },
  open: { cls: "bg-amber-50 text-amber-900 border-amber-200", Icon: Clock },
  approved: { cls: "bg-emerald-50 text-emerald-800 border-emerald-200", Icon: CheckCircle2 },
  rejected: { cls: "bg-red-50 text-red-800 border-red-200", Icon: XCircle },
  done: { cls: "bg-gray-100 text-gray-700 border-gray-200", Icon: CheckCircle2 },
} as const;

function StatusBadge({ status, text }: { status: keyof typeof BADGE; text?: string }) {
  const { cls, Icon } = BADGE[status];
  return (
    <span className={cn("inline-flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-lg border", cls)}>
      <Icon className="w-4 h-4" aria-hidden="true" /> {text ?? he.status[status]}
    </span>
  );
}

const primary = "w-full min-h-[52px] bg-[#1B3A5C] text-white rounded-xl text-lg font-bold flex items-center justify-center gap-2";
const secondary = "w-full min-h-[48px] bg-white border border-[#1B3A5C] text-[#1B3A5C] rounded-xl text-base font-semibold flex items-center justify-center gap-2";

function BookingCard({ b }: { b: Booking }) {
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<{ charged: boolean; refund: number } | null>(null);
  const sub = b.mode === "subscription";
  // עזיבת קבוצה לא מחויבת: מה שנוצל נשאר, השאר חוזר. בחד-פעמי: לפי כלל הביטול.
  const charged = sub ? false : lateCancelCharged(b, serviceById(b.serviceId));
  const used = usedOf(b);
  const reserved = Math.max(0, b.coveredShekel - used);
  const attended = b.attendedSessions ?? 0;

  return (
    <li className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div className="flex items-start gap-3">
        <CalendarCheck className="w-6 h-6 text-[#1B3A5C] shrink-0 mt-0.5" aria-hidden="true" />
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900">{b.serviceName}</h3>
          <p className="text-base text-gray-700 mt-0.5">{b.slot ? (sub ? weeklyText(b.slot) : formatSlot(he, b.slot)) : he.coordinated}</p>
          <p className="text-sm text-gray-700 mt-0.5">
            {sub ? `${amount(b.coveredShekel)} בחודש` : amount(b.coveredShekel)}
            {b.copayShekel ? ` + ₪${b.copayShekel} ממך` : ""}
            {b.status !== "cancelled" ? ` · שמור ${amount(reserved)} · נוצל ${amount(used)}` : ""}
          </p>
          {attended > 0 ? (
            <p className="text-sm text-emerald-800 mt-0.5">
              {sub ? `${attended === 1 ? "השתתפת במפגש אחד" : `השתתפת ב-${attended} מפגשים`} מתוך ${b.sessionsPerMonth ?? 4} החודש.` : "השתתפת."}
            </p>
          ) : null}
        </div>
      </div>
      <StatusBadge status={b.status} text={sub && b.status === "booked" ? "פעיל" : undefined} />
      {b.status === "paused" ? <p className="text-base text-gray-800">{he.hospitalized}</p> : null}

      {/* דירוג: רק אחרי השתתפות */}
      {attended > 0 && b.status !== "cancelled" ? <ServiceRating serviceId={b.serviceId} serviceName={b.serviceName} /> : null}

      {result ? (
        <p role="status" className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-base text-emerald-950">
          {sub ? "עזבת את הקבוצה." : `${he.cancelledTitle}.`} {result.charged ? he.cancelledNoRefund : result.refund > 0 ? he.cancelledRefund(result.refund) : ""}
        </p>
      ) : b.status === "booked" && !asking ? (
        <button type="button" className={secondary} onClick={() => setAsking(true)} aria-label={`${sub ? "לעזוב את הקבוצה" : he.cancel}: ${b.serviceName}`}>
          {sub ? "לעזוב את הקבוצה" : he.cancel}
        </button>
      ) : b.status === "booked" && asking ? (
        <div className="space-y-2" role="group" aria-label={sub ? `לעזוב את ${b.serviceName}?` : he.cancelAsk(b.serviceName)}>
          <p className="text-base font-bold text-gray-900">{sub ? `לעזוב את ${b.serviceName}?` : he.cancelAsk(b.serviceName)}</p>
          <p className={cn("p-3 rounded-lg border text-base", charged ? "bg-amber-50 border-amber-200 text-amber-950" : "bg-blue-50 border-blue-200 text-gray-900")}>
            {sub ? `מה שנוצל נשאר נוצל. ${amount(reserved)} חוזרות לארנק.` : charged ? he.cancelLate : he.cancelFree}
          </p>
          <button
            type="button"
            className="w-full min-h-[52px] bg-red-700 text-white rounded-xl text-lg font-bold"
            onClick={() => {
              cancelBooking({ citizenId: b.citizenId, bookingId: b.id, charged, reason: sub ? "left_group" : charged ? "late" : "on_time", actor: "citizen" });
              setResult({ charged, refund: reserved });
            }}
          >
            {sub ? "כן, לעזוב" : he.cancelYes}
          </button>
          <button type="button" className={secondary} onClick={() => setAsking(false)}>{sub ? "לא, להישאר" : he.cancelNo}</button>
        </div>
      ) : null}
    </li>
  );
}

export default function CitizenActivities() {
  const { derived } = usePilot();
  const { profile } = useCitizen();
  const bookings = derived.bookings
    .filter((b) => b.citizenId === profile.id)
    .sort((a, b) => Number(a.status === "cancelled") - Number(b.status === "cancelled") || (a.slot ?? a.createdAt).localeCompare(b.slot ?? b.createdAt));
  const requests = derived.requests.filter((r) => r.citizenId === profile.id).reverse();

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="bg-[#1B3A5C] text-white px-6 pt-6 pb-8">
        <div className="flex items-center gap-2 mb-5">
          <CalendarCheck className="w-5 h-5 text-white/80" aria-hidden="true" />
          <span className="text-base font-bold text-white">סל אישי</span>
        </div>
        <h1 className="text-3xl font-bold">{he.activitiesTitle}</h1>
        <p className="text-lg text-white/85 mt-1">{he.upcoming}</p>
      </div>

      <main id="main" tabIndex={-1} className="px-6 pt-5 space-y-6 pb-6" data-read>
        <section aria-labelledby="upcoming-title">
          <h2 id="upcoming-title" className="sr-only">{he.upcoming}</h2>
          {bookings.length === 0 ? (
            <div className="space-y-3">
              <p className="text-base text-gray-700">{he.noActivities}</p>
              <Link to="/citizen/services" className={primary}>{he.findService}</Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {bookings.map((b) => <BookingCard key={b.id} b={b} />)}
            </ul>
          )}
        </section>

        {requests.length > 0 && (
          <section aria-labelledby="requests-title">
            <h2 id="requests-title" className="text-xl font-bold text-gray-900 mb-3">{he.requestsTitle}</h2>
            <ul className="space-y-3">
              {requests.map((r) => (
                <li key={r.id} className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
                  <h3 className="text-base font-bold text-gray-900">
                    {r.kind === "callback" ? he.callbackRequest : r.kind === "claim_help" ? `${he.claimHelp}: ${r.serviceName ?? ""}` : he.gatedRequest(r.serviceName ?? "")}
                  </h3>
                  <StatusBadge status={r.status} />
                  {r.status === "rejected" ? (
                    <>
                      {r.reason ? <p className="text-base text-gray-800">{he.rejectedWhy(r.reason)}</p> : null}
                      <p className="text-base text-gray-800">{he.rejectedNext}</p>
                    </>
                  ) : null}
                  {r.status === "approved" && r.kind === "gated_service" && r.serviceId ? (
                    <>
                      <p className="text-base text-gray-800">{he.approvedNext}</p>
                      <Link to={`/citizen/services/${encodeURIComponent(r.serviceId)}`} className={primary} aria-label={`${he.book}: ${r.serviceName}`}>
                        {he.book}
                      </Link>
                    </>
                  ) : null}
                </li>
              ))}
            </ul>
          </section>
        )}
      </main>
    </div>
  );
}
