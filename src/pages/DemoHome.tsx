/**
 * DemoHome — דף בית ראשי
 * נקי, מקצועי, חד. כל כפתור מוביל לגרסה הטובה ביותר של כל ממשק.
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Wallet, Phone, Heart, Building2, Users, ExternalLink } from "lucide-react";

const MODULES = [
  {
    num: 1,
    title: "ממשק האזרח הוותיק",
    description: "סל שירותים אישי, המלצות מותאמות, ארנק דיגיטלי",
    href: "https://libi-sal-ishi.vercel.app/",
    external: true,
    icon: Phone,
  },
  {
    num: 2,
    title: "מערכת המלווה החברתית",
    description: "75 אזרחים, SDI/RDI, משימות יומיות, ניטור הידרדרות",
    href: "https://avi1840.github.io/SAL-ISHI-SIUD/",
    external: true,
    icon: Heart,
  },
  {
    num: 3,
    title: "מלווה מורחב — AI ואייג'נטים",
    description: "קטלוג 102 שירותים, 5 אייג'נטים, אינטייק AI, אלגוריתם",
    href: "/coordinator",
    external: false,
    icon: Building2,
  },
  {
    num: 4,
    title: "דשבורד ניהולי",
    description: "KPIs, מפת פיילוטים, 286 אזרחים, תקציב, בקרה",
    href: "/executive",
    external: false,
    icon: Users,
  },
  {
    num: 5,
    title: "פורטל ספקי שירות",
    description: "הזמנות, שירותים, תשלומים, דירוגים",
    href: "/providers",
    external: false,
    icon: Wallet,
  },
];

export default function DemoHome() {
  const [clickCount, setClickCount] = useState(0);
  const [showHackathon, setShowHackathon] = useState(false);

  const handleLogoClick = () => {
    const n = clickCount + 1;
    setClickCount(n);
    if (n >= 3) { setShowHackathon(true); setClickCount(0); }
    setTimeout(() => { if (n < 3) setClickCount(0); }, 2000);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white">

      {/* Hero */}
      <div className="bg-[#1B3A5C] text-white">
        <div className="max-w-4xl mx-auto px-6 py-14 text-center">
          <div
            className="w-12 h-12 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-5 cursor-pointer select-none"
            onClick={handleLogoClick}
          >
            <Wallet className="w-6 h-6 text-white/80" />
          </div>
          <h1 className="text-3xl font-bold">סל אישי</h1>
          <p className="text-lg text-white/70 mt-1">להזדקנות מיטבית</p>
          <p className="text-sm text-white/40 mt-4 max-w-lg mx-auto">
            מנגנון יישום מבוקר להרחבת שירותי מניעה · פיילוט פסגת זאב · 286 אזרחים
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-white/30">
            <span>ביטוח לאומי</span>
            <span>·</span>
            <span>משרד האוצר</span>
            <span>·</span>
            <span>החלטות ממשלה 127, 150</span>
          </div>
        </div>
      </div>

      {/* Modules */}
      <div className="max-w-4xl mx-auto px-6 -mt-6 pb-16">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const content = (
              <div className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-[#1B3A5C]/40 hover:shadow-md transition-all h-full">
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-lg bg-[#1B3A5C]/5 flex items-center justify-center shrink-0">
                    <Icon className="w-5 h-5 text-[#1B3A5C]" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#1B3A5C] transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-xs text-gray-500 mt-1">{mod.description}</p>
                    <span className="mt-3 inline-flex items-center gap-1 text-xs text-[#1B3A5C] font-medium">
                      כניסה {mod.external && <ExternalLink className="w-3 h-3" />}
                    </span>
                  </div>
                  <span className="w-7 h-7 rounded-full bg-emerald-600/10 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0">
                    {mod.num}
                  </span>
                </div>
              </div>
            );

            if (mod.external) {
              return (
                <a key={mod.title} href={mod.href} target="_blank" rel="noopener noreferrer">
                  {content}
                </a>
              );
            }
            return (
              <Link key={mod.title} to={mod.href}>
                {content}
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center mt-12 text-xs text-gray-400">
          <p>פיילוט ירושלים — 5 שכונות · 102 שירותים · אלגוריתם 5 שכבות · 5 אייג'נטים AI</p>
        </div>

        {/* Hackathon hidden */}
        {showHackathon && (
          <div className="mt-8 p-4 rounded-xl border border-dashed border-[#1B3A5C]/30 bg-[#1B3A5C]/5 text-center">
            <Link to="/hackathon" className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B3A5C] text-white rounded-lg text-sm font-medium hover:bg-[#15304d] transition-colors">
              דף האקתון AWS
            </Link>
            <button onClick={() => setShowHackathon(false)} className="block mx-auto mt-2 text-[10px] text-gray-400">סגור</button>
          </div>
        )}
      </div>
    </div>
  );
}
