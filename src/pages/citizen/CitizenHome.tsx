/**
 * CitizenHome - ממשק אזרח ותיק
 * עיצוב חם, ברור, טקסט גדול, נגיש. מותאם ל-65+: פשוט, בלי עומס, מזמין.
 *
 * 0.5 מאוחד: הארנק בשקלים מההגדרות (500 לחודש), ההשתתפות לפי המדרגות, עד 3
 * המלצות עם "למה", הפעילויות מההזמנות, ודרך למלווה בכל מסך.
 */
import { useMemo } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, MapPin, Phone, Search, Heart, CalendarCheck, Clock, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";
import { getServiceImageInfo } from "@/lib/serviceImages";
import { useShowImages } from "@/hooks/use-visual-mode";
import { PersonalReasonCard } from "@/components/shared/PersonalReasonCard";
import { catalogState } from "@/data/catalogSource";
import { matchServicesForCitizen, type MatchResult } from "@/lib/matchingEngine";
import { usePilot } from "@/pilot/store";
import { formatSlot } from "@/pilot/i18n";
import { he } from "@/pilot/i18n/he";
import { useCitizen, usePersonalProfile, useWallet } from "@/pilot/citizen/common";
import { personalRecommendations } from "@/lib/personalMatch";
import { amount, walletFootnote } from "@/lib/wallet";
import { priceOf, serviceById } from "@/pilot/services";

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "בוקר טוב";
  if (h < 17) return "צהריים טובים";
  return "ערב טוב";
};

/** התווית על כרטיס ההמלצה: כמה זה עולה מהארנק, ומה ממך (אם יש). */
export function copayBadge(result: MatchResult): { text: string; tone: "free" | "part" } {
  const s = serviceById(result.service.id);
  if (!s) return { text: "", tone: "free" };
  const price = priceOf(s);
  if (price.state !== "none" && price.state !== "missing") return { text: "השלמה למממן אחר", tone: "part" };
  if (price.unknown) return { text: "המחיר בבדיקה", tone: "part" };
  return price.copay === 0 ? { text: amount(price.covered), tone: "free" } : { text: `${amount(price.covered)} + ₪${price.copay} ממך`, tone: "part" };
}

