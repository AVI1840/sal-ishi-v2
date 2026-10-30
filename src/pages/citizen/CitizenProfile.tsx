/**
 * CitizenProfile: פרופיל אישי.
 *
 * מה שהאזרחית רואה על עצמה: מה חשוב לה, הסל, הפעילויות ואיש קשר. בלי רמת
 * סיכון, מוכנות, חסמים, ציונים ואחוזים: אלה כלים של המלווה, ונמצאים בתיק.
 * 0.5 מאוחד: הסל בשקלים (כמו בבית), והפעילויות מההזמנות, במקום ארנק
 * היחידות ורשימת הפעילויות הקבועה.
 */
import { Phone, MapPin, Heart, Wallet, Calendar, ChevronLeft, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { MOTIVATION_LABELS } from "@/data/types";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { WalletSummary } from "@/components/citizen/WalletSummary";
import { formatSlot } from "@/pilot/i18n";
import { he } from "@/pilot/i18n/he";
import { usePilot } from "@/pilot/store";
import { useCitizen, useWallet } from "@/pilot/citizen/common";

export default function CitizenProfile() {
  const { derived } = usePilot();
  const { profile: citizen } = useCitizen();
  const wallet = useWallet();
  const bookings = derived.bookings
    .filter((b) => b.citizenId === citizen.id && b.status !== "cancelled")
    .sort((a, b) => (a.slot ?? a.createdAt).localeCompare(b.slot ?? b.createdAt))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-gray-50 pb-6" dir="rtl">

      {/* Header: חזרה מימין, כי כלי הנגישות יושבים בפינה השמאלית העליונה */}
      <header className="sticky top-10 z-30 bg-white border-b border-gray-200 px-5 h-14 flex items-center gap-3">
        <Link to="/citizen" aria-label="חזרה לבית" className="w-11 h-11 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
          <ChevronLeft className="w-5 h-5 text-gray-700 rotate-180" aria-hidden="true" />
        </Link>
        <h1 className="text-base font-bold text-gray-900">הפרופיל שלי</h1>
      </header>

      <main id="main" tabIndex={-1} className="px-5 pt-5 space-y-4" data-read>

        {/* Identity card */}
        <div className="bg-[#1B3A5C] rounded-xl p-5 text-white">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-white/20 flex items-center justify-center text-xl font-bold">
              {citizen.name.charAt(0)}
            </div>
            <div className="flex-1">
              <h2 className="text-lg font-bold">{citizen.name}</h2>
              <p className="text-sm text-white/70 mt-0.5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5" /> {citizen.city} · בת {citizen.age}
              </p>
              <p className="text-xs text-white/80 mt-1">{citizen.familyStatus} · {citizen.language}</p>
            </div>
          </div>
          <p className="mt-4 pt-4 border-t border-white/10 text-sm text-white/90">
            {bookings.length ? `${bookings.length} פעילויות קרובות` : "עוד אין פעילויות קרובות"}
          </p>
        </div>

        {/* הסל בשקלים, כמו בבית */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-[#1B3A5C]" aria-hidden="true" />
            <h2 className="text-base font-semibold text-gray-900">הארנק שלך לחודש {he.monthNames[new Date().getMonth()]}</h2>
          </div>
          <WalletSummary tone="light" />
        </div>

        {/* Motivations */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-[#1B3A5C]" />
            <h2 className="text-base font-semibold text-gray-900">מה חשוב לי</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {citizen.motivations.map((m) => (
              <span key={m} className="px-3 py-1.5 bg-[#1B3A5C]/5 text-[#1B3A5C] rounded-lg text-xs font-medium border border-[#1B3A5C]/10">
                {MOTIVATION_LABELS[m]}
              </span>
            ))}
          </div>
          {citizen.dream && (
            <div className="mt-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
              <p className="text-xs text-gray-600 mb-1">המטרה האישית</p>
              <p className="text-sm text-gray-700">{citizen.dream}</p>
            </div>
          )}
        </div>

        {/* פעילויות קרובות: מההזמנות */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1B3A5C]" aria-hidden="true" />
              <h2 className="text-base font-semibold text-gray-900">פעילויות קרובות</h2>
            </div>
            <Link to="/citizen/activities" className="min-h-[44px] text-sm text-[#1B3A5C] font-semibold hover:underline flex items-center gap-0.5">
              {he.activitiesTitle} <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          {bookings.length === 0 ? (
            <p className="text-base text-gray-700">{he.noActivities}</p>
          ) : (
            <div className="space-y-2">
              {bookings.map((b) => (
                <div key={b.id} className="flex items-center justify-between gap-2 p-3 bg-gray-50 rounded-lg border border-gray-100">
                  <div>
                    <p className="text-base font-medium text-gray-900">{b.serviceName}</p>
                    <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5" aria-hidden="true" /> {b.slot ? formatSlot(he, b.slot) : he.coordinated}
                    </p>
                  </div>
                  {b.status === "booked" ? (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200 shrink-0">
                      <CheckCircle className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                      <span className="text-sm text-emerald-800">{he.status.booked}</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200 shrink-0">
                      <Clock className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
                      <span className="text-sm text-amber-900">{he.status[b.status]}</span>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Emergency */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">איש קשר לחירום</h2>
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">אורי רוזנברג</p>
              <p className="text-sm text-gray-700">בן · 050-0000000</p>
            </div>
            <a href="tel:050-0000000"
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1B3A5C] text-white rounded-lg text-xs font-medium hover:bg-[#15304d] transition-colors">
              <Phone className="w-3.5 h-3.5" /> חייג
            </a>
          </div>
        </div>

      </main>
    </div>
  );
}
