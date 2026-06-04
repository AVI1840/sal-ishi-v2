/**
 * ServicesCatalog — קטלוג שירותי הזדקנות מיטבית
 * מבוסס על החלטות ממשלה 127 ו-150
 * עיצוב מקצועי, ניווט לפי 5 תחומי ליבה
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart, Activity, Shield, Laptop, Wrench,
  Users, Briefcase, Palette, Dumbbell, Brain,
  Apple, Home, Coins, HeartHandshake, Lock,
  Smartphone, Settings, Globe, Volume2, ArrowUpRight,
  ChevronLeft, MapPin, CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Data model ─────────────────────────────────────────────────

interface SubCategory {
  icon: typeof Heart;
  label: string;
  services: ServiceItem[];
}

interface ServiceItem {
  name: string;
  level: "local" | "regional" | "national";
  description?: string;
  realServiceIds?: string[]; // link to catalog
}

interface Domain {
  id: number;
  title: string;
  subtitle: string;
  icon: typeof Heart;
  color: string;
  bgLight: string;
  subcategories: SubCategory[];
}

const LEVEL_MAP = {
  local:    { label: "מקומי", cls: "bg-emerald-100 text-emerald-700 border-emerald-200" },
  regional: { label: "אזורי", cls: "bg-amber-100 text-amber-700 border-amber-200" },
  national: { label: "ארצי", cls: "bg-red-100 text-red-700 border-red-200" },
};

// ─── 5 Domains ──────────────────────────────────────────────────

const DOMAINS: Domain[] = [
  {
    id: 1,
    title: "שייכות ומשמעות",
    subtitle: "מניעת בדידות וחיזוק קשרים חברתיים",
    icon: Heart,
    color: "#3b82f6",
    bgLight: "bg-blue-50",
    subcategories: [
      {
        icon: Users,
        label: "חיבור חברתי",
        services: [
          { name: "מועדון חברתי שכונתי", level: "local", realServiceIds: ["srv_001","srv_002","srv_007"] },
          { name: "קבוצות עניין משותפות", level: "local", realServiceIds: ["srv_005","srv_008"] },
          { name: "קבוצות הליכה", level: "local", realServiceIds: ["srv_082"] },
          { name: "פעילויות בין-דוריות", level: "regional" },
        ],
      },
      {
        icon: Briefcase,
        label: "תעסוקה והתנדבות",
        services: [
          { name: "התנדבות מותאמת", level: "local", realServiceIds: ["srv_006"] },
          { name: "תעסוקה חלקית למבוגרים", level: "regional" },
          { name: "חונכות ומנטורינג מקצועי", level: "national" },
          { name: "פרויקטים קהילתיים בהובלה אישית", level: "local", realServiceIds: ["srv_039"] },
        ],
      },
      {
        icon: Palette,
        label: "תרבות והעשרה",
        services: [
          { name: "פעילויות תרבות מקומיות", level: "local", realServiceIds: ["srv_015","srv_029","srv_051"] },
          { name: "למידה לאורך החיים", level: "regional", realServiceIds: ["srv_049","srv_078"] },
          { name: "טיולים וסיורים קבוצתיים", level: "regional", realServiceIds: ["srv_085"] },
          { name: "חוגי יצירה וביטוי", level: "local", realServiceIds: ["srv_008","srv_084"] },
        ],
      },
    ],
  },
  {
    id: 2,
    title: "תפקוד ובריאות",
    subtitle: "שימור ושיפור תפקוד פיזי וקוגניטיבי",
    icon: Activity,
    color: "#22c55e",
    bgLight: "bg-emerald-50",
    subcategories: [
      {
        icon: Dumbbell,
        label: "כושר גופני",
        services: [
          { name: "התעמלות מותאמת לגיל", level: "local", realServiceIds: ["srv_008","srv_056"] },
          { name: "הידרותרפיה / בריכה", level: "local", realServiceIds: ["srv_009","srv_021","srv_026"] },
          { name: "יוגה / פילאטיס לגיל השלישי", level: "local", realServiceIds: ["srv_056"] },
          { name: "אימון כוח ואיזון", level: "local", realServiceIds: ["srv_097"] },
        ],
      },
      {
        icon: Brain,
        label: "בריאות קוגניטיבית",
        services: [
          { name: "אימון מוח ותפקודים קוגניטיביים", level: "regional", realServiceIds: ["srv_047"] },
          { name: "פעילויות זיכרון ויצירתיות", level: "local" },
          { name: "משחקי חשיבה קבוצתיים", level: "local" },
        ],
      },
      {
        icon: Apple,
        label: "תזונה ואורח חיים",
        services: [
          { name: "ייעוץ תזונה מותאם אישית", level: "regional", realServiceIds: ["srv_044"] },
          { name: "הזמנת מזון בריא מותאם", level: "national" },
          { name: "סדנאות בישול בריא", level: "local" },
        ],
      },
      {
        icon: Home,
        label: "בטיחות ומניעה",
        services: [
          { name: "התאמת הבית למניעת נפילות", level: "local", realServiceIds: ["srv_040"] },
          { name: "בדיקות בריאות מונעות", level: "local", realServiceIds: ["srv_038","srv_042"] },
          { name: "מניעת נפילות — הדרכה", level: "local", realServiceIds: ["srv_097"] },
        ],
      },
    ],
  },
  {
    id: 3,
    title: "חוסן אישי וכלכלי",
    subtitle: "יציבות נפשית, כלכלית והתמודדות עם שינויים",
    icon: Shield,
    color: "#8b5cf6",
    bgLight: "bg-purple-50",
    subcategories: [
      {
        icon: Coins,
        label: "יציבות כלכלית",
        services: [
          { name: "ייעוץ למיצוי זכויות", level: "regional", realServiceIds: ["srv_004","srv_066","srv_079","srv_101"] },
          { name: "ניהול תקציב אישי", level: "regional" },
          { name: "ייעוץ משפטי בסיסי", level: "local", realServiceIds: ["srv_052"] },
          { name: "סיוע בירוקרטי", level: "local", realServiceIds: ["srv_004","srv_092"] },
        ],
      },
      {
        icon: HeartHandshake,
        label: "חוסן נפשי",
        services: [
          { name: "תמיכה נפשית והתמודדות", level: "local", realServiceIds: ["srv_053","srv_067"] },
          { name: "קבוצות תמיכה נושאיות", level: "local", realServiceIds: ["srv_045","srv_076"] },
          { name: "טיפול באבל ואובדן", level: "regional" },
          { name: "פיתוח עמידות נפשית", level: "national" },
        ],
      },
      {
        icon: Lock,
        label: "עצמאות יומיומית",
        services: [
          { name: "שירותי עזר ביתיים", level: "local", realServiceIds: ["srv_041","srv_065","srv_080"] },
          { name: "ליווי לרופאים ומוסדות", level: "local", realServiceIds: ["srv_046","srv_071"] },
          { name: "חברה לשעה — מתנדבים", level: "local", realServiceIds: ["srv_048","srv_098"] },
          { name: "הכנה למעברי חיים", level: "national", realServiceIds: ["srv_057"] },
        ],
      },
    ],
  },
  {
    id: 4,
    title: "דיגיטציה תומכת",
    subtitle: "הקטנת פערים דיגיטליים והנגשת טכנולוגיות",
    icon: Laptop,
    color: "#0ea5e9",
    bgLight: "bg-sky-50",
    subcategories: [
      {
        icon: Smartphone,
        label: "אוריינות דיגיטלית",
        services: [
          { name: "הדרכת סמארטפון בסיסית", level: "local", realServiceIds: ["srv_012","srv_088"] },
          { name: "שימוש באפליקציות יומיומיות", level: "regional" },
          { name: "שירותים ממשלתיים דיגיטליים", level: "national" },
          { name: "בנקאות דיגיטלית", level: "regional" },
        ],
      },
      {
        icon: Settings,
        label: "תמיכה טכנית",
        services: [
          { name: "תמיכה טכנית בבית", level: "local", realServiceIds: ["srv_099"] },
          { name: "התקנת ציוד טכנולוגי", level: "local" },
          { name: "מוקד תמיכה טלפוני", level: "national" },
        ],
      },
      {
        icon: Globe,
        label: "קישוריות חברתית",
        services: [
          { name: "וידאו-שיחות עם המשפחה", level: "national" },
          { name: "מועדון יוניפר — מרחוק", level: "national", realServiceIds: ["srv_023"] },
          { name: "טלמדיסין — רפואה מרחוק", level: "national", realServiceIds: ["srv_095"] },
        ],
      },
    ],
  },
  {
    id: 5,
    title: "מוצרים מסייעים",
    subtitle: "ציוד וטכנולוגיות מסייעות להזדקנות בטוחה",
    icon: Wrench,
    color: "#f59e0b",
    bgLight: "bg-amber-50",
    subcategories: [
      {
        icon: Volume2,
        label: "שיפור חושים",
        services: [
          { name: "מכשירי שמיעה מתקדמים", level: "national" },
          { name: "עדשות וכלי עזר לראייה", level: "national" },
          { name: "מגברי קול לטלפון", level: "national" },
        ],
      },
      {
        icon: Shield,
        label: "מניעת נפילות ובטיחות",
        services: [
          { name: "מאחזי יד ומעקות בטיחות", level: "national", realServiceIds: ["srv_040"] },
          { name: "לחצני מצוקה מתקדמים", level: "national", realServiceIds: ["srv_033","srv_059","srv_070","srv_089"] },
          { name: "מערכות התרעה בית חכם", level: "national" },
          { name: "תאורה אוטומטית ללילה", level: "national" },
        ],
      },
      {
        icon: Dumbbell,
        label: "ציוד כושר ותנועה",
        services: [
          { name: "הליכונים וכיסאות גלגלים", level: "national", realServiceIds: ["srv_011","srv_016","srv_034","srv_075"] },
          { name: "מכשירי כושר ביתיים מותאמים", level: "national" },
          { name: "עזרי התעמלות", level: "national" },
        ],
      },
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────

export default function ServicesCatalog() {
  const [activeDomain, setActiveDomain] = useState(0); // 0 = show all
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const visibleDomains = activeDomain === 0 ? DOMAINS : DOMAINS.filter(d => d.id === activeDomain);

  const totalServices = DOMAINS.reduce((sum, d) => sum + d.subcategories.reduce((s, c) => s + c.services.length, 0), 0);
  const linkedServices = DOMAINS.reduce((sum, d) => sum + d.subcategories.reduce((s, c) => s + c.services.filter(sv => sv.realServiceIds?.length).length, 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-24" dir="rtl">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/citizen" className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-gray-500 rotate-180" />
          </Link>
          <div>
            <span className="text-sm font-bold text-gray-900">קטלוג שירותים</span>
            <span className="text-[10px] text-gray-400 mr-2">סל הזדקנות מיטבית</span>
          </div>
        </div>
        <div className="flex items-center gap-2 text-[10px] text-gray-400">
          <span>{totalServices} שירותים</span>
          <span>·</span>
          <span>{linkedServices} זמינים בפיילוט</span>
        </div>
      </header>

      <main className="px-5 lg:px-8 py-6 max-w-5xl mx-auto space-y-6">

        {/* Title section */}
        <div className="bg-[#1B3A5C] rounded-xl p-6 text-white">
          <h1 className="text-xl font-bold">סל שירותי הזדקנות מיטבית</h1>
          <p className="text-sm text-white/70 mt-1">מבוסס על החלטות ממשלה 127 ו-150 ומפת המדדים הלאומיים</p>
          <div className="grid grid-cols-3 gap-4 mt-5 pt-4 border-t border-white/10">
            <div className="text-center">
              <div className="text-2xl font-bold">5</div>
              <div className="text-[10px] text-white/50">תחומי ליבה</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">{totalServices}</div>
              <div className="text-[10px] text-white/50">שירותים ומוצרים</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">102</div>
              <div className="text-[10px] text-white/50">שירותים ממופים בפיילוט</div>
            </div>
          </div>
        </div>

        {/* Domain navigation */}
        <div className="grid grid-cols-5 gap-2">
          {DOMAINS.map((domain) => {
            const Icon = domain.icon;
            const isActive = activeDomain === domain.id;
            return (
              <button
                key={domain.id}
                onClick={() => setActiveDomain(isActive ? 0 : domain.id)}
                className={cn(
                  "flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center",
                  isActive ? "border-[#1B3A5C] bg-[#1B3A5C]/5 shadow-sm" : "border-gray-100 bg-white hover:border-gray-300"
                )}
              >
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${domain.color}15` }}>
                  <Icon className="w-4 h-4" style={{ color: domain.color }} />
                </div>
                <span className="text-[10px] font-medium text-gray-700 leading-tight">{domain.title}</span>
              </button>
            );
          })}
        </div>

        {/* Domains list */}
        <div className="space-y-6">
          {visibleDomains.map((domain) => {
            const DomainIcon = domain.icon;
            return (
              <div key={domain.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                {/* Domain header */}
                <div className={cn("px-5 py-4 border-b border-gray-100", domain.bgLight)}>
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${domain.color}20` }}>
                      <DomainIcon className="w-5 h-5" style={{ color: domain.color }} />
                    </div>
                    <div>
                      <h2 className="text-base font-bold text-gray-900">{domain.id}. {domain.title}</h2>
                      <p className="text-xs text-gray-500 mt-0.5">{domain.subtitle}</p>
                    </div>
                  </div>
                </div>

                {/* Subcategories */}
                <div className="divide-y divide-gray-50">
                  {domain.subcategories.map((sub) => {
                    const SubIcon = sub.icon;
                    const key = `${domain.id}-${sub.label}`;
                    const isExpanded = expandedSub === key;
                    return (
                      <div key={key}>
                        <button
                          onClick={() => setExpandedSub(isExpanded ? null : key)}
                          className="w-full flex items-center gap-3 px-5 py-3.5 hover:bg-gray-50 transition-colors text-right"
                        >
                          <SubIcon className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-sm font-semibold text-gray-800 flex-1">{sub.label}</span>
                          <span className="text-[10px] text-gray-400 shrink-0">{sub.services.length} שירותים</span>
                          <ChevronLeft className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", isExpanded && "-rotate-90")} />
                        </button>

                        {isExpanded && (
                          <div className="px-5 pb-4 space-y-1.5">
                            {sub.services.map((sv, i) => {
                              const lvl = LEVEL_MAP[sv.level];
                              const hasReal = sv.realServiceIds && sv.realServiceIds.length > 0;
                              return (
                                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50">
                                  <span className="text-xs text-gray-400 w-4 shrink-0">{i + 1}.</span>
                                  <span className="text-sm text-gray-800 flex-1">{sv.name}</span>
                                  {hasReal && (
                                    <Link
                                      to={`/citizen/services/${sv.realServiceIds![0]}`}
                                      className="flex items-center gap-1 text-[10px] text-[#1B3A5C] hover:underline shrink-0"
                                    >
                                      <CheckCircle className="w-3 h-3" />
                                      זמין בפיילוט
                                    </Link>
                                  )}
                                  <span className={cn("text-[9px] px-1.5 py-0.5 rounded border font-medium shrink-0", lvl.cls)}>
                                    {lvl.label}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Algorithm explanation */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">אלגוריתם בחירה ותעדוף — 5 שכבות</h3>
          <div className="space-y-3">
            {[
              { weight: "40%", label: "מניעת הידרדרות", desc: "מה מוכח מחקרית שמעכב ירידה תפקודית" },
              { weight: "25%", label: "רצון ומוטיבציות", desc: "מה האדם רוצה ומעוניין לעשות" },
              { weight: "20%", label: "התאמה לפרופיל", desc: "יכולות פיזיות, שפה, מגזר, תרבות" },
              { weight: "10%", label: "זמינות מעשית", desc: "קרבה גיאוגרפית, שעות, נגישות" },
              { weight: "5%", label: "המלצות וניסיון", desc: "דירוגי משתמשים והמלצות מקצועיות" },
            ].map((layer, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-10 h-6 rounded bg-[#1B3A5C]/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-[#1B3A5C]">{layer.weight}</span>
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{layer.label}</p>
                  <p className="text-xs text-gray-500">{layer.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Process */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">תהליך הבחירה</h3>
          <div className="space-y-3">
            {[
              { step: "1", title: "פגישה משותפת", desc: "המתאמת והאזרח נכנסים יחד לפלטפורמה" },
              { step: "2", title: "הערכה אישית", desc: "שאלון קצר — רצונות, יכולות, מגבלות" },
              { step: "3", title: "המלצות AI מותאמות", desc: "2-3 שירותים מכל תחום עם הסבר" },
              { step: "4", title: "בחירה מושכלת", desc: "החלטה משותפת על 6-8 שירותים" },
              { step: "5", title: "מעקב ועדכון", desc: "הערכה חודשית + התאמות לפי הצורך" },
            ].map((s, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-7 h-7 rounded-full bg-[#1B3A5C] text-white flex items-center justify-center text-xs font-bold shrink-0">
                  {s.step}
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">{s.title}</p>
                  <p className="text-xs text-gray-500">{s.desc}</p>
                </div>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 bg-[#1B3A5C]/5 rounded-lg border border-[#1B3A5C]/10">
            <p className="text-xs text-[#1B3A5C]">
              <span className="font-medium">כללי בחירה:</span> מינימום שירות אחד מכל תחום · מקסימום 8 שירותים פעילים · אפשרות שינוי כל חודש
            </p>
          </div>
        </div>

      </main>
    </div>
  );
}
