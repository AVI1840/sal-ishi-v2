/**
 * CitizenHome — ממשק אזרח
 * עיצוב מקצועי, ממשלתי, מרשים — ללא אימוגי בכותרות
 * שירותים אמיתיים לפי אלגוריתם התאמה
 */
import { Bell, Calendar, ChevronLeft, MapPin, Phone, Wallet, CheckCircle, AlertCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { CITIZENS } from "@/data/mockData";
import { getRecommendedForProfile, filterServices, CATEGORY_FILTERS, type RealService } from "@/data/realServices";
import { matchServicesForCitizen, type MatchResult } from "@/lib/matchingEngine";
import { MOTIVATION_LABELS, BARRIER_LABELS } from "@/data/types";
import { useState, useMemo } from "react";

const citizen = CITIZENS[0];

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return "בוקר טוב";
  if (h < 17) return "צהריים טובים";
  return "ערב טוב";
};

const getDate = () =>
  new Date().toLocaleDateString("he-IL", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

const SCHEDULE = [
  { day: "ג׳", date: "17.06", time: "10:00", name: "התעמלות קבוצתית", place: "מרכז ספורט מינהל קהילתי", status: "confirmed" },
  { day: "ה׳", date: "19.06", time: "11:30", name: "חוג ציור", place: "מרכז תרבות פסגת זאב", status: "confirmed" },
  { day: "א׳", date: "22.06", time: "09:00", name: "ביקור בית — רונית לוי", place: "ביתך", status: "pending" },
];

const COST_BADGE: Record<string, { label: string; cls: string }> = {
  free:       { label: "חינם",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  subsidized: { label: "מסובסד",   cls: "bg-blue-50 text-blue-700 border-blue-200" },
  paid:       { label: "בתשלום",   cls: "bg-gray-50 text-gray-600 border-gray-200" },
};

const CATEGORY_ICON: Record<number, string> = {
  1: "👥", 2: "🏃", 3: "🤝", 4: "💻", 5: "🏠",
};

function ServiceCard({ result }: { result: MatchResult }) {
  const service = result.service;
  const badge = COST_BADGE[service.cost];
  return (
    <Link
      to={`/citizen/services/${service.id}`}
      className="block bg-white rounded-xl border border-gray-100 hover:border-[#1B3A5C]/30 hover:shadow-md transition-all group"
    >
      {/* Top bar with score indicator */}
      <div className="h-1.5 rounded-t-xl" style={{ background: result.isTopMatch ? "#1B3A5C" : "#e5e7eb" }} />
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-2">
          <h3 className="text-sm font-semibold text-gray-900 leading-tight group-hover:text-[#1B3A5C] transition-colors line-clamp-2">
            {service.name}
          </h3>
          <span className={cn("shrink-0 text-[10px] px-2 py-0.5 rounded border font-medium", badge.cls)}>
            {badge.label}
          </span>
        </div>
        <p className="text-xs text-gray-500 mb-2 line-clamp-1">{service.provider}</p>

        {/* Why recommended */}
        {result.explanations.length > 0 && (
          <p className="text-[11px] text-[#1B3A5C] bg-[#1B3A5C]/5 rounded-md px-2 py-1 mb-2 line-clamp-1 font-medium">
            {result.explanations[0]}
          </p>
        )}

        <div className="flex items-center justify-between">
          <span className="flex items-center gap-1 text-[11px] text-gray-400">
            <MapPin className="w-3 h-3" /> {service.neighborhood}
          </span>
          <div className="flex items-center gap-1">
            <div className="w-8 h-1.5 rounded-full bg-gray-100 overflow-hidden">
              <div className="h-full bg-[#1B3A5C] rounded-full" style={{ width: `${result.totalScore}%` }} />
            </div>
            <span className="text-[10px] text-gray-500 font-medium">{result.totalScore}%</span>
          </div>
        </div>
      </div>
    </Link>
  );
}

export default function CitizenHome() {
  const [activeCategory, setActiveCategory] = useState(0);

  const walletBalance = Math.round(citizen.engagementScore * 1.2);
  const walletTotal = 120;
  const walletPercent = Math.round((walletBalance / walletTotal) * 100);

  const recommended = useMemo(
    () => matchServicesForCitizen(citizen, { topN: 8 }),
    []
  );

  const categoryServices = useMemo(() => {
    if (activeCategory === 0) return recommended;
    return recommended.filter(r => r.service.category === activeCategory);
  }, [activeCategory, recommended]);

  const topMotivations = citizen.motivations.slice(0, 3);
  const topBarriers = citizen.barriers.slice(0, 2);

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* ── Top Bar ── */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-5 lg:px-8 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#1B3A5C] flex items-center justify-center">
            <Wallet className="w-4 h-4 text-white" />
          </div>
          <span className="text-sm font-bold text-[#1B3A5C] tracking-tight">סל אישי</span>
          <span className="hidden sm:block text-xs text-gray-400">|</span>
          <span className="hidden sm:block text-xs text-gray-500">ביטוח לאומי · משרד האוצר</span>
        </div>
        <div className="flex items-center gap-2">
          <button className="relative w-9 h-9 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center" aria-label="התראות">
            <Bell className="w-4 h-4 text-gray-500" />
            <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 rounded-full text-[9px] text-white font-bold flex items-center justify-center">2</span>
          </button>
          <div className="w-9 h-9 rounded-lg bg-[#1B3A5C]/10 flex items-center justify-center text-xs font-bold text-[#1B3A5C]">
            {citizen.name.charAt(0)}
          </div>
        </div>
      </header>

      <main className="px-5 lg:px-8 py-6 space-y-6 max-w-5xl mx-auto">

        {/* ── Welcome + Date ── */}
        <div className="flex items-start justify-between">
          <div>
            <p className="text-xs text-gray-400 mb-1">{getDate()}</p>
            <h1 className="text-2xl font-bold text-gray-900">{getGreeting()}, {citizen.name.split(" ")[0]}</h1>
            <p className="text-sm text-gray-500 mt-1">{citizen.neighborhood} · בת {citizen.age}</p>
          </div>
          <Link to="/citizen/profile" className="shrink-0">
            <div className="w-12 h-12 rounded-full bg-[#1B3A5C] flex items-center justify-center text-white text-lg font-bold shadow-sm">
              {citizen.name.charAt(0)}
            </div>
          </Link>
        </div>

        {/* ── Status Cards Row ── */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {/* Wallet */}
          <div className="col-span-2 bg-[#1B3A5C] rounded-xl p-4 text-white">
            <p className="text-xs text-white/60 mb-1">יתרת סל</p>
            <div className="flex items-end gap-2 mb-3">
              <span className="text-3xl font-bold">{walletBalance}</span>
              <span className="text-sm text-white/60 mb-0.5">מתוך {walletTotal} יחידות</span>
            </div>
            <div className="w-full h-1.5 bg-white/20 rounded-full overflow-hidden">
              <div className="h-full bg-white rounded-full transition-all" style={{ width: `${walletPercent}%` }} />
            </div>
            <p className="text-[10px] text-white/50 mt-1.5">{walletPercent}% זמין החודש</p>
          </div>

          {/* AI Match */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-[10px] text-gray-400 mb-1">שירותים מותאמים</p>
            <p className="text-2xl font-bold text-[#1B3A5C]">{recommended.length}</p>
            <p className="text-[10px] text-gray-500 mt-1">מתוך 102 שירותים</p>
            <div className="mt-2 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] text-emerald-600">אלגוריתם 5 שכבות</span>
            </div>
          </div>

          {/* Week */}
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-[10px] text-gray-400 mb-1">פעילויות השבוע</p>
            <p className="text-2xl font-bold text-[#1B3A5C]">{citizen.weeklyActivities}</p>
            <p className="text-[10px] text-gray-500 mt-1">מתוכנן השבוע</p>
            <Link to="/citizen/chat" className="mt-2 flex items-center gap-1 text-[10px] text-[#1B3A5C] hover:underline">
              <span>לתיאום נוסף</span>
              <ChevronLeft className="w-2.5 h-2.5" />
            </Link>
          </div>
        </div>

        {/* ── AI Profile Match ── */}
        <div className="bg-white border border-gray-100 rounded-xl p-4">
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-sm font-semibold text-gray-900">פרופיל ההתאמה שלך</h2>
              <p className="text-xs text-gray-400 mt-0.5">מבוסס על אלגוריתם 5 שכבות — Amazon Bedrock</p>
            </div>
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-[#1B3A5C]/5 border border-[#1B3A5C]/10">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1B3A5C] animate-pulse" />
              <span className="text-[10px] font-medium text-[#1B3A5C]">AI פעיל</span>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">מוטיבציות</p>
              <div className="flex flex-wrap gap-1.5">
                {topMotivations.map((m) => (
                  <span key={m} className="text-[11px] px-2 py-1 rounded-md bg-[#1B3A5C]/5 text-[#1B3A5C] font-medium border border-[#1B3A5C]/10">
                    {MOTIVATION_LABELS[m]}
                  </span>
                ))}
              </div>
            </div>
            <div>
              <p className="text-[10px] text-gray-400 uppercase tracking-wider mb-2">חסמים מזוהים</p>
              <div className="flex flex-wrap gap-1.5">
                {topBarriers.length > 0 ? topBarriers.map((b) => (
                  <span key={b} className="text-[11px] px-2 py-1 rounded-md bg-amber-50 text-amber-700 font-medium border border-amber-200">
                    {BARRIER_LABELS[b]}
                  </span>
                )) : (
                  <span className="text-[11px] px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200">ללא חסמים</span>
                )}
              </div>
            </div>
          </div>
          {citizen.dream && (
            <div className="mt-3 pt-3 border-t border-gray-100 flex items-start gap-2">
              <AlertCircle className="w-3.5 h-3.5 text-[#1B3A5C] mt-0.5 shrink-0" />
              <p className="text-xs text-gray-600"><span className="font-medium text-[#1B3A5C]">המטרה שלך:</span> {citizen.dream}</p>
            </div>
          )}
        </div>

        {/* ── Recommended Services ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div>
              <h2 className="text-base font-semibold text-gray-900">שירותים מומלצים עבורך</h2>
              <p className="text-xs text-gray-400 mt-0.5">ממוינים לפי ציון התאמה אישית</p>
            </div>
            <Link to="/citizen/services" className="text-xs text-[#1B3A5C] font-medium hover:underline flex items-center gap-0.5">
              כל השירותים <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>

          {/* Category filter */}
          <div className="flex gap-2 overflow-x-auto pb-2 mb-3">
            {CATEGORY_FILTERS.map((cat) => (
              <button
                key={cat.value}
                onClick={() => setActiveCategory(cat.value)}
                className={cn(
                  "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border shrink-0",
                  activeCategory === cat.value
                    ? "bg-[#1B3A5C] text-white border-[#1B3A5C]"
                    : "bg-white text-gray-600 border-gray-200 hover:border-[#1B3A5C]/40"
                )}
              >
                {CATEGORY_ICON[cat.value] && cat.value !== 0 && (
                  <span className="ml-1">{CATEGORY_ICON[cat.value]}</span>
                )}
                {cat.label}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {categoryServices.map((result) => (
              <ServiceCard key={result.service.id} result={result} />
            ))}
          </div>
        </div>

        {/* ── Weekly Schedule ── */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-base font-semibold text-gray-900">לוח הפעילויות שלך</h2>
            <Link to="/citizen/chat" className="text-xs text-[#1B3A5C] font-medium hover:underline flex items-center gap-0.5">
              תיאום <ChevronLeft className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {SCHEDULE.map((item, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-100 p-4 flex items-center gap-4">
                {/* Date block */}
                <div className="shrink-0 w-12 text-center">
                  <div className="text-[10px] text-gray-400">{item.day}</div>
                  <div className="text-sm font-bold text-[#1B3A5C]">{item.date}</div>
                  <div className="text-[10px] text-gray-500 flex items-center justify-center gap-0.5 mt-0.5">
                    <Clock className="w-2.5 h-2.5" />{item.time}
                  </div>
                </div>
                <div className="w-px h-10 bg-gray-100 shrink-0" />
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-900">{item.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5 flex items-center gap-1">
                    <MapPin className="w-3 h-3 shrink-0" /> {item.place}
                  </p>
                </div>
                {/* Status */}
                <div className="shrink-0">
                  {item.status === "confirmed" ? (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 border border-emerald-200">
                      <CheckCircle className="w-3 h-3 text-emerald-600" />
                      <span className="text-[10px] text-emerald-700 font-medium">אושר</span>
                    </div>
                  ) : (
                    <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 border border-amber-200">
                      <Clock className="w-3 h-3 text-amber-600" />
                      <span className="text-[10px] text-amber-700 font-medium">ממתין</span>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Contact row ── */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link
            to="/citizen/chat"
            className="flex items-center gap-3 p-4 bg-[#1B3A5C] rounded-xl text-white hover:bg-[#15304d] transition-colors"
          >
            <div className="w-10 h-10 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <p className="text-sm font-semibold">שיחה עם רונית</p>
              <p className="text-xs text-white/60">מתאמת אישית · זמינה עכשיו</p>
            </div>
          </Link>

          <div className="flex items-center gap-3 p-4 bg-white rounded-xl border border-gray-100">
            <div className="w-10 h-10 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center shrink-0">
              <Phone className="w-5 h-5 text-gray-500" />
            </div>
            <div>
              <p className="text-sm font-semibold text-gray-900">מוקד שירות</p>
              <a href="tel:*6050" className="text-xs text-[#1B3A5C] font-medium hover:underline">*6050 · עירייה 106</a>
            </div>
          </div>
        </div>

        {/* ── Accessibility bar ── */}
        <div className="flex items-center justify-center gap-3 flex-wrap py-2 border-t border-gray-100">
          <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">הגדל טקסט</button>
          <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">הקטן טקסט</button>
          <button className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-xs font-medium text-gray-600 hover:bg-gray-50">ניגודיות גבוהה</button>
        </div>

      </main>
    </div>
  );
}
