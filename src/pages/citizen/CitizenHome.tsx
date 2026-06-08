/**
 * CitizenHome — ממשק אזרח ותיק
 * עיצוב חם, ברור, טקסט גדול, נגיש
 * מותאם ל-65+ — פשוט, ללא עומס, מזמין
 */
import { Bell, ChevronLeft, MapPin, Phone, Wallet, CheckCircle, Clock, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { getServiceImageInfo } from "@/lib/serviceImages";
import { useShowImages } from "@/hooks/use-visual-mode";
import { CITIZENS } from "@/data/mockData";
import { matchServicesForCitizen } from "@/lib/matchingEngine";
import { useMemo } from "react";

const citizen = CITIZENS[0];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "בוקר טוב";
  if (h < 17) return "צהריים טובים";
  return "ערב טוב";
};

const SCHEDULE = [
  { day: "ג׳", date: "10.06", time: "10:00", name: "התעמלות קבוצתית", place: "מרכז ספורט מינהל קהילתי" },
  { day: "ה׳", date: "12.06", time: "11:30", name: "מועדון חברתי", place: "משה דיין 135" },
  { day: "א׳", date: "15.06", time: "09:00", name: "ביקור רונית (מלווה)", place: "ביתך" },
];

export default function CitizenHome() {
  const showImages = useShowImages();
  // ארנק רמה 2 — 32 יחידות/חודש (775₪), ניצול 71%
  const walletTotal = 32;
  const walletUsed = Math.round(walletTotal * 0.71); // 23 נוצלו
  const walletBalance = walletTotal - walletUsed;    // 9 נותרו

  const recommended = useMemo(
    () => matchServicesForCitizen(citizen, { topN: 4 }),
    []
  );

  return (
    <div className="min-h-screen bg-white" dir="rtl">

      {/* Welcome */}
      <div className="bg-[#1B3A5C] text-white px-6 pt-8 pb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <Wallet className="w-5 h-5 text-white/70" />
            <span className="text-sm font-bold text-white/90">סל אישי</span>
          </div>
          <button className="relative w-10 h-10 rounded-full bg-white/10 flex items-center justify-center" aria-label="התראות">
            <Bell className="w-5 h-5 text-white/80" />
          </button>
        </div>
        <h1 className="text-2xl font-bold">{getGreeting()}, {citizen.name.split(" ")[0]}</h1>
        <p className="text-base text-white/60 mt-1">{citizen.neighborhood} · בת {citizen.age}</p>

        {/* Wallet summary */}
        <div className="mt-6 bg-white/10 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-white/50">יחידות נותרו החודש</p>
              <p className="text-3xl font-bold">{walletBalance} <span className="text-base font-normal text-white/50">מתוך {walletTotal}</span></p>
            </div>
            <div className="text-left">
              <p className="text-sm text-white/50">שווי חודשי</p>
              <p className="text-lg font-bold text-emerald-300">775₪</p>
              <p className="text-[10px] text-white/30 mt-0.5">רמה 2</p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${Math.round((walletUsed / walletTotal) * 100)}%` }} />
          </div>
          <p className="text-xs text-white/40 mt-2">שירותי מניעה חינם 100% · חוסן ומוצרים מסובסדים 50%</p>
        </div>
      </div>

      <main className="px-6 -mt-4 space-y-6 pb-28">

        {/* Quick actions */}
        <div className="grid grid-cols-2 gap-3">
          <Link to="/citizen/services" className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-center">
            <Heart className="w-6 h-6 text-[#1B3A5C] mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-900">שירותים זמינים</p>
            <p className="text-xs text-gray-500 mt-0.5">102 שירותים</p>
          </Link>
          <Link to="/citizen/chat" className="bg-white border border-gray-200 rounded-xl p-4 shadow-sm hover:shadow-md transition-all text-center">
            <Phone className="w-6 h-6 text-[#1B3A5C] mx-auto mb-2" />
            <p className="text-sm font-bold text-gray-900">שיחה עם רונית</p>
            <p className="text-xs text-gray-500 mt-0.5">מלווה אישית</p>
          </Link>
        </div>

        {/* Recommended services — card with image */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">מומלץ עבורך</h2>
            <Link to="/citizen/services" className="text-xs text-[#1B3A5C] font-medium flex items-center gap-0.5">
              הכל <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recommended.map((result, idx) => {
              const isHero = idx === 0;
              const { image, gradient, gradientDark } = showImages
                ? getServiceImageInfo(result.service)
                : { image: undefined, gradient: "", gradientDark: "" };

              return (
                <Link
                  key={result.service.id}
                  to={`/citizen/services/${result.service.id}`}
                  className="block bg-white border border-gray-200 rounded-xl overflow-hidden hover:border-[#1B3A5C]/30 hover:shadow-sm transition-all"
                >
                  {/* ── Image mode: hero card (idx=0) or thumbnail (idx>0) ── */}
                  {showImages && isHero ? (
                    <>
                      <div className="relative h-36 w-full">
                        {image ? (
                          <img src={image} alt={result.service.name} className="w-full h-full object-cover" loading="lazy" />
                        ) : (
                          <div className={cn("w-full h-full", gradientDark)} />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/10 to-transparent" />
                        <div className="absolute top-3 left-3 w-9 h-9 rounded-full bg-white/90 backdrop-blur flex items-center justify-center border-2 border-emerald-400 shadow-sm">
                          <span className="text-xs font-bold text-gray-900">{result.totalScore}</span>
                        </div>
                        <div className="absolute bottom-3 right-4 left-4 flex items-end justify-between gap-2">
                          <h3 className="text-white font-bold text-base leading-tight drop-shadow line-clamp-1">{result.service.name}</h3>
                          <span className={cn("shrink-0 text-xs px-2.5 py-1 rounded-lg font-semibold",
                            result.service.cost === "free" ? "bg-emerald-500 text-white" : "bg-blue-500 text-white"
                          )}>
                            {result.service.cost === "free" ? "חינם" : "מסובסד"}
                          </span>
                        </div>
                      </div>
                      {result.explanations[0] && (
                        <div className="px-4 py-2.5">
                          <p className="text-xs text-[#1B3A5C] font-medium">{result.explanations[0]}</p>
                        </div>
                      )}
                    </>
                  ) : (
                    /* ── Clean mode OR thumbnail (idx>0 in image mode) ── */
                    <div className="flex items-start gap-3 p-4">
                      {/* Thumbnail — image or gradient (only in image mode) */}
                      {showImages && (
                        <div className="relative w-16 h-16 rounded-lg overflow-hidden shrink-0">
                          {image ? (
                            <img src={image} alt={result.service.name} className="w-full h-full object-cover" loading="lazy" />
                          ) : (
                            <div className={cn("w-full h-full", gradient)} />
                          )}
                          <div className="absolute bottom-0 left-0 right-0 bg-black/55 text-center py-0.5">
                            <span className="text-[9px] text-white font-bold">{result.totalScore}</span>
                          </div>
                        </div>
                      )}
                      {/* Score circle — clean mode only */}
                      {!showImages && (
                        <div className="shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold"
                          style={{
                            borderColor: result.totalScore >= 80 ? "#22c55e" : result.totalScore >= 60 ? "#f59e0b" : "#d1d5db",
                            color: result.totalScore >= 80 ? "#16a34a" : result.totalScore >= 60 ? "#d97706" : "#6b7280",
                          }}>
                          {result.totalScore}
                        </div>
                      )}
                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h3 className="text-sm font-bold text-gray-900 leading-tight line-clamp-1">{result.service.name}</h3>
                          <span className={cn("shrink-0 text-[10px] px-2 py-0.5 rounded font-semibold",
                            result.service.cost === "free" ? "bg-emerald-50 text-emerald-700" : "bg-blue-50 text-blue-700"
                          )}>
                            {result.service.cost === "free" ? "חינם" : "מסובסד"}
                          </span>
                        </div>
                        <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{result.service.provider}</p>
                        <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                          <span className="flex items-center gap-1 text-xs text-gray-400">
                            <MapPin className="w-3 h-3" />{result.service.neighborhood}
                          </span>
                          {result.service.days && (
                            <span className="flex items-center gap-1 text-xs text-gray-400">
                              <Clock className="w-3 h-3" />{result.service.days}
                            </span>
                          )}
                        </div>
                        {/* Why recommended — clean mode: show here */}
                        {!showImages && result.explanations[0] && (
                          <div className="mt-2.5 p-2 bg-[#1B3A5C]/5 rounded-lg border border-[#1B3A5C]/10">
                            <p className="text-xs text-[#1B3A5C] font-medium">{result.explanations[0]}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </Link>
              );
            })}
          </div>
        </div>

        {/* Schedule */}
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-3">לוח הפעילויות שלך</h2>
          <div className="space-y-2">
            {SCHEDULE.map((item, i) => (
              <div key={i} className="bg-white border border-gray-200 rounded-xl p-4 flex items-center gap-4">
                <div className="shrink-0 w-14 text-center bg-gray-50 rounded-lg py-2">
                  <p className="text-xs text-gray-500">יום {item.day}</p>
                  <p className="text-sm font-bold text-[#1B3A5C]">{item.date}</p>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {item.time} · {item.place}
                  </p>
                </div>
                <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0" />
              </div>
            ))}
          </div>
        </div>

        {/* Contact */}
        <Link
          to="/citizen/chat"
          className="block bg-[#1B3A5C] rounded-xl p-5 text-white"
        >
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-base font-bold">צריכה עזרה? דברי איתנו</p>
              <p className="text-sm text-white/60 mt-0.5">רונית, המלווה שלך, זמינה עכשיו</p>
            </div>
          </div>
        </Link>

        {/* Emergency */}
        <div className="flex items-center justify-center gap-4 pt-2">
          <a href="tel:*6050" className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
            <Phone className="w-4 h-4" /> *6050
          </a>
          <a href="tel:106" className="flex items-center gap-1.5 px-4 py-2.5 bg-gray-100 rounded-lg text-sm font-medium text-gray-700">
            <Phone className="w-4 h-4" /> עירייה 106
          </a>
        </div>
      </main>
    </div>
  );
}
