/**
 * מסך בית אזרח — סל אישי
 * עיצוב חם, פשוט, נגיש למבוגרים
 */
import { Bell, Calendar, ChevronLeft, Heart, MapPin, Phone, Sparkles, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CITIZENS, SERVICES } from "@/data/mockData";
import { useState, useMemo } from "react";

const citizen = CITIZENS[0];

const getGreeting = () => {
  const hour = new Date().getHours();
  if (hour < 12) return "בוקר טוב";
  if (hour < 17) return "צהריים טובים";
  return "ערב טוב";
};

const getDateString = () => {
  return new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });
};

const CATEGORIES = [
  { id: "all", label: "הכל", emoji: "" },
  { id: "שייכות", label: "שייכות ומשמעות", emoji: "🤝", color: "#3b82f6" },
  { id: "בריאות", label: "תפקוד ובריאות", emoji: "💪", color: "#22c55e" },
  { id: "חוסן", label: "חוסן אישי", emoji: "🛡️", color: "#8b5cf6" },
  { id: "דיגיטל", label: "דיגיטציה", emoji: "📱", color: "#0ea5e9" },
  { id: "מוצרים", label: "מוצרים מסייעים", emoji: "🔧", color: "#f59e0b" },
];

const SERVICE_CARDS = [
  { id: 1, name: "מועדון חברתי", desc: "מפגשים ופעילויות", category: "שייכות", price: "חינם", emoji: "🤝", color: "#3b82f6" },
  { id: 2, name: "חוג ציור", desc: "במרכז הקהילתי", category: "שייכות", price: "חינם", emoji: "🎨", color: "#3b82f6" },
  { id: 3, name: "מקהלה", desc: "שירה בקבוצה", category: "שייכות", price: "חינם", emoji: "🎵", color: "#3b82f6" },
  { id: 4, name: "קבוצת הליכה", desc: "בפארק הסמוך", category: "שייכות", price: "חינם", emoji: "🚶", color: "#3b82f6" },
  { id: 5, name: "התעמלות", desc: "קבוצה מותאמת", category: "בריאות", price: "חינם", emoji: "💪", color: "#22c55e" },
  { id: 6, name: "תזונה נכונה", desc: "ייעוץ אישי", category: "בריאות", price: "חינם", emoji: "🥗", color: "#22c55e" },
  { id: 7, name: "יוגה", desc: "מותאמת לגיל", category: "בריאות", price: "חינם", emoji: "🧘", color: "#22c55e" },
  { id: 8, name: "מניעת נפילות", desc: "סדנה קבוצתית", category: "בריאות", price: "חינם", emoji: "🛡️", color: "#22c55e" },
  { id: 9, name: "תמיכה נפשית", desc: "שיחות אישיות", category: "חוסן", price: "20 יח׳", emoji: "💚", color: "#8b5cf6" },
  { id: 10, name: "סמארטפון", desc: "הדרכה בסיסית", category: "דיגיטל", price: "20 יח׳", emoji: "📱", color: "#0ea5e9" },
];

const SCHEDULE = [
  { day: "יום ג׳", time: "10:00", name: "התעמלות קבוצתית", place: "מרכז ספורט מינהל קהילתי", status: "confirmed" },
  { day: "יום ה׳", time: "11:30", name: "חוג ציור", place: "סטודיו צבעים", status: "confirmed" },
  { day: "יום א׳", time: "09:00", name: "ביקור בית", place: "בבית", status: "pending" },
];

