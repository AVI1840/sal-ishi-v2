/**
 * DemoHome — דף בית ראשי
 * "סל אישי — להזדקנות מיטבית"
 * נקי, מקצועי, ממשלתי
 */
import { Link } from "react-router-dom";
import { Users, Phone, Building2, Heart, Wallet, Bot } from "lucide-react";

const MODULES = [
  {
    to: "/citizen",
    title: "ממשק אזרח",
    subtitle: "שירותים מותאמים אישית",
    description: "סל שירותים, קטלוג, התאמה לפי אלגוריתם, שיחה עם מלווה",
    icon: Phone,
    color: "#e11d48",
    persona: "שרה, בת 78, פסגת זאב",
  },
  {
    to: "/coordinator",
    title: "דשבורד מתאמת",
    subtitle: "לוח בקרה למתאמת חברתית",
    description: "ניהול 286 אזרחים, מיפוי שירותים, המלצות AI, ניטור הידרדרות",
    icon: Heart,
    color: "#1B3A5C",
    persona: "רונית, מתאמת חברתית",
  },
  {
    to: "/executive",
    title: "דשבורד ניהולי",
    subtitle: "מבט על לסמנכ״ל",
    description: "KPIs לאומיים, מפת פיילוטים, בקרת איכות",
    icon: Building2,
    color: "#7c3aed",
    persona: "מנהל בכיר, ביטוח לאומי",
  },
  {
    to: "/providers",
    title: "פורטל ספקים",
    subtitle: "ניהול שירותים והזמנות",
    description: "הזמנות, שירותים, תשלומים, דירוגים",
    icon: Users,
    color: "#059669",
    persona: "מתנ״ס פסגת זאב",
  },
];

export default function DemoHome() {
  return (
    <div dir="rtl" className="min-h-screen bg-gray-50">

      {/* Hero */}
      <div className="bg-[#1B3A5C] text-white">
        <div className="max-w-5xl mx-auto px-6 py-14 text-center">
          <div className="w-14 h-14 rounded-2xl bg-white/10 flex items-center justify-center mx-auto mb-5">
            <Wallet className="w-7 h-7" />
          </div>
          <h1 className="text-4xl font-bold">סל אישי</h1>
          <p className="text-xl text-white/80 mt-2">להזדקנות מיטבית</p>
          <p className="text-sm text-white/50 mt-4 max-w-lg mx-auto">
            פלטפורמה ממשלתית לליווי אזרחים ותיקים — התאמת שירותים אישית, מניעת הידרדרות, שימור עצמאות
          </p>
          <div className="flex items-center justify-center gap-6 mt-6 text-xs text-white/40">
            <span>ביטוח לאומי</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>משרד האוצר</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>286 משתתפים</span>
            <span className="w-1 h-1 rounded-full bg-white/30" />
            <span>פיילוט ירושלים</span>
          </div>
        </div>
      </div>

      {/* Module Cards */}
      <div className="max-w-5xl mx-auto px-6 -mt-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.to}
                to={mod.to}
                className="group bg-white rounded-xl border border-gray-100 p-5 hover:shadow-lg hover:-translate-y-0.5 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="w-11 h-11 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${mod.color}15` }}>
                    <Icon className="w-5 h-5" style={{ color: mod.color }} />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-[#1B3A5C] transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-sm text-gray-500 mt-0.5">{mod.subtitle}</p>
                    <p className="text-xs text-gray-400 mt-2">{mod.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center text-[9px] font-bold text-gray-600">
                        {mod.persona[0]}
                      </div>
                      <span className="text-[11px] text-gray-400">{mod.persona}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center py-10 space-y-3">
          <p className="text-xs text-gray-400">
            פיילוט ירושלים — 5 שכונות · 102 שירותים ממופים · אלגוריתם 5 שכבות
          </p>
          <p className="text-[10px] text-gray-300">
            החלטות ממשלה 127 ו-150 · מפת מדדים לאומיים להזדקנות מיטבית
          </p>
        </div>
      </div>
    </div>
  );
}
