/**
 * CitizenActivities: "השירותים שלי". מקום אחד לכל מה שהאזרחית בחרה: הקרוב אליה
 * (עם תזכורת), ההצטרפויות שלה, מה שממתין לאישור המלווה, וההיסטוריה והמימושים.
 * הכל נגזר מהאירועים (pilot/store), בלי מצבים חדשים: בקשה שממתינה לא מוצגת
 * כמאושרת. ביטול מציג את הכלל לפני האישור: בזמן, הנקודות חוזרות לארנק. מאוחר,
 * בשירות שמחייב, לא חוזרות.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Bell, BellOff, CalendarCheck, CalendarPlus, CheckCircle2, Clock, History, Hourglass, MapPin, PauseCircle, Wallet, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { formatSlot } from "@/pilot/i18n";
import { he } from "@/pilot/i18n/he";
import { cancelBooking, usePilot } from "@/pilot/store";
import { attendedIn, lateCancelCharged, monthOf, serviceById, usedOf } from "@/pilot/services";
import { amount } from "@/lib/wallet";
import { weeklyText } from "@/components/citizen/BookingPanel";
import ServiceRating from "@/components/shared/ServiceRating";
import type { Booking } from "@/pilot/model";
import { useCitizen } from "@/pilot/citizen/common";
import { whereText } from "@/pilot/citizen/Service";
import { WalletSummary } from "@/components/citizen/WalletSummary";
import { icsHref, nextSession, useReminders, whenWords } from "@/pilot/citizen/myServices";

const BADGE = {
  booked: { cls: "bg-emerald-50 text-emerald-800 border-emerald-200", Icon: CheckCircle2 },
  paused: { cls: "bg-amber-50 text-amber-900 border-amber-200", Icon: PauseCircle },
  cancelled: { cls: "bg-gray-100 text-gray-700 border-gray-200", Icon: XCircle },
  open: { cls: "bg-amber-50 text-amber-900 border-amber-200", Icon: Hourglass },
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

/** איפה: מהקטלוג (בשכונה, בבית, מרחוק), ומי נותן. */
function placeOf(b: Booking): string {
  const s = serviceById(b.serviceId);
  return s ? `${whereText(he, s)} · ${s.provider}` : "";
}

function whenOf(b: Booking): string {
  if (!b.slot) return he.coordinated;
  return b.mode === "subscription" ? weeklyText(b.slot) : formatSlot(he, b.slot);
}

/** תזכורת למפגש הבא, והוספה ליומן בטלפון. */
function ReminderControls({ b }: { b: Booking }) {
  const [reminders, toggle] = useReminders();
  const at = nextSession(b);
  if (!at) return null;
  const on = reminders.has(b.id);
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
      <button
        type="button"
        aria-pressed={on}
        onClick={() => toggle(b.id)}
        className={cn("min-h-[48px] rounded-xl border text-base font-semibold flex items-center justify-center gap-2", on ? "bg-emerald-700 border-emerald-700 text-white" : "bg-white border-[#1B3A5C] text-[#1B3A5C]")}
        aria-label={on ? `לבטל תזכורת: ${b.serviceName}` : `להזכיר לי יום לפני: ${b.serviceName}`}
      >
        {on ? <Bell className="w-5 h-5" aria-hidden="true" /> : <BellOff className="w-5 h-5" aria-hidden="true" />}
        {on ? "תזכורת פעילה" : "להזכיר לי יום לפני"}
      </button>
      <a
        href={icsHref(b.serviceName, placeOf(b), at, b.mode === "subscription")}
        download={`${b.serviceName}.ics`}
        className="min-h-[48px] rounded-xl border border-gray-300 bg-white text-gray-900 text-base font-semibold flex items-center justify-center gap-2"
      >
        <CalendarPlus className="w-5 h-5" aria-hidden="true" /> להוסיף ליומן בטלפון
      </a>
    </div>
  );
}

