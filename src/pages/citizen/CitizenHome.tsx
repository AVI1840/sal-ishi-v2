/**
 * CitizenHome — מסך בית אזרח
 * שירותים אמיתיים מהקטלוג + AI matching + UX חם ונגיש
 */
import { Bell, Calendar, ChevronLeft, Heart, MapPin, Phone, Sparkles, Wallet, Star, CheckCircle2 } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CITIZENS } from "@/data/mockData";
import { getRecommendedForProfile, filterServices, CATEGORY_FILTERS } from "@/data/realServices";
import { useState, useMemo } from "react";

const citizen = CITIZENS[0]; // שרה רוזנברג, פסגת זאב

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "בוקר טוב";
  if (h < 17) return "צהריים טובים";
  return "ערב טוב";
};

const getDateString = () =>
  new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long" });

const SCHEDULE = [
  { day: "יום ג׳", time: "10:00", name: "התעמלות קבוצתית", place: "מרכז ספורט מינהל קהילתי", status: "confirmed" },
  { day: "יום ה׳", time: "11:30", name: "חוג ציור", place: "סטודיו צבעים", status: "confirmed" },
  { day: "יום א׳", time: "09:00", name: "ביקור בית מתאמת", place: "בבית", status: "pending" },
];

const COST_COLOR: Record<string, string> = {
  free: "text-green-600",
  subsidized: "text-blue-600",
  paid: "text-gray-500",
};

const COST_LABEL: Record<string, string> = {
  free: "חינם ✨",
  subsidized: "מסובסד",
  paid: "בתשלום",
};