export default function CitizenHome() {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const walletTotal = 120;
  const walletBalance = Math.round(citizen.engagementScore * 1.2);
  const walletPercent = Math.round((walletBalance / walletTotal) * 100);

  const filteredServices = activeCategory
    ? SERVICE_CARDS.filter((s) => s.category === activeCategory)
    : SERVICE_CARDS.slice(0, 8);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-4" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-5 lg:px-8 py-3">
        <div className="flex items-center justify-between max-w-6xl mx-auto">
          <div className="flex items-center gap-2">
            <div className="w-9 h-9 rounded-xl bg-[#1B3A5C] flex items-center justify-center">
              <Wallet className="w-4 h-4 text-white" />
            </div>
            <div>
              <div className="text-base font-bold text-[#1B3A5C]">סל אישי</div>
              <div className="text-[11px] text-gray-400">שירותים שנבחרו במיוחד עבורך</div>
            </div>
          </div>
          <button className="relative w-10 h-10 rounded-xl bg-gray-50 flex items-center justify-center" aria-label="התראות">
            <Bell className="w-5 h-5 text-gray-500" />
            <span className="absolute -top-1 -right-1 w-5 h-5 bg-red-500 rounded-full text-[10px] text-white font-bold flex items-center justify-center">2</span>
          </button>
        </div>
      </header>

      <main className="px-5 lg:px-8 pt-5 space-y-6 max-w-6xl mx-auto">
        {/* Personalized Welcome Header */}
        <div className="animate-fade-in rounded-2xl p-5 relative overflow-hidden" style={{ background: "linear-gradient(135deg, #fdf2f8 0%, #ede9fe 50%, #dbeafe 100%)" }}>
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-800">{getGreeting()}, {citizen.name.split(" ")[0]} 🌸</h2>
              <p className="text-sm text-gray-500 mt-1">{getDateString()}</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/70 border border-purple-200/50 backdrop-blur-sm">
              <Sparkles className="w-3 h-3 text-purple-500" />
              <span className="text-[10px] font-bold text-purple-600">AI מותאם אישית</span>
            </div>
          </div>
        </div>

        {/* Hero + Wallet — side by side on desktop */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in-delayed">
        {/* Hero Greeting */}
        <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1B3A5C 0%, #2563eb 100%)" }}>
          <div className="flex items-center gap-4">
            <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl shrink-0">👋</div>
            <div>
              <h1 className="text-2xl font-bold">שלום, {citizen.name.split(" ")[0]}</h1>
              <p className="text-white/70 text-sm mt-0.5">כיף לראות אותך!</p>
              <p className="text-white/50 text-xs mt-1">בת {citizen.age} · {citizen.city} 📍</p>
            </div>
          </div>
        </div>

        {/* Wallet Card */}
        <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100 animate-glow">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Wallet className="w-5 h-5 text-[#1B3A5C]" />
              <h2 className="text-base font-bold text-gray-800">הארנק האישי שלך</h2>
            </div>
            <Calendar className="w-4 h-4 text-gray-400" />
          </div>
          <div className="flex items-center gap-6">
            {/* Donut */}
            <div className="relative w-20 h-20 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#1B3A5C" strokeWidth="3" strokeDasharray={`${walletPercent}, 100`} />
              </svg>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                <span className="text-sm font-bold text-[#1B3A5C]">{walletPercent}%</span>
                <span className="text-[9px] text-gray-400">זמין</span>
              </div>
            </div>
            <div className="flex-1">
              <div className="text-4xl font-bold text-[#1B3A5C] tabular-nums">{walletBalance}</div>
              <div className="text-xs text-gray-500 mt-0.5">יחידות</div>
              <div className="text-[11px] text-gray-400 mt-1">מתוך {walletTotal} יחידות זמינות החודש</div>
            </div>
          </div>
          <div className="mt-4 bg-green-50 border border-green-100 rounded-xl p-3 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-green-600 shrink-0" />
            <p className="text-xs text-green-700 font-medium leading-relaxed">שירותי מניעה — ללא עלות עבורך. המדינה ממנת עבורך 100%</p>
          </div>
        </div>
        </div>{/* end Hero+Wallet grid */}

        {/* Services Section */}
        <div className="animate-fade-in-delayed-2">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              שירותים מומלצים עבורך ✨
            </h2>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-5 px-5">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setActiveCategory(cat.id === "all" ? null : cat.id)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                  (cat.id === "all" && !activeCategory) || activeCategory === cat.id
                    ? "bg-[#1B3A5C] text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {cat.emoji} {cat.label}
              </button>
            ))}
          </div>

          {/* Service Cards Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredServices.map((service) => (
              <div key={service.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all active:scale-[0.98]">
                <div className="h-20 flex items-center justify-center" style={{ backgroundColor: `${service.color}10` }}>
                  <span className="text-4xl">{service.emoji}</span>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-gray-800">{service.name}</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5">{service.desc}</p>
                  <div className="flex items-center justify-between mt-3">
                    <span className={cn("text-xs font-bold", service.price === "חינם" ? "text-green-600" : "text-[#1B3A5C]")}>
                      {service.price === "חינם" ? "חינם ✨" : service.price}
                    </span>
                    <button className="px-3 py-1.5 bg-[#1B3A5C] text-white text-[11px] font-semibold rounded-lg hover:bg-[#15304d] transition-colors" style={{ minHeight: 32 }}>
                      הזמנה
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Weekly Schedule */}
        <div className="animate-fade-in-delayed-3">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#1B3A5C]" />
              מה מתוכנן עבורך השבוע 📅
            </h2>
          </div>
          <div className="space-y-2">
            {SCHEDULE.map((item, i) => (
              <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-100 p-4 flex items-center gap-4">
                <div className="text-center shrink-0">
                  <div className="text-xs text-gray-400">{item.day}</div>
                  <div className="text-lg font-bold text-[#1B3A5C]">{item.time}</div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-semibold text-gray-800">{item.name}</div>
                  <div className="text-xs text-gray-400 mt-0.5">{item.place}</div>
                </div>
                <span className={cn("px-2.5 py-1 text-[10px] font-bold rounded-full shrink-0", item.status === "confirmed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700")}>
                  {item.status === "confirmed" ? "באישור ✓" : "ממתין"}
                </span>
              </div>
            ))}
          </div>
          <Link to="/citizen/services" className="w-full mt-2 text-xs text-[#1B3A5C] font-medium py-2 hover:underline flex items-center justify-center gap-1">
            צפייה בכל הפעילויות <ChevronLeft className="w-3 h-3" />
          </Link>
        </div>

        {/* Contact CTA */}
        <div className="bg-[#1B3A5C]/5 border border-[#1B3A5C]/10 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1B3A5C] flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-800">דברו איתנו ❤️</h3>
              <p className="text-xs text-gray-500 mt-1">אנחנו כאן בשבילך</p>
              <p className="text-[11px] text-gray-400 mt-0.5">המלווה האישית שלך זמינה לשיחה</p>
              <Link to="/citizen/chat" className="mt-3 px-5 py-3 bg-[#1B3A5C] text-white text-sm font-semibold rounded-xl hover:bg-[#15304d] transition-colors flex items-center gap-2 w-fit" style={{ minHeight: 48 }}>
                <Phone className="w-4 h-4" />
                שיחה עם מלווה
              </Link>
            </div>
          </div>
        </div>

        {/* Accessibility Bar */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-center gap-3 flex-wrap">
          <a href="tel:*6050" className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-[#1B3A5C]" style={{ minHeight: 40 }}>
            <Phone className="w-3.5 h-3.5" /> מוקד שירות *6050
          </a>
          <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700" style={{ minHeight: 40 }}>A+ הגדל טקסט</button>
          <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700" style={{ minHeight: 40 }}>A- הקטן טקסט</button>
          <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700" style={{ minHeight: 40 }}>◑ ניגודיות גבוהה</button>
        </div>
      </main>
    </div>
  );
}