function BookingCard({ b, onCancelled }: { b: Booking; onCancelled: (id: string) => void }) {
  const [asking, setAsking] = useState(false);
  const [result, setResult] = useState<{ charged: boolean; refund: number } | null>(null);
  const sub = b.mode === "subscription";
  // עזיבת קבוצה לא מחויבת: מה שנוצל נשאר, השאר חוזר. בחד-פעמי: לפי כלל הביטול.
  const charged = sub ? false : lateCancelCharged(b, serviceById(b.serviceId));
  const used = usedOf(b);
  const reserved = Math.max(0, b.coveredShekel - used);
  // במנוי: המפגשים של החודש. הדירוג נפתח אחרי השתתפות כלשהי.
  const attended = sub ? attendedIn(b, monthOf(new Date())) : b.attendedSessions ?? 0;
  const everAttended = (b.attendedSessions ?? 0) > 0;
  const next = nextSession(b);

  return (
    <li className="bg-white border border-gray-200 rounded-2xl p-4 space-y-3 shadow-sm">
      <div className="flex items-start gap-3">
        <span className="w-11 h-11 rounded-full bg-emerald-50 text-emerald-800 flex items-center justify-center shrink-0">
          <CalendarCheck className="w-6 h-6" aria-hidden="true" />
        </span>
        <div className="flex-1 min-w-0">
          <h3 className="text-lg font-bold text-gray-900">{b.serviceName}</h3>
          <p className="text-base text-gray-800 mt-0.5 flex items-start gap-1.5">
            <Clock className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" /> {whenOf(b)}
          </p>
          {placeOf(b) ? (
            <p className="text-base text-gray-800 mt-0.5 flex items-start gap-1.5">
              <MapPin className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" /> {placeOf(b)}
            </p>
          ) : null}
          <p className="text-base text-gray-800 mt-0.5 flex items-start gap-1.5">
            <Wallet className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" />
            <span>
              {sub ? `${amount(b.coveredShekel)} בחודש` : amount(b.coveredShekel)}
              {b.copayShekel ? ` + ₪${b.copayShekel} ממך` : ""}
              {b.status !== "cancelled" ? ` · שמור ${amount(reserved)} · נוצל ${amount(used)}` : ""}
            </span>
          </p>
          {attended > 0 ? (
            <p className="text-sm text-emerald-800 mt-0.5">
              {sub ? `${attended === 1 ? "השתתפת במפגש אחד" : `השתתפת ב-${attended} מפגשים`} מתוך ${b.sessionsPerMonth ?? 4} החודש.` : "השתתפת."}
            </p>
          ) : null}
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <StatusBadge status={b.status} text={sub && b.status === "booked" ? "פעיל" : b.status === "booked" ? "הרשמה פעילה" : undefined} />
        {next ? <span className="text-sm text-gray-700">המפגש הבא {whenWords(next)}</span> : null}
      </div>
      {b.status === "paused" ? <p className="text-base text-gray-800">{he.hospitalized}</p> : null}

      {b.status === "booked" && !result ? <ReminderControls b={b} /> : null}

      {/* דירוג: רק אחרי השתתפות */}
      {everAttended && b.status !== "cancelled" ? <ServiceRating serviceId={b.serviceId} serviceName={b.serviceName} /> : null}

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
              onCancelled(b.id);
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

const SECTIONS = [
  { id: "soon", label: "קרוב" },
  { id: "mine", label: "הרשמות" },
  { id: "pending", label: "ממתין לאישור" },
  { id: "history", label: "היסטוריה" },
] as const;

export default function CitizenActivities() {
  const { derived } = usePilot();
  const { profile } = useCitizen();
  const [reminders] = useReminders();
  // מה שבוטל עכשיו נשאר בכרטיס שלו עם הודעת הביטול, עד שעוזבים את המסך.
  const [justCancelled, setJustCancelled] = useState<string[]>([]);
  const now = new Date();
  const mine = derived.bookings.filter((b) => b.citizenId === profile.id);
  const active = mine
    .filter((b) => b.status !== "cancelled" || justCancelled.includes(b.id))
    .sort((a, b) => (a.slot ?? a.createdAt).localeCompare(b.slot ?? b.createdAt));
  const soon = mine
    .map((b) => ({ b, at: nextSession(b, now) }))
    .filter((x): x is { b: Booking; at: Date } => !!x.at)
    .sort((a, b) => a.at.getTime() - b.at.getTime());
  const requests = derived.requests.filter((r) => r.citizenId === profile.id).reverse();
  const pending = requests.filter((r) => r.status === "open" || (r.status === "approved" && r.kind === "gated_service"));
  const decided = requests.filter((r) => !pending.includes(r));
  const cancelled = mine.filter((b) => b.status === "cancelled" && !justCancelled.includes(b.id));
  const usedTotal = mine.reduce((n, b) => n + usedOf(b), 0);
  // תזכורת שמופיעה כאן: מפגש עם תזכורת שמתקיים היום או מחר.
  const due = soon.filter((x) => reminders.has(x.b.id) && x.at.getTime() - now.getTime() < 2 * 24 * 60 * 60 * 1000);
  const count = { soon: soon.length, mine: active.length, pending: pending.length, history: cancelled.length + decided.length };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-[#1B3A5C] text-white px-6 pt-6 pb-6">
        <h1 className="text-3xl font-bold">השירותים שלי</h1>
        <p className="text-lg text-white/90 mt-1">מה מחכה לך, מה ממתין, ומה כבר נוצל.</p>
        <nav aria-label="בדף הזה" className="grid grid-cols-2 sm:grid-cols-4 gap-2 mt-4">
          {SECTIONS.map((s) => (
            <a
              key={s.id}
              href={`#${s.id}`}
              onClick={(e) => {
                e.preventDefault();
                document.getElementById(s.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="min-h-[56px] rounded-xl bg-white/10 hover:bg-white/20 px-3 py-2 flex flex-col justify-center"
            >
              <span className="text-2xl font-bold leading-none">{count[s.id]}</span>
              <span className="text-sm text-white/90">{s.label}</span>
            </a>
          ))}
        </nav>
      </div>

      <main id="main" tabIndex={-1} className="px-4 sm:px-6 pt-5 space-y-8 pb-6" data-read>
        {due.length ? (
          <div role="status" className="bg-emerald-50 border border-emerald-300 rounded-2xl p-4 space-y-1">
            {due.map(({ b, at }) => (
              <p key={b.id} className="text-lg text-emerald-950 flex items-start gap-2">
                <Bell className="w-6 h-6 shrink-0" aria-hidden="true" />
                <span>
                  <span className="font-bold">תזכורת:</span> {b.serviceName}, {whenWords(at, now)} {formatSlot(he, at.toISOString())}.
                </span>
              </p>
            ))}
          </div>
        ) : null}

        <section id="soon" aria-labelledby="soon-h" className="scroll-mt-4 space-y-3">
          <h2 id="soon-h" className="text-2xl font-bold text-gray-900">הקרוב אליי</h2>
          {soon.length === 0 ? (
            <p className="text-base text-gray-700">אין מפגש קבוע בשבוע הקרוב.</p>
          ) : (
            <ol className="space-y-2">
              {soon.map(({ b, at }) => (
                <li key={b.id} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-center gap-3">
                  <span className="w-16 shrink-0 text-center rounded-xl bg-[#1B3A5C] text-white py-2">
                    <span className="block text-sm">{he.weekdays[at.getDay()]}</span>
                    <span className="block text-2xl font-bold leading-none">{at.getDate()}</span>
                  </span>
                  <span className="flex-1 min-w-0">
                    <span className="block text-lg font-bold text-gray-900 leading-tight">{b.serviceName}</span>
                    <span className="block text-base text-gray-800">
                      {whenWords(at, now)}, {String(at.getHours()).padStart(2, "0")}:{String(at.getMinutes()).padStart(2, "0")} · {placeOf(b)}
                    </span>
                  </span>
                  {reminders.has(b.id) ? (
                    <span className="text-sm font-semibold text-emerald-800 inline-flex items-center gap-1 shrink-0">
                      <Bell className="w-4 h-4" aria-hidden="true" /> תזכורת
                    </span>
                  ) : null}
                </li>
              ))}
            </ol>
          )}
        </section>

        <section id="mine" aria-labelledby="mine-h" className="scroll-mt-4 space-y-3">
          <h2 id="mine-h" className="text-2xl font-bold text-gray-900">ההרשמות שלי</h2>
          {active.length === 0 ? (
            <div className="space-y-3">
              <p className="text-base text-gray-700">{he.noActivities}</p>
              <Link to="/citizen" className={primary}>{he.findService}</Link>
            </div>
          ) : (
            <ul className="space-y-3">
              {active.map((b) => <BookingCard key={b.id} b={b} onCancelled={(id) => setJustCancelled((x) => [...x, id])} />)}
            </ul>
          )}
        </section>

        <section id="pending" aria-labelledby="pending-h" className="scroll-mt-4 space-y-3">
          <h2 id="pending-h" className="text-2xl font-bold text-gray-900">בקשות למלווה וממתין לאישור</h2>
          {pending.length === 0 ? (
            <p className="text-base text-gray-700">אין בקשות פתוחות.</p>
          ) : (
            <ul className="space-y-3">
              {pending.map((r) => (
                <li key={r.id} className="bg-white border border-gray-200 rounded-2xl p-4 space-y-2">
                  <h3 className="text-lg font-bold text-gray-900">
                    {r.kind === "callback" ? he.callbackRequest : r.kind === "claim_help" ? `${he.claimHelp}: ${r.serviceName ?? ""}` : he.gatedRequest(r.serviceName ?? "")}
                  </h3>
                  <StatusBadge status={r.status} />
                  {r.status === "open" && r.kind === "gated_service" ? <p className="text-base text-gray-800">ההרשמה עוד לא אושרה. כשהמלווה תאשר, אפשר יהיה להזמין, והנקודות יישמרו רק אז.</p> : null}
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
          )}
        </section>

        <section id="history" aria-labelledby="history-h" className="scroll-mt-4 space-y-3">
          <h2 id="history-h" className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <History className="w-6 h-6 text-[#1B3A5C]" aria-hidden="true" /> היסטוריה ומימושים
          </h2>
          <div className="bg-white border border-gray-200 rounded-2xl p-4">
            <p className="text-base text-gray-800 mb-2">עד עכשיו נוצלו {amount(usedTotal)} מהארנק, לפי דיווחי הנוכחות של הספקים.</p>
            <WalletSummary tone="light" />
          </div>
          {cancelled.length + decided.length === 0 ? (
            <p className="text-base text-gray-700">עוד אין היסטוריה.</p>
          ) : (
            <ul className="space-y-2">
              {cancelled.map((b) => (
                <li key={b.id} className="bg-white border border-gray-200 rounded-xl p-4 flex flex-wrap items-center justify-between gap-2">
                  <span>
                    <span className="block text-base font-bold text-gray-900">{b.serviceName}</span>
                    <span className="block text-sm text-gray-700">{whenOf(b)}{usedOf(b) ? ` · נוצל ${amount(usedOf(b))}` : ""}</span>
                  </span>
                  <StatusBadge status="cancelled" text={b.mode === "subscription" ? "עזבת" : undefined} />
                </li>
              ))}
              {decided.map((r) => (
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
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