export default function CitizenHome() {
  const [activeCategory, setActiveCategory] = useState(0);
  const walletBalance = Math.round(citizen.engagementScore * 1.2);
  const walletTotal = 120;
  const walletPercent = Math.round((walletBalance / walletTotal) * 100);

  // שירותים מומלצים מהקטלוג האמיתי — פסגת זאב
  const recommended = useMemo(
    () => getRecommendedForProfile({ neighborhood: "פסגת זאב", mobility: "independent", topN: 8 }),
    []
  );

  // שירותים לפי קטגוריה
  const categoryServices = useMemo(() => {
    if (activeCategory === 0) return recommended;
    return filterServices({ neighborhood: "פסגת זאב", category: activeCategory }).slice(0, 8);
  }, [activeCategory, recommended]);

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-6" dir="rtl">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100 px-5 lg:px-8 py-3">
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

        {/* ── Welcome Banner ── */}
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

        {/* ── Hero + Wallet ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 animate-fade-in-delayed">
          {/* Hero */}
          <div className="rounded-2xl p-6 text-white relative overflow-hidden" style={{ background: "linear-gradient(135deg, #1B3A5C 0%, #2563eb 100%)" }}>
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-3xl shrink-0">👋</div>
              <div>
                <h1 className="text-2xl font-bold">שלום, {citizen.name.split(" ")[0]}</h1>
                <p className="text-white/70 text-sm mt-0.5">כיף לראות אותך!</p>
                <p className="text-white/50 text-xs mt-1">בת {citizen.age} · {citizen.neighborhood} 📍</p>
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 bg-white/10 rounded-xl p-3">
              <Sparkles className="w-4 h-4 text-yellow-300 shrink-0" />
              <p className="text-xs text-white/90">
                AI מצא <strong>{recommended.length} שירותים</strong> המותאמים במיוחד לך ב{citizen.neighborhood}
              </p>
            </div>
          </div>

          {/* Wallet */}
          <div className="bg-white rounded-2xl shadow-sm p-5 border border-gray-100">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Wallet className="w-5 h-5 text-[#1B3A5C]" />
                <h2 className="text-base font-bold text-gray-800">הארנק האישי שלך</h2>
              </div>
              <Calendar className="w-4 h-4 text-gray-400" />
            </div>
            <div className="flex items-center gap-6">
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
              <p className="text-xs text-green-700 font-medium">שירותי מניעה — ללא עלות עבורך. המדינה ממנת 100%</p>
            </div>
          </div>
        </div>

        {/* ── AI Badge ── */}
        <div className="flex items-center gap-3 bg-gradient-to-l from-blue-50 to-purple-50 border border-blue-100 rounded-2xl p-4">
          <div className="w-10 h-10 rounded-xl bg-[#1B3A5C] flex items-center justify-center shrink-0">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="text-sm font-bold text-[#1B3A5C]">מופעל על ידי Amazon Bedrock AI ✨</p>
            <p className="text-xs text-gray-500 mt-0.5">
              102 שירותים ממופים · אלגוריתם 5 שכבות · מותאם לפרופיל האישי שלך
            </p>
          </div>
        </div>

        {/* ── Services Section ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Heart className="w-5 h-5 text-red-400" />
              שירותים מומלצים עבורך
            </h2>
            <Link to="/citizen/services" className="text-xs text-[#1B3A5C] font-medium hover:underline flex items-center gap-1">
              כל השירותים <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>

          {/* Category Tabs */}
          <div className="flex gap-2 overflow-x-auto pb-3 -mx-5 px-5">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  "px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all shrink-0",
                  activeCategory === cat.value
                    ? "bg-[#1B3A5C] text-white shadow-sm"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                )}
              >
                {cat.label}
              </button>
            ))}
          </div>

          {/* Service Cards */}
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {categoryServices.map((service) => (
              <Link
                key={service.id}
                to={`/citizen/services/${service.id}`}
                className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all active:scale-[0.98] block"
              >
                <div className="h-20 flex items-center justify-center" style={{ backgroundColor: "#1B3A5C10" }}>
                  <span className="text-4xl">{service.emoji}</span>
                </div>
                <div className="p-3">
                  <h3 className="text-sm font-bold text-gray-800 line-clamp-1">{service.name}</h3>
                  <p className="text-[11px] text-gray-400 mt-0.5 line-clamp-1 flex items-center gap-1">
                    <MapPin className="w-2.5 h-2.5 shrink-0" /> {service.neighborhood}
                  </p>
                  <div className="flex items-center justify-between mt-3">
                    <span className={cn("text-xs font-bold", COST_COLOR[service.cost])}>
                      {COST_LABEL[service.cost]}
                    </span>
                    <div className="flex items-center gap-0.5">
                      <Star className="w-3 h-3 text-amber-400 fill-amber-400" />
                      <span className="text-[10px] text-gray-500">{service.match_score}%</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── Before / After ── */}
        <div className="bg-white border border-gray-100 rounded-2xl p-5 shadow-sm">
          <h3 className="text-base font-bold text-gray-800 mb-4 flex items-center gap-2">
            📊 לפני ואחרי — מה המערכת שינתה
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-red-50 rounded-xl p-4 border border-red-100">
              <div className="text-xs font-bold text-red-500 mb-2">❌ לפני</div>
              <ul className="space-y-1.5 text-xs text-gray-600">
                <li>• 30% מימוש זכויות בלבד</li>
                <li>• חיפוש ידני במאות שירותים</li>
                <li>• המתנה של שבועות לתיאום</li>
                <li>• ללא מעקב אישי</li>
              </ul>
            </div>
            <div className="bg-green-50 rounded-xl p-4 border border-green-100">
              <div className="text-xs font-bold text-green-600 mb-2">✅ אחרי</div>
              <ul className="space-y-1.5 text-xs text-gray-600">
                <li>• 75% מימוש זכויות ← יעד</li>
                <li>• AI ממפה 102 שירותים מיד</li>
                <li>• תיאום מיידי דיגיטלי</li>
                <li>• מעקב אישי שבועי</li>
              </ul>
            </div>
          </div>
        </div>

        {/* ── Weekly Schedule ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-lg font-bold text-gray-800 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-[#1B3A5C]" />
              מה מתוכנן עבורך השבוע
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
                  <div className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3" /> {item.place}
                  </div>
                </div>
                <span className={cn(
                  "px-2.5 py-1 text-[10px] font-bold rounded-full shrink-0",
                  item.status === "confirmed" ? "bg-green-50 text-green-700" : "bg-amber-50 text-amber-700"
                )}>
                  {item.status === "confirmed" ? <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> אושר</span> : "ממתין"}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── Contact CTA ── */}
        <div className="bg-[#1B3A5C]/5 border border-[#1B3A5C]/10 rounded-2xl p-5">
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-[#1B3A5C] flex items-center justify-center shrink-0">
              <Heart className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="text-base font-bold text-gray-800">דברו איתנו ❤️</h3>
              <p className="text-xs text-gray-500 mt-1">המלווה האישית שלך זמינה לשיחה</p>
              <Link
                to="/citizen/chat"
                className="mt-3 px-5 py-3 bg-[#1B3A5C] text-white text-sm font-semibold rounded-xl hover:bg-[#15304d] transition-colors flex items-center gap-2 w-fit"
                style={{ minHeight: 48 }}
              >
                <Phone className="w-4 h-4" />
                שיחה עם מלווה
              </Link>
            </div>
          </div>
        </div>

        {/* ── Accessibility Bar ── */}
        <div className="bg-gray-50 border border-gray-200 rounded-xl p-3 flex items-center justify-center gap-3 flex-wrap">
          <a href="tel:*6050" className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-[#1B3A5C]" style={{ minHeight: 40 }}>
            <Phone className="w-3.5 h-3.5" /> מוקד שירות *6050
          </a>
          <a href="tel:106" className="flex items-center gap-1.5 px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-[#1B3A5C]" style={{ minHeight: 40 }}>
            <Phone className="w-3.5 h-3.5" /> עירייה 106
          </a>
          <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700" style={{ minHeight: 40 }}>A+ הגדל טקסט</button>
          <button className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs font-bold text-gray-700" style={{ minHeight: 40 }}>◑ ניגודיות</button>
        </div>
      </main>
    </div>
  );
}
