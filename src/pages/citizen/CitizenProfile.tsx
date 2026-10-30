/**
 * CitizenProfile: "הפרופיל שלי".
 *
 * מה שהאזרחית רואה על עצמה: מה חשוב לה (והעדכון שלו), הארנק, ההרשמות ואיש קשר.
 * בלי רמת סיכון, מוכנות, חסמים, ציונים ואחוזים: אלה כלים של המלווה, ונמצאים בתיק.
 * העדפות שמתעדכנות כאן ממשיכות להזין את מנוע ההמלצות הקיים, בלי שינוי בכללים.
 */
import { Phone, MapPin, Heart, Wallet, Calendar, ChevronLeft, Sparkles } from "lucide-react";
import { Link } from "react-router-dom";
import { MOTIVATION_LABELS } from "@/data/types";
import { WalletSummary } from "@/components/citizen/WalletSummary";
import { he } from "@/pilot/i18n/he";
import { usePilot } from "@/pilot/store";
import { useCitizen } from "@/pilot/citizen/common";
import { nextSession } from "@/pilot/citizen/myServices";

/** שמות התחומים שבחרה, בשפת האזרח (כמו בנושאים בשוק). */
const DOMAIN_LABEL: Record<string, string> = {
  belonging: "שייכות ומשמעות",
  health_function: "בריאות ותנועה",
  resilience: "חוסן ותמיכה",
  digital: "טלפון ומחשב",
  prevention_products: "בטיחות בבית",
  qol: "איכות חיים",
};

export default function CitizenProfile() {
  const { derived } = usePilot();
  const { profile: citizen, interests } = useCitizen();
  const active = derived.bookings.filter((b) => b.citizenId === citizen.id && b.status !== "cancelled");
  const upcoming = active.filter((b) => nextSession(b)).length;

  return (
    <div className="min-h-screen bg-gray-50 pb-6" dir="rtl">
      <div className="bg-[#1B3A5C] text-white px-6 pt-6 pb-6">
        <div className="flex items-center gap-4">
          <span className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold shrink-0" aria-hidden="true">
            {citizen.name.charAt(0)}
          </span>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">הפרופיל שלי</h1>
            <p className="text-lg text-white/90">{citizen.name}</p>
            <p className="text-base text-white/85 flex items-center gap-1.5">
              <MapPin className="w-4 h-4" aria-hidden="true" /> {citizen.neighborhood}, {citizen.city} · {citizen.language}
            </p>
          </div>
        </div>
      </div>

      <main id="main" tabIndex={-1} className="px-4 sm:px-6 pt-5 space-y-5" data-read>
        {/* מה חשוב לי: ההעדפות שמזינות את ההמלצות */}
        <section className="bg-white rounded-2xl p-5 border border-gray-200 shadow-sm" aria-labelledby="matter-h">
          <h2 id="matter-h" className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-6 h-6 text-rose-700" aria-hidden="true" /> מה חשוב לי
          </h2>
          <p className="text-base text-gray-700 mt-1">ממה שסיפרת לנו ולמלווה. ההמלצות בשוק מתחילות מכאן.</p>
          {citizen.dream ? (
            <p className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-100 text-base text-gray-900">
              <span className="font-semibold">החלום שלי:</span> {citizen.dream}
            </p>
          ) : null}
          <div className="flex flex-wrap gap-2 mt-3">
            {citizen.motivations.map((m) => (
              <span key={m} className="px-3 py-1.5 bg-[#1B3A5C]/5 text-[#1B3A5C] rounded-full text-base font-medium border border-[#1B3A5C]/15">
                {MOTIVATION_LABELS[m]}
              </span>
            ))}
            {interests.map((d) => (
              <span key={d} className="px-3 py-1.5 bg-emerald-50 text-emerald-900 rounded-full text-base font-medium border border-emerald-200">
                {DOMAIN_LABEL[d] ?? d}
              </span>
            ))}
          </div>
          <Link to="/citizen/needs" className="mt-4 w-full min-h-[52px] bg-[#1B3A5C] text-white rounded-xl text-lg font-bold flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5" aria-hidden="true" /> לעדכן מה חשוב לי
          </Link>
        </section>

        <section className="bg-white rounded-2xl p-5 border border-gray-200" aria-labelledby="wallet-h">
          <h2 id="wallet-h" className="text-xl font-bold text-gray-900 flex items-center gap-2 mb-3">
            <Wallet className="w-5 h-5 text-[#1B3A5C]" aria-hidden="true" /> הארנק שלך לחודש {he.monthNames[new Date().getMonth()]}
          </h2>
          <WalletSummary tone="light" />
        </section>

        <Link to="/citizen/activities" className="bg-white rounded-2xl p-5 border border-gray-200 flex items-center gap-3 hover:border-[#1B3A5C]/40">
          <Calendar className="w-6 h-6 text-[#1B3A5C] shrink-0" aria-hidden="true" />
          <span className="flex-1">
            <span className="block text-xl font-bold text-gray-900">השירותים שלי</span>
            <span className="block text-base text-gray-700">
              {active.length ? `${active.length} הרשמות, ${upcoming} עם מפגש קרוב` : he.noActivities}
            </span>
          </span>
          <ChevronLeft className="w-5 h-5 text-gray-600" aria-hidden="true" />
        </Link>

        <section className="bg-white rounded-2xl p-5 border border-gray-200" aria-labelledby="sos-h">
          <h2 id="sos-h" className="text-xl font-bold text-gray-900 mb-3">איש קשר לחירום</h2>
          <div className="flex items-center justify-between gap-2 p-3 border border-gray-200 rounded-xl">
            <div>
              <p className="text-base font-medium text-gray-900">אורי רוזנברג</p>
              <p className="text-base text-gray-700">בן · 050-0000000</p>
            </div>
            <a href="tel:050-0000000" className="min-h-[44px] flex items-center gap-1.5 px-4 bg-[#1B3A5C] text-white rounded-xl text-base font-semibold">
              <Phone className="w-4 h-4" aria-hidden="true" /> חייג
            </a>
          </div>
        </section>
      </main>
    </div>
  );
}