export default function CitizenHome() {
  const showImages = useShowImages();
  const { state, derived } = usePilot();
  const { profile: citizen, firstName } = useCitizen();
  const wallet = useWallet();
  const month = he.monthNames[new Date().getMonth()];
  const usedPct = wallet.total ? Math.round((wallet.used / wallet.total) * 100) : 0;

  // מה שחשוב לה קודם: ההמלצה הראשונה ממה שסיפרה (החלום, מה שהיא אוהבת), כל אחת מתחום אחר.
  const personal = usePersonalProfile();
  const picks = useMemo(
    () => personalRecommendations(personal, matchServicesForCitizen(personal, { topN: 500, minScore: 0, walletLeft: wallet.left * (catalogState.seed.settings.points_per_shekel || 1) }), 3),
    [personal, wallet.left],
  );
  const recommended = picks.map((p) => p.result);
  const reasonOf = (id: string) => picks.find((p) => p.result.service.id === id)?.reason;
  const activities = derived.bookings
    .filter((b) => b.citizenId === citizen.id && b.status !== "cancelled")
    .sort((a, b) => (a.slot ?? a.createdAt).localeCompare(b.slot ?? b.createdAt))
    .slice(0, 3);

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* Welcome + wallet */}
      <div className="bg-[#1B3A5C] text-white px-6 pt-6 pb-10">
        <div className="flex items-center gap-2 mb-5">
          <Wallet className="w-5 h-5 text-white/80" aria-hidden="true" />
          <span className="text-base font-bold text-white">סל אישי</span>
        </div>
        <h1 className="text-3xl font-bold" tabIndex={-1}>{getGreeting()}, {firstName}</h1>
        <p className="text-lg text-white/85 mt-1">{citizen.neighborhood} · בת {citizen.age}</p>

        <div className="mt-6 bg-white/10 rounded-xl p-4" aria-labelledby="wallet-title">
          <p id="wallet-title" className="text-base text-white/90">הארנק שלך לחודש {month}</p>
          <p className="text-4xl font-bold mt-1">
            נשארו {amount(wallet.left)} <span className="text-lg font-normal text-white/85">מתוך {amount(wallet.total)}</span>
          </p>
          <div className="mt-3 h-3 bg-white/25 rounded-full overflow-hidden" role="img" aria-label={he.walletUsedBar(wallet.used, wallet.total)}>
            <div className="h-full bg-white rounded-full" style={{ width: `${usedPct}%` }} />
          </div>
          {wallet.left === 0 ? <p className="text-base font-semibold text-white mt-2" role="status">{he.walletEmpty}</p> : null}
          <p className="text-sm text-white/85 mt-2">{he.walletRenews} בכל שירות כתוב כמה הוא עולה.</p>
          <p className="text-xs text-white/80 mt-1">{walletFootnote()}</p>
        </div>
      </div>

      <main id="main" tabIndex={-1} className="px-6 -mt-4 space-y-6 pb-6" data-read>

        {/* One primary action, two secondary */}
        <div className="space-y-3">
          <Link to="/citizen/services" className="flex items-center justify-center gap-3 min-h-[56px] bg-[#1B3A5C] text-white rounded-xl px-5 text-lg font-bold shadow-md hover:bg-[#15304b] transition-colors">
            <Search className="w-6 h-6" aria-hidden="true" />
            למצוא חוג או שירות
          </Link>
          <div className="grid grid-cols-2 gap-3">
            <Link to="/citizen/profile" className="flex flex-col items-center justify-center gap-1 min-h-[72px] bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all text-center">
              <Heart className="w-6 h-6 text-[#1B3A5C]" aria-hidden="true" />
              <span className="text-base font-bold text-gray-900">לספר מה חשוב לי</span>
            </Link>
            <a href="#help" className="flex flex-col items-center justify-center gap-1 min-h-[72px] bg-white border border-gray-200 rounded-xl p-3 shadow-sm hover:shadow-md transition-all text-center"
              onClick={(e) => { e.preventDefault(); document.getElementById("help")?.scrollIntoView({ behavior: "smooth" }); }}>
              <Phone className="w-6 h-6 text-[#1B3A5C]" aria-hidden="true" />
              <span className="text-base font-bold text-gray-900">לדבר עם המלווה</span>
            </a>
          </div>
        </div>

        {/* Recommended services: card with image, up to 3 */}
        <section aria-labelledby="rec-title">
          <div className="flex items-center justify-between mb-3">
            <h2 id="rec-title" className="text-xl font-bold text-gray-900">מומלץ עבורך</h2>
            <Link to="/citizen/services" className="min-h-[48px] inline-flex items-center text-base text-[#1B3A5C] font-semibold gap-0.5 px-2">
              עוד <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          {state.simulation.noServices ? (
            <div className="bg-white border border-gray-200 rounded-xl p-5 space-y-2" role="status">
              <h3 className="text-lg font-bold text-gray-900">{he.noServicesTitle}</h3>
              <p className="text-base text-gray-800">{he.noServicesText}</p>
            </div>
          ) : (
          <div className="space-y-3">
            {recommended.map((result, idx) => {
              const isHero = idx === 0;
              const badge = copayBadge(result);
              const { image, gradient, gradientDark } = showImages
                ? getServiceImageInfo(result.service)
                : { image: undefined, gradient: "", gradientDark: "" };

              return (
                <Link
                  key={result.service.id}
                  to={`/citizen/services/${result.service.id}`}
                  className="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#1B3A5C]/30 hover:shadow-sm transition-all"
                >
                  {showImages && isHero ? (
                    <>
                      <div className="relative h-40 w-full">
                        {image ? (
                          <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className={cn("w-full h-full", gradientDark)} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
                        <div className="absolute bottom-3 right-4 left-4 flex items-end justify-between gap-2">
                          <h3 className="text-white font-bold text-lg leading-tight drop-shadow line-clamp-2">{result.service.name}</h3>
                          <span className={cn("shrink-0 text-sm px-2.5 py-1 rounded-lg font-semibold", badge.tone === "free" ? "bg-emerald-700 text-white" : "bg-[#1B3A5C] text-white")}>
                            {badge.text}
                          </span>
                        </div>
                      </div>
                      <div className="px-4 pb-3 pt-1">
                        <PersonalReasonCard result={result} firstName={firstName} reason={reasonOf(result.service.id)} showLayers={false} />
                      </div>
                    </>
                  ) : (
                    <div className="flex items-start gap-3 p-4">
                      {showImages && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                          {image ? <img src={image} alt="" className="w-full h-full object-cover" loading="lazy" /> : <div className={cn("w-full h-full", gradient)} />}
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-base font-bold text-gray-900 leading-tight">{result.service.name}</h3>
                          <span className={cn("shrink-0 text-sm px-2 py-0.5 rounded font-semibold", badge.tone === "free" ? "bg-emerald-50 text-emerald-800" : "bg-blue-50 text-[#1B3A5C]")}>
                            {badge.text}
                          </span>
                        </div>
                        <p className="flex items-center gap-1 text-sm text-gray-600 mt-1">
                          <MapPin className="w-4 h-4" aria-hidden="true" />{result.service.neighborhood}
                        </p>
                        <div className="mt-2">
                          <PersonalReasonCard result={result} firstName={firstName} reason={reasonOf(result.service.id)} showLayers={false} />
                        </div>
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
          )}
        </section>

        {/* Schedule from bookings */}
        <section aria-labelledby="sched-title">
          <div className="flex items-center justify-between mb-3">
            <h2 id="sched-title" className="text-xl font-bold text-gray-900">לוח הפעילויות שלך</h2>
            <Link to="/citizen/activities" className="min-h-[48px] inline-flex items-center text-base text-[#1B3A5C] font-semibold gap-0.5 px-2">
              {he.toActivity} <ChevronLeft className="w-4 h-4" aria-hidden="true" />
            </Link>
          </div>
          {activities.length === 0 ? (
            <p className="text-base text-gray-700">עוד אין לך פעילויות. אפשר למצוא חוג או שירות.</p>
          ) : (
            <div className="space-y-2">
              {activities.map((b) => (
                <div key={b.id} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                  <CalendarCheck className="w-6 h-6 text-[#1B3A5C] shrink-0" aria-hidden="true" />
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-bold text-gray-900">{b.serviceName}</p>
                    <p className="text-sm text-gray-600 mt-0.5 flex items-center gap-1">
                      <Clock className="w-4 h-4" aria-hidden="true" /> {b.slot ? formatSlot(he, b.slot) : he.coordinated}
                    </p>
                  </div>
                  {b.status === "paused" ? <span className="text-sm font-semibold text-amber-800 bg-amber-50 px-2 py-1 rounded">מוקפא</span> : null}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* "שיחזרו אליי" והמוקד: בכרטיס העזרה שב-MobileShell, בכל מסך */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <a href="tel:106" className="flex items-center gap-1.5 px-4 min-h-[48px] bg-gray-100 rounded-lg text-base font-medium text-gray-800">
            <Phone className="w-4 h-4" aria-hidden="true" /> עירייה 106
          </a>
        </div>
      </main>
    </div>
  );
}
