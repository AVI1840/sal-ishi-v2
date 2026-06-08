/**
 * CitizenHome — ממשק אזרח ותיק
 * עיצוב חם, ברור, טקסט גדול, נגיש
 * מותאם ל-65+ — פשוט, ללא עומס, מזמין
 */
import { Bell, Calendar, ChevronLeft, MapPin, Phone, Wallet, CheckCircle, Clock, Heart } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CITIZENS } from "@/data/mockData";
import { matchServicesForCitizen, type MatchResult } from "@/lib/matchingEngine";
import { MOTIVATION_LABELS } from "@/data/types";
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
  const walletBalance = 480; // מתוך 640 סה"כ
  const walletTotal = 640;

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
              <p className="text-sm text-white/50">יתרת סל</p>
              <p className="text-3xl font-bold">{walletBalance} <span className="text-base font-normal text-white/50">יחידות</span></p>
            </div>
            <div className="text-left">
              <p className="text-sm text-white/50">שימוש</p>
              <p className="text-lg font-bold">{Math.round(((walletTotal - walletBalance) / walletTotal) * 100)}%</p>
            </div>
          </div>
          <div className="mt-3 h-2 bg-white/20 rounded-full overflow-hidden">
            <div className="h-full bg-white rounded-full" style={{ width: `${Math.round((walletBalance / walletTotal) * 100)}%` }} />
          </div>
          <p className="text-xs text-white/40 mt-2">שירותי מניעה — ללא עלות. המדינה ממנת 100%</p>
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

        {/* Recommended services */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-900">מומלץ עבורך</h2>
            <Link to="/citizen/services" className="text-xs text-[#1B3A5C] font-medium flex items-center gap-0.5">
              הכל <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-3">
            {recommended.map((result) => (
              <Link
                key={result.service.id}
                to={`/citizen/services/${result.service.id}`}
                className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-[#1B3A5C]/30 hover:shadow-sm transition-all"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h3 className="text-base font-bold text-gray-900">{result.service.name}</h3>
                  <span className={cn("shrink-0 text-xs px-2.5 py-1 rounded-lg font-semibold",
                    result.service.cost === "free" ? "bg-emerald-50 text-emerald-700" :
                    "bg-blue-50 text-blue-700"
                  )}>
                    {result.service.cost === "free" ? "חינם" : "מסובסד"}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{result.service.provider}</p>
                <div className="flex items-center gap-3 mt-2 text-xs text-gray-400">
                  <span className="flex items-center gap-1"><MapPin className="w-3.5 h-3.5" /> {result.service.neighborhood}</span>
                  {result.service.days && <span className="flex items-center gap-1"><Clock className="w-3.5 h-3.5" /> {result.service.days}</span>}
                </div>
                {/* Why recommended */}
                {result.explanations[0] && (
                  <div className="mt-3 p-2.5 bg-[#1B3A5C]/5 rounded-lg border border-[#1B3A5C]/10">
                    <p className="text-xs text-[#1B3A5C] font-medium">{result.explanations[0]}</p>
                  </div>
                )}
              </Link>
            ))}
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
