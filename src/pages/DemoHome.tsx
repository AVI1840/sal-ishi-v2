/**
 * DemoHome — דף בית ראשי
 * עיצוב כהה/כחול premium — כמו libi-landing
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { Wallet } from "lucide-react";

const MODULES = [
  {
    num: 1,
    to: "/citizen",
    title: "ממשק האזרח הוותיק",
    description: "סל שירותים אישי, המלצות מותאמות, שיחה עם מלווה",
    cta: "כניסה לממשק",
  },
  {
    num: 2,
    to: "/coordinator",
    title: "מערכת המלווה החברתית",
    description: "ניהול 286 אזרחים, ניטור הידרדרות, אייג'נטים AI",
    cta: "כניסה למערכת",
  },
  {
    num: 3,
    to: "/providers",
    title: "פורטל ספקי שירות",
    description: "ניהול שירותים, הזמנות, תשלומים, דירוגים",
    cta: "כניסה לפורטל",
  },
  {
    num: 4,
    to: "/executive",
    title: "ניהול פיילוט ורשות",
    description: "KPIs, מפת אתרים, בקרה, תקציב, מדדי ביצוע",
    cta: "כניסה לניהול",
  },
];

const FEATURES = [
  "קטלוג 102 שירותים ממופים ב-5 שכונות",
  "אלגוריתם התאמה 5 שכבות (מניעה 40%, מוטיבציות 25%, פרופיל 20%, קרבה 10%, המלצות 5%)",
  "5 אייג'נטים AI אוטונומיים — סריקה, התאמה, ניטור, nudges, ניהול",
  "ממשק אינטייק עם תמלול AI (Amazon Transcribe)",
  "מדדי SDI/RDI — ניטור הידרדרות בזמן אמת",
  "צ'אט AI (לימור) — מלווה דיגיטלית לאזרח",
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
    <div dir="rtl" className="min-h-screen bg-[#0a1628] text-white">

      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5">
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={handleLogoClick}>
          <div className="w-10 h-10 rounded-xl bg-[#1B3A5C] border border-white/10 flex items-center justify-center">
            <Wallet className="w-5 h-5 text-white/80" />
          </div>
          <span className="text-base font-bold text-white/90">סל אישי</span>
        </div>
      </header>

      {/* Hero */}
      <main className="max-w-5xl mx-auto px-8 pt-8 pb-16">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-black leading-tight">
            סל אישי — להזדקנות מיטבית
          </h1>
          <p className="text-base text-white/50 mt-4 max-w-2xl mx-auto">
            מנגנון יישום מבוקר להרחבת שירותי מניעה לאזרחים ותיקים
          </p>
          <p className="text-sm text-white/30 mt-3">
            פיילוט פסגת זאב — 286 אזרחים · 5 שכונות · 102 שירותים
          </p>
          <div className="flex items-center justify-center gap-4 mt-4 text-xs text-white/25">
            <span>ביטוח לאומי</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>מינהל גמלאות</span>
            <span className="w-1 h-1 rounded-full bg-white/20" />
            <span>משרד האוצר</span>
          </div>
        </div>

        {/* Module Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-16">
          {MODULES.map((mod) => (
            <Link
              key={mod.to}
              to={mod.to}
              className="group bg-[#111d33] border border-white/10 rounded-xl p-6 hover:border-white/25 hover:bg-[#152240] transition-all"
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-bold text-white group-hover:text-blue-300 transition-colors">{mod.title}</h3>
                  <p className="text-sm text-white/40 mt-1">{mod.description}</p>
                </div>
                <span className="w-8 h-8 rounded-full bg-emerald-600/20 text-emerald-400 flex items-center justify-center text-sm font-bold shrink-0">
                  {mod.num}
                </span>
              </div>
              <span className="text-xs text-blue-400 font-medium group-hover:text-blue-300 transition-colors flex items-center gap-1">
                {mod.cta} ←
              </span>
            </Link>
          ))}
        </div>

        {/* What's included */}
        <div className="bg-[#111d33] border border-white/10 rounded-xl p-6">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-blue-400" />
            <h2 className="text-sm font-bold text-white/80">מה מוצג במערכת</h2>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {FEATURES.map((f, i) => (
              <div key={i} className="flex items-start gap-2 text-sm text-white/50">
                <span className="text-white/20 mt-0.5 shrink-0">—</span>
                <span>{f}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-12 space-y-2">
          <p className="text-xs text-white/20">
            החלטות ממשלה 127 ו-150 · מפת מדדים לאומיים להזדקנות מיטבית
          </p>
          <p className="text-[10px] text-white/15">
            Powered by Amazon Bedrock · Transcribe · Personalize
          </p>
        </div>

        {/* Hidden hackathon */}
        {showHackathon && (
          <div className="mt-8 p-5 rounded-xl border border-dashed border-blue-500/30 bg-blue-950/20 text-center">
            <p className="text-xs text-white/50 mb-3">גישה מהירה</p>
            <Link to="/hackathon" className="inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-500 transition-colors">
              דף האקתון AWS
            </Link>
            <button onClick={() => setShowHackathon(false)} className="block mx-auto mt-3 text-[10px] text-white/30 hover:text-white/60">סגור</button>
          </div>
        )}
      </main>
    </div>
  );
}
