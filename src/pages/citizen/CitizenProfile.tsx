/**
 * CitizenProfile — פרופיל אישי
 * מקצועי, מדויק, מרשים
 */
import { User, Phone, MapPin, Heart, Wallet, Target, Calendar, Sparkles, ChevronLeft, CheckCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { CITIZENS } from "@/data/mockData";
import { BARRIER_LABELS, MOTIVATION_LABELS, READINESS_LABELS } from "@/data/types";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { cn } from "@/lib/utils";

const citizen = CITIZENS[0];

const BOOKINGS = [
  { id: 1, name: "התעמלות קבוצתית", date: "12.06.26", time: "10:00", status: "confirmed" },
  { id: 2, name: "חוג ציור", date: "14.06.26", time: "14:00", status: "confirmed" },
  { id: 3, name: "ביקור בית — רונית לוי", date: "18.06.26", time: "09:00", status: "pending" },
];

const RISK_LEVEL_MAP = {
  low:      { label: "נמוך",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium:   { label: "בינוני",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  high:     { label: "גבוה",    cls: "bg-orange-50 text-orange-700 border-orange-200" },
  critical: { label: "קריטי",   cls: "bg-red-50 text-red-700 border-red-200" },
};

export default function CitizenProfile() {
  const total = 640;
  const balance = 480;
  const used = total - balance;
  const risk = RISK_LEVEL_MAP[citizen.riskLevel];

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-5 h-14 flex items-center justify-between">
        <h1 className="text-sm font-bold text-gray-900">הפרופיל שלי</h1>
        <Link to="/citizen" className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
          <ChevronLeft className="w-4 h-4 text-gray-500 rotate-180" />
        </Link>
      </header>

      <main className="px-5 pt-5 space-y-4">

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
              <p className="text-xs text-white/50 mt-1">{citizen.familyStatus} · {citizen.language}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-3 gap-3 pt-4 border-t border-white/10">
            <div className="text-center">
              <p className="text-lg font-bold">{citizen.weeklyActivities}</p>
              <p className="text-xs text-white/50">פעילויות/שבוע</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{citizen.persistenceRate}%</p>
              <p className="text-xs text-white/50">התמדה</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-bold">{citizen.engagementScore}%</p>
              <p className="text-xs text-white/50">מעורבות</p>
            </div>
          </div>
        </div>

        {/* Risk + Readiness */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">רמת סיכון</p>
            <span className={cn("text-xs px-3 py-1.5 rounded-md font-semibold border", risk.cls)}>
              {risk.label}
            </span>
          </div>
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs text-gray-400 uppercase tracking-wider mb-2">מוכנות לשינוי</p>
            <span className="text-xs px-3 py-1.5 rounded-md font-semibold bg-[#1B3A5C]/5 text-[#1B3A5C] border border-[#1B3A5C]/10">
              {READINESS_LABELS[citizen.readiness]}
            </span>
          </div>
        </div>

        {/* Wallet */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-4">
            <Wallet className="w-4 h-4 text-[#1B3A5C]" />
            <h2 className="text-sm font-semibold text-gray-900">ארנק יחידות</h2>
          </div>
          <div className="flex items-end gap-3 mb-3">
            <div>
              <p className="text-3xl font-bold text-[#1B3A5C]">{balance}</p>
              <p className="text-xs text-gray-400">יתרה זמינה</p>
            </div>
            <div className="pb-0.5">
              <p className="text-sm text-gray-500">מתוך <span className="font-semibold">{total}</span></p>
              <p className="text-xs text-gray-400">{used} נוצלו</p>
            </div>
          </div>
          <ProgressBar value={used} max={total} tone="primary" size="sm" />
          <p className="text-xs text-gray-400 mt-2">שירותי מניעה — מסובסדים 100% ע"י המדינה</p>
        </div>

        {/* Motivations */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-[#1B3A5C]" />
            <h2 className="text-sm font-semibold text-gray-900">מוטיבציות</h2>
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
              <p className="text-xs text-gray-400 mb-1">המטרה האישית</p>
              <p className="text-sm text-gray-700">{citizen.dream}</p>
            </div>
          )}
        </div>

        {/* Barriers */}
        {citizen.barriers.length > 0 && (
          <div className="bg-white rounded-xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-amber-500" />
              <h2 className="text-sm font-semibold text-gray-900">חסמים מזוהים</h2>
              <span className="text-xs text-gray-400">— המערכת מתאימה שירותים בהתאם</span>
            </div>
            <div className="flex flex-wrap gap-2">
              {citizen.barriers.map((b) => (
                <span key={b} className="px-3 py-1.5 bg-amber-50 text-amber-700 rounded-lg text-xs font-medium border border-amber-200">
                  {BARRIER_LABELS[b]}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Bookings */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Calendar className="w-4 h-4 text-[#1B3A5C]" />
              <h2 className="text-sm font-semibold text-gray-900">פעילויות קרובות</h2>
            </div>
            <Link to="/citizen/chat" className="text-xs text-[#1B3A5C] hover:underline flex items-center gap-0.5">
              הוסף <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {BOOKINGS.map((b) => (
              <div key={b.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border border-gray-100">
                <div>
                  <p className="text-sm font-medium text-gray-900">{b.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {b.date} · {b.time}
                  </p>
                </div>
                {b.status === "confirmed" ? (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200">
                    <CheckCircle className="w-3 h-3 text-emerald-600" />
                    <span className="text-xs text-emerald-700">אושר</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200">
                    <Clock className="w-3 h-3 text-amber-600" />
                    <span className="text-xs text-amber-700">ממתין</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Emergency */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <h2 className="text-sm font-semibold text-gray-900 mb-3">איש קשר לחירום</h2>
          <div className="flex items-center justify-between p-3 border border-gray-200 rounded-lg">
            <div>
              <p className="text-sm font-medium text-gray-900">אורי רוזנברג</p>
              <p className="text-xs text-gray-400">בן · 054-9876543</p>
            </div>
            <a href="tel:054-9876543"
              className="flex items-center gap-1.5 px-3 py-2 bg-[#1B3A5C] text-white rounded-lg text-xs font-medium hover:bg-[#15304d] transition-colors">
              <Phone className="w-3.5 h-3.5" /> חייג
            </a>
          </div>
        </div>

        {/* Digital literacy */}
        <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
          <Sparkles className="w-4 h-4 text-[#1B3A5C] shrink-0" />
          <div className="flex-1">
            <p className="text-xs font-medium text-gray-700">אוריינות דיגיטלית</p>
            <div className="flex gap-1 mt-1.5">
              {[1,2,3,4,5].map((n) => (
                <div key={n} className={cn("h-1.5 flex-1 rounded-full", n <= citizen.digitalLiteracy ? "bg-[#1B3A5C]" : "bg-gray-200")} />
              ))}
            </div>
          </div>
          <span className="text-sm font-bold text-[#1B3A5C]">{citizen.digitalLiteracy}/5</span>
        </div>

      </main>
    </div>
  );
}
