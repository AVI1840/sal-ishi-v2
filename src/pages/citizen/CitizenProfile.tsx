import { User, Phone, MapPin, Heart, Wallet, Target, Calendar, Sparkles, Settings } from "lucide-react";
import { CITIZENS } from "@/data/mockData";
import { BARRIER_LABELS } from "@/data/types";
import { ProgressBar } from "@/components/shared/ProgressBar";

const citizen = CITIZENS[0];

const BOOKINGS = [
  { id: 1, name: "התעמלות קבוצתית", date: "12.05.26", status: "confirmed" },
  { id: 2, name: "חוג ציור", date: "14.05.26", status: "confirmed" },
  { id: 3, name: "ביקור בית", date: "18.05.26", status: "pending" },
];

export default function CitizenProfile() {
  const total = 120;
  const balance = Math.round(citizen.engagementScore * 1.2);
  const usagePercent = Math.round(((total - balance) / total) * 100);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-4" dir="rtl">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-5 py-3">
        <h1 className="text-base font-bold text-[#1B3A5C]">הפרופיל שלי</h1>
      </header>

      <main className="px-5 pt-5 space-y-4">
        {/* Profile Header */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-blue-50 flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div className="flex-1">
              <h1 className="text-xl font-bold text-gray-900">{citizen.name}</h1>
              <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                <MapPin className="w-3.5 h-3.5" /> {citizen.city} · בת {citizen.age}
              </p>
              <div className="flex items-center gap-1.5 mt-1">
                <Sparkles className="w-3.5 h-3.5 text-blue-500" />
                <span className="text-xs text-blue-600 font-medium">חברתית-אקטיבית</span>
              </div>
            </div>
          </div>
        </div>

        {/* Wallet */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Wallet className="w-4 h-4 text-gray-400" />
            <h2 className="text-base font-semibold text-gray-900">הארנק שלי</h2>
          </div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <p className="text-sm text-gray-500">יתרה זמינה</p>
              <p className="text-2xl font-bold text-gray-900">{balance} יחידות</p>
            </div>
            <div className="text-left">
              <p className="text-sm text-gray-500">ניצלת</p>
              <p className="text-lg font-semibold text-blue-600">{usagePercent}%</p>
            </div>
          </div>
          <ProgressBar value={total - balance} max={total} tone="primary" size="sm" />
          <p className="text-xs text-gray-400 mt-1.5 text-center">{total - balance} מתוך {total} יחידות נוצלו</p>
        </div>

        {/* What matters */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Heart className="w-4 h-4 text-red-400" />
            <h2 className="text-base font-semibold text-gray-900">מה חשוב לי</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {citizen.interests.map((tag) => (
              <span key={tag} className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded-lg text-sm font-medium">{tag}</span>
            ))}
          </div>
          <div className="mt-3 p-3 bg-amber-50 rounded-lg border border-amber-100">
            <p className="text-xs text-amber-600 font-medium mb-0.5">💫 החלום שלי</p>
            <p className="text-sm text-amber-900">{citizen.dream}</p>
          </div>
        </div>

        {/* Risk Flags */}
        {citizen.barriers.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <div className="flex items-center gap-2 mb-3">
              <span className="text-amber-500">⚠️</span>
              <h2 className="text-base font-semibold text-gray-900">מה המערכת מזהה</h2>
            </div>
            <div className="space-y-2">
              {citizen.barriers.map((barrier) => (
                <div key={barrier} className="flex items-center gap-2 p-2.5 bg-amber-50 rounded-lg border border-amber-100">
                  <span className="text-amber-500">⚠️</span>
                  <span className="text-sm text-amber-800">{BARRIER_LABELS[barrier]}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Goals */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Target className="w-4 h-4 text-green-500" />
            <h2 className="text-base font-semibold text-gray-900">המטרות שלי</h2>
          </div>
          <div className="flex flex-wrap gap-2">
            {["שיפור תפקוד פיזי", "הפחתת תחושת בדידות", "חיזוק מצב נפשי"].map((goal) => (
              <span key={goal} className="px-3 py-1.5 bg-green-50 text-green-700 rounded-lg text-sm font-medium">{goal}</span>
            ))}
          </div>
        </div>

        {/* Recent Bookings */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Calendar className="w-4 h-4 text-purple-500" />
            <h2 className="text-base font-semibold text-gray-900">הזמנות אחרונות</h2>
          </div>
          <div className="space-y-2">
            {BOOKINGS.map((booking) => (
              <div key={booking.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                <div>
                  <p className="text-sm font-medium text-gray-900">{booking.name}</p>
                  <p className="text-xs text-gray-500">{booking.date}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-md ${booking.status === "confirmed" ? "bg-green-100 text-green-700" : "bg-amber-100 text-amber-700"}`}>
                  {booking.status === "confirmed" ? "✅ מאושר" : "⏳ ממתין"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Emergency Contact */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="text-base font-semibold text-gray-900 mb-2">איש קשר לחירום</h2>
          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg border border-red-100">
            <div>
              <p className="text-sm font-medium text-gray-900">אורי רוזנברג</p>
              <p className="text-xs text-gray-500">בן</p>
            </div>
            <a href="tel:054-9876543" className="px-3 py-1.5 bg-red-600 text-white rounded-lg text-xs font-medium flex items-center gap-1">
              <Phone className="w-3 h-3" /> 054-9876543
            </a>
          </div>
        </div>

        {/* Settings */}
        <button className="w-full flex items-center justify-center gap-2 h-12 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-600 hover:bg-gray-50 transition-colors">
          <Settings className="w-4 h-4" /> הגדרות נגישות
        </button>
      </main>
    </div>
  );
}
