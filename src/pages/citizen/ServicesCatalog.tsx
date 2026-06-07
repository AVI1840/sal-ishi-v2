/**
 * ServicesCatalog — קטלוג סל שירותי הזדקנות מיטבית
 * מבוסס על החלטות ממשלה 127 ו-150
 * 5 תחומי ליבה · קטגוריות משנה · רמות שירות
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Heart, Activity, Shield, Laptop, Wrench,
  Users, Briefcase, Palette, Dumbbell, Brain,
  Apple, Home, Coins, HeartHandshake, Lock,
  Smartphone, Settings, Globe, Volume2,
  ChevronLeft, CheckCircle, MapPin,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ──────────────────────────────────────────────────────

interface ServiceItem {
  name: string;
  level: "local" | "regional" | "national";
  linkedIds?: string[];
}

interface SubCategory {
  icon: typeof Heart;
  label: string;
  services: ServiceItem[];
}

interface Domain {
  id: number;
  title: string;
  subtitle: string;
  icon: typeof Heart;
  color: string;
  subcategories: SubCategory[];
}

const LEVEL = {
  local:    { label: "מקומי",  cls: "bg-emerald-50 text-emerald-700 border-emerald-200", desc: "ברשות המקומית" },
  regional: { label: "אזורי", cls: "bg-amber-50 text-amber-700 border-amber-200", desc: "שיתוף בין רשויות" },
  national: { label: "ארצי",  cls: "bg-rose-50 text-rose-700 border-rose-200", desc: "זמין לכל האזרחים" },
};

// ─── 5 Domains from document ────────────────────────────────────

const DOMAINS: Domain[] = [
  {
    id: 1, title: "שייכות ומשמעות", subtitle: "מניעת בדידות וחיזוק קשרים חברתיים",
    icon: Heart, color: "#3b82f6",
    subcategories: [
      { icon: Users, label: "חיבור חברתי", services: [
        { name: "מועדון חברתי שכונתי", level: "local", linkedIds: ["srv_001","srv_002","srv_019","srv_020"] },
        { name: "קבוצות עניין משותפות", level: "local", linkedIds: ["srv_005","srv_047"] },
        { name: "קבוצות הליכה", level: "local", linkedIds: ["srv_082"] },
        { name: "פעילויות בין-דוריות", level: "regional" },
      ]},
      { icon: Briefcase, label: "תעסוקה והתנדבות", services: [
        { name: "התנדבות מותאמת", level: "local", linkedIds: ["srv_006"] },
        { name: "תעסוקה חלקית למבוגרים", level: "regional" },
        { name: "חונכות ומנטורינג מקצועי", level: "national" },
        { name: "פרויקטים קהילתיים בהובלה אישית", level: "local", linkedIds: ["srv_039"] },
      ]},
      { icon: Palette, label: "תרבות והעשרה", services: [
        { name: "פעילויות תרבות מקומיות", level: "local", linkedIds: ["srv_015","srv_029","srv_051"] },
        { name: "למידה לאורך החיים", level: "regional", linkedIds: ["srv_049","srv_078"] },
        { name: "טיולים וסיורים קבוצתיים", level: "regional", linkedIds: ["srv_085"] },
        { name: "חוגי יצירה וביטוי", level: "local", linkedIds: ["srv_008","srv_084"] },
      ]},
    ],
  },
  {
    id: 2, title: "תפקוד ובריאות", subtitle: "שימור ושיפור תפקוד פיזי וקוגניטיבי",
    icon: Activity, color: "#22c55e",
    subcategories: [
      { icon: Dumbbell, label: "כושר גופני", services: [
        { name: "התעמלות מותאמת לגיל", level: "local", linkedIds: ["srv_008","srv_030"] },
        { name: "הידרותרפיה / בריכה", level: "local", linkedIds: ["srv_009","srv_021","srv_026"] },
        { name: "יוגה / פילאטיס לגיל השלישי", level: "local", linkedIds: ["srv_056"] },
        { name: "אימון כוח ואיזון", level: "local", linkedIds: ["srv_097"] },
      ]},
      { icon: Brain, label: "בריאות קוגניטיבית", services: [
        { name: "אימון מוח ותפקודים קוגניטיביים", level: "regional", linkedIds: ["srv_047"] },
        { name: "פעילויות זיכרון ויצירתיות", level: "local" },
        { name: "משחקי חשיבה קבוצתיים", level: "local" },
      ]},
      { icon: Apple, label: "תזונה ואורח חיים", services: [
        { name: "ייעוץ תזונה מותאם אישית", level: "regional", linkedIds: ["srv_044"] },
        { name: "הזמנת מזון בריא מותאם", level: "national" },
        { name: "סדנאות בישול בריא", level: "local" },
      ]},
      { icon: Home, label: "בטיחות ומניעה", services: [
        { name: "התאמת הבית למניעת נפילות", level: "local", linkedIds: ["srv_040"] },
        { name: "בדיקות בריאות מונעות", level: "local", linkedIds: ["srv_038"] },
        { name: "מניעת נפילות — הדרכה", level: "local", linkedIds: ["srv_097"] },
      ]},
    ],
  },
  {
    id: 3, title: "חוסן אישי וכלכלי", subtitle: "יציבות נפשית, כלכלית והתמודדות עם שינויים",
    icon: Shield, color: "#8b5cf6",
    subcategories: [
      { icon: Coins, label: "יציבות כלכלית", services: [
        { name: "ייעוץ למיצוי זכויות", level: "regional", linkedIds: ["srv_004","srv_066","srv_079","srv_101"] },
        { name: "ניהול תקציב אישי", level: "regional" },
        { name: "ייעוץ משפטי בסיסי", level: "local", linkedIds: ["srv_052"] },
        { name: "סיוע בירוקרטי", level: "local", linkedIds: ["srv_004","srv_092"] },
      ]},
      { icon: HeartHandshake, label: "חוסן נפשי", services: [
        { name: "תמיכה נפשית והתמודדות", level: "local", linkedIds: ["srv_053","srv_067"] },
        { name: "קבוצות תמיכה נושאיות", level: "local", linkedIds: ["srv_045","srv_076"] },
        { name: "טיפול באבל ואובדן", level: "regional" },
        { name: "פיתוח עמידות נפשית", level: "national" },
      ]},
      { icon: Lock, label: "עצמאות יומיומית", services: [
        { name: "שירותי עזר ביתיים", level: "local", linkedIds: ["srv_041","srv_065","srv_080"] },
        { name: "ליווי לרופאים ומוסדות", level: "local", linkedIds: ["srv_046","srv_071"] },
        { name: "חברה לשעה — מתנדבים", level: "local", linkedIds: ["srv_048","srv_098"] },
        { name: "הכנה למעברי חיים", level: "national", linkedIds: ["srv_057"] },
      ]},
    ],
  },
  {
    id: 4, title: "דיגיטציה תומכת", subtitle: "הקטנת פערים דיגיטליים והנגשת טכנולוגיות",
    icon: Laptop, color: "#0ea5e9",
    subcategories: [
      { icon: Smartphone, label: "אוריינות דיגיטלית", services: [
        { name: "הדרכת סמארטפון בסיסית", level: "local", linkedIds: ["srv_012","srv_088"] },
        { name: "שימוש באפליקציות יומיומיות", level: "regional" },
        { name: "שירותים ממשלתיים דיגיטליים", level: "national" },
        { name: "בנקאות דיגיטלית", level: "regional" },
      ]},
      { icon: Settings, label: "תמיכה טכנית", services: [
        { name: "תמיכה טכנית בבית", level: "local", linkedIds: ["srv_099"] },
        { name: "התקנת ציוד טכנולוגי", level: "local" },
        { name: "מוקד תמיכה טלפוני", level: "national" },
      ]},
      { icon: Globe, label: "קישוריות חברתית", services: [
        { name: "וידאו-שיחות עם המשפחה", level: "national" },
        { name: "מועדון דיגיטלי מרחוק", level: "national", linkedIds: ["srv_023"] },
        { name: "טלמדיסין — רפואה מרחוק", level: "national", linkedIds: ["srv_095"] },
        { name: "פלטפורמות למידה דיגיטליות", level: "national" },
      ]},
    ],
  },
  {
    id: 5, title: "מוצרים מסייעים", subtitle: "ציוד וטכנולוגיות להזדקנות בטוחה",
    icon: Wrench, color: "#f59e0b",
    subcategories: [
      { icon: Volume2, label: "שיפור חושים", services: [
        { name: "מכשירי שמיעה מתקדמים", level: "national" },
        { name: "עדשות וכלי עזר לראייה", level: "national" },
        { name: "מגברי קול לטלפון", level: "national" },
      ]},
      { icon: Shield, label: "מניעת נפילות ובטיחות", services: [
        { name: "מאחזי יד ומעקות בטיחות", level: "national", linkedIds: ["srv_040"] },
        { name: "לחצני מצוקה מתקדמים", level: "national", linkedIds: ["srv_033","srv_059","srv_070","srv_089"] },
        { name: "מערכות התרעה בית חכם", level: "national" },
        { name: "תאורה אוטומטית ללילה", level: "national" },
        { name: "נעליים נגד החלקה מותאמות", level: "national" },
      ]},
      { icon: Smartphone, label: "טכנולוגיות מסייעות", services: [
        { name: "אפליקציות תזכורת לתרופות", level: "national" },
        { name: "מזרוני נפילה חכמים", level: "national" },
      ]},
      { icon: Dumbbell, label: "ציוד כושר ותנועה", services: [
        { name: "הליכונים וכיסאות גלגלים קלים", level: "national", linkedIds: ["srv_011","srv_016","srv_034","srv_075"] },
        { name: "מכשירי כושר ביתיים מותאמים", level: "national" },
        { name: "עזרי התעמלות", level: "national" },
      ]},
    ],
  },
];

// ─── Component ──────────────────────────────────────────────────

export default function ServicesCatalog() {
  const [activeDomain, setActiveDomain] = useState(0);
  const [expandedSub, setExpandedSub] = useState<string | null>(null);

  const visibleDomains = activeDomain === 0 ? DOMAINS : DOMAINS.filter(d => d.id === activeDomain);
  const totalServices = DOMAINS.reduce((sum, d) => sum + d.subcategories.reduce((s, c) => s + c.services.length, 0), 0);
  const linkedCount = DOMAINS.reduce((sum, d) => sum + d.subcategories.reduce((s, c) => s + c.services.filter(sv => sv.linkedIds?.length).length, 0), 0);

  return (
    <div className="min-h-screen bg-gray-50 pb-28" dir="rtl">
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-5 h-14 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/citizen" className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center">
            <ChevronLeft className="w-4 h-4 text-gray-500 rotate-180" />
          </Link>
          <span className="text-sm font-bold text-gray-900">קטלוג סל שירותים</span>
        </div>
        <span className="text-[10px] text-gray-400">{totalServices} שירותים · {linkedCount} זמינים בפיילוט</span>
      </header>

      <main className="px-5 lg:px-8 py-6 max-w-5xl mx-auto space-y-6">

        {/* Title */}
        <div className="bg-[#1B3A5C] rounded-xl p-6 text-white">
          <h1 className="text-lg font-bold">סל שירותי הזדקנות מיטבית</h1>
          <p className="text-sm text-white/60 mt-1">מבוסס על החלטות ממשלה 127 ו-150 · מפת המדדים הלאומיים</p>
          <div className="grid grid-cols-4 gap-3 mt-5 pt-4 border-t border-white/10 text-center">
            <div><div className="text-xl font-bold">5</div><div className="text-[10px] text-white/40">תחומי ליבה</div></div>
            <div><div className="text-xl font-bold">{totalServices}</div><div className="text-[10px] text-white/40">שירותים</div></div>
            <div><div className="text-xl font-bold">102</div><div className="text-[10px] text-white/40">ממופים בפיילוט</div></div>
            <div><div className="text-xl font-bold">5</div><div className="text-[10px] text-white/40">שכונות</div></div>
          </div>
        </div>

        {/* Level legend */}
        <div className="flex items-center gap-4 text-[10px] text-gray-500 px-1">
          {Object.entries(LEVEL).map(([key, val]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className={cn("px-1.5 py-0.5 rounded border text-[9px] font-medium", val.cls)}>{val.label}</span>
              <span>{val.desc}</span>
            </div>
          ))}
        </div>

        {/* Domain navigation */}
        <div className="grid grid-cols-5 gap-2">
          {DOMAINS.map((d) => {
            const Icon = d.icon;
            const active = activeDomain === d.id;
            const count = d.subcategories.reduce((s, c) => s + c.services.length, 0);
            return (
              <button key={d.id} onClick={() => setActiveDomain(active ? 0 : d.id)}
                className={cn("flex flex-col items-center gap-1.5 p-3 rounded-xl border transition-all text-center",
                  active ? "border-[#1B3A5C] bg-[#1B3A5C]/5" : "border-gray-100 bg-white hover:border-gray-300"
                )}>
                <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${d.color}12` }}>
                  <Icon className="w-4 h-4" style={{ color: d.color }} />
                </div>
                <span className="text-[10px] font-semibold text-gray-700 leading-tight">{d.title}</span>
                <span className="text-[9px] text-gray-400">{count} שירותים</span>
              </button>
            );
          })}
        </div>

        {/* Domains */}
        <div className="space-y-4">
          {visibleDomains.map((domain) => {
            const DomainIcon = domain.icon;
            return (
              <div key={domain.id} className="bg-white border border-gray-100 rounded-xl overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-50" style={{ backgroundColor: `${domain.color}05` }}>
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${domain.color}15` }}>
                      <DomainIcon className="w-4.5 h-4.5" style={{ color: domain.color }} />
                    </div>
                    <div>
                      <h2 className="text-sm font-bold text-gray-900">{domain.id}. {domain.title}</h2>
                      <p className="text-xs text-gray-500">{domain.subtitle}</p>
                    </div>
                  </div>
                </div>

                <div className="divide-y divide-gray-50">
                  {domain.subcategories.map((sub) => {
                    const SubIcon = sub.icon;
                    const key = `${domain.id}-${sub.label}`;
                    const isOpen = expandedSub === key;
                    return (
                      <div key={key}>
                        <button onClick={() => setExpandedSub(isOpen ? null : key)}
                          className="w-full flex items-center gap-3 px-5 py-3 hover:bg-gray-50 transition-colors text-right">
                          <SubIcon className="w-4 h-4 text-gray-400 shrink-0" />
                          <span className="text-sm font-medium text-gray-800 flex-1">{sub.label}</span>
                          <span className="text-[10px] text-gray-400">{sub.services.length}</span>
                          <ChevronLeft className={cn("w-3.5 h-3.5 text-gray-400 transition-transform", isOpen && "-rotate-90")} />
                        </button>
                        {isOpen && (
                          <div className="px-5 pb-4 space-y-1">
                            {sub.services.map((sv, i) => {
                              const lvl = LEVEL[sv.level];
                              const linked = sv.linkedIds && sv.linkedIds.length > 0;
                              return (
                                <div key={i} className="flex items-center gap-3 py-2 px-3 rounded-lg hover:bg-gray-50 transition-colors">
                                  <span className="text-xs text-gray-400 w-5 shrink-0 text-center">{i + 1}</span>
                                  <span className="text-sm text-gray-800 flex-1">{sv.name}</span>
                                  {linked && (
                                    <Link to={`/citizen/services/${sv.linkedIds![0]}`}
                                      className="flex items-center gap-1 text-[10px] text-[#1B3A5C] hover:underline shrink-0">
                                      <CheckCircle className="w-3 h-3" /> זמין
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

        {/* Algorithm */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h3 className="text-sm font-bold text-gray-900 mb-4">אלגוריתם התאמה — 5 שכבות</h3>
          <div className="space-y-2.5">
            {[
              { w: "40%", title: "מניעת הידרדרות", desc: "מה מוכח מחקרית שמעכב ירידה תפקודית, מותאם לגורמי סיכון מזוהים" },
              { w: "25%", title: "רצון ומוטיבציות", desc: "מה האדם רוצה, מה מתאים לאישיותו, מה מוכן להשקיע" },
              { w: "20%", title: "התאמה לפרופיל", desc: "יכולות פיזיות, קוגניטיביות, שפה, מגזר, מגבלות" },
              { w: "10%", title: "זמינות מעשית", desc: "קרבה גיאוגרפית, שעות, הסעות, עלות" },
              { w: "5%", title: "המלצות וניסיון", desc: "דירוגי משתמשים, המלצות מקצועיות" },
            ].map((l, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-11 h-6 rounded bg-[#1B3A5C]/10 flex items-center justify-center shrink-0">
                  <span className="text-[10px] font-bold text-[#1B3A5C]">{l.w}</span>
                </div>
                <div><p className="text-sm font-medium text-gray-900">{l.title}</p><p className="text-xs text-gray-500">{l.desc}</p></div>
              </div>
            ))}
          </div>
        </div>

        {/* Selection rules */}
        <div className="bg-[#1B3A5C]/5 border border-[#1B3A5C]/10 rounded-xl p-4 space-y-2">
          <p className="text-xs font-semibold text-[#1B3A5C]">כללי בחירה</p>
          <ul className="text-xs text-gray-600 space-y-1 list-disc list-inside">
            <li>מינימום שירות אחד מכל תחום</li>
            <li>מקסימום 8 שירותים פעילים במקביל</li>
            <li>אפשרות שינוי כל חודש עם ליווי</li>
            <li>עדיפות לשירותים מוכחי יעילות למניעת הידרדרות</li>
            <li>משקלות האלגוריתם נקבעים ע"י ועדת הסל אחת לחציון</li>
          </ul>
        </div>
      </main>
    </div>
  );
}
