/**
 * DemoHome — Landing page
 * Visual architecture: צורך → פתרון → ערך → כניסה
 * Images: trust-building, not decorative
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Wallet, ExternalLink, Phone, Heart, Building2, Users,
  ChevronLeft, CheckCircle, AlertCircle, TrendingUp, Brain,
  Play, MapPin,
} from "lucide-react";

const MODULES = [
  {
    num: "01", title: "ממשק האזרח הוותיק",
    description: "סל שירותים אישי, המלצות AI מוסברות, ארנק דיגיטלי",
    href: "https://libi-sal-ishi.vercel.app/", external: true, icon: Phone,
    badge: "65+", badgeCls: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    num: "02", title: "מערכת המלווה החברתית",
    description: "75 אזרחים, SDI/RDI, משימות יומיות, ניטור הידרדרות",
    href: "https://avi1840.github.io/SAL-ISHI-SIUD/", external: true, icon: Heart,
    badge: "יומי", badgeCls: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  {
    num: "03", title: "מלווה מורחב — AI ואייג'נטים",
    description: "102 שירותים, 5 אייג'נטים, אינטייק AI, אלגוריתם 5 שכבות",
    href: "/coordinator", external: false, icon: Brain,
    badge: "AI", badgeCls: "bg-purple-50 border-purple-200 text-purple-700",
  },
  {
    num: "04", title: "דשבורד ניהולי",
    description: "KPIs, מפת פיילוטים, 286 אזרחים, תקציב, בקרה",
    href: "/executive", external: false, icon: Building2,
    badge: "מנהלים", badgeCls: "bg-amber-50 border-amber-200 text-amber-700",
  },
  {
    num: "05", title: "פורטל ספקי שירות",
    description: "הזמנות, שירותים, תשלומים, דירוגים",
    href: "/providers", external: false, icon: Users,
    badge: "ספקים", badgeCls: "bg-gray-50 border-gray-200 text-gray-600",
  },
];

const STATS = [
  { num: "220K", label: "זכאי סיעוד",         sub: "בישראל" },
  { num: "80%",  label: "לשירותי בית",         sub: "לא למניעה" },
  { num: "₪20B", label: "תקציב שנתי",          sub: "רפורמה" },
  { num: "286",  label: "אזרחים בפיילוט",       sub: "פסגת זאב" },
];

const SERVICES_GRID = [
  { label: "מיצוי זכויות",   img: "./images/volunteering.png" },
  { label: "שירה ומוזיקה",   img: "./images/choir.png" },
  { label: "בריאות ופעילות", img: "./images/exercise-weights.png" },
  { label: "חיבור משפחתי",   img: "./images/telemedicine.png" },
  { label: "יצירה ואמנות",   img: "./images/art-class.png" },
  { label: "קהילה ושייכות",  img: "./images/community-club.png" },
];

export default function DemoHome() {
  const [clicks, setClicks] = useState(0);
  const [showHackathon, setShowHackathon] = useState(false);

  const handleLogoClick = () => {
    const n = clicks + 1;
    setClicks(n);
    if (n >= 3) { setShowHackathon(true); setClicks(0); }
    setTimeout(() => { if (n < 3) setClicks(0); }, 2000);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-white">

      {/* ── HERO ── */}
      <section className="relative bg-[#1B3A5C] overflow-hidden">
        <div className="absolute inset-0">
          <img
            src="./images/activities-hero.png"
            alt="אזרחים ותיקים פעילים בקהילה"
            className="w-full h-full object-cover opacity-20"
          />
          <div className="absolute inset-0 bg-gradient-to-l from-[#1B3A5C]/95 via-[#1B3A5C]/70 to-[#1B3A5C]/50" />
        </div>

        <div className="relative max-w-5xl mx-auto px-6 py-16">
          <div className="max-w-2xl">
            <div
              className="inline-flex items-center gap-2.5 cursor-pointer select-none mb-6"
              onClick={handleLogoClick}
            >
              <div className="w-10 h-10 rounded-xl bg-white/15 flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <span className="text-white font-bold text-lg">סל אישי</span>
            </div>

            <h1 className="text-4xl md:text-5xl font-bold text-white leading-tight">
              הזדקנות מיטבית
              <br />
              <span className="text-white/60">מתחילה בהתאמה אישית</span>
            </h1>
            <p className="mt-4 text-base text-white/65 leading-relaxed max-w-lg">
              מנגנון AI שמתאים שירותי מניעה לכל אזרח ותיק לפי פרופיל ייחודי —
              ומסביר בדיוק למה כל שירות הומלץ.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/demo"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white text-[#1B3A5C] font-bold text-sm hover:bg-white/90 transition-colors shadow-lg animate-pulse hover:animate-none"
              >
                <Play className="w-4 h-4 fill-current" /> ▶ דמו 30 שניות
              </Link>
              <Link
                to="/coordinator"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-sm hover:bg-white/20 transition-colors"
              >
                ממשק מלווה <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
              <a
                href="https://libi-sal-ishi.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-sm hover:bg-white/20 transition-colors"
              >
                ממשק האזרח <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/8 border border-white/12">
              <MapPin className="w-3.5 h-3.5 text-white/50" />
              <span className="text-xs text-white/50">פיילוט חי — פסגת זאב, ירושלים · החלטות ממשלה 127 ו-150</span>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-black/20">
          <div className="max-w-5xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 divide-x divide-x-reverse divide-white/10">
            {STATS.map((s) => (
              <div key={s.num} className="px-6 text-center first:pr-0 last:pl-0">
                <div className="text-2xl font-bold text-white">{s.num}</div>
                <div className="text-xs text-white/60 mt-0.5">{s.label}</div>
                <div className="text-[10px] text-white/30">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── PROBLEM + IMAGE ── */}
      <section className="bg-gray-50 border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
          <div>
            <span className="text-xs font-bold uppercase tracking-widest text-red-400 mb-3 block">הבעיה</span>
            <h2 className="text-2xl font-bold text-gray-900 leading-tight">
              הכסף מנוצל — אבל ל-בית ולניקיון, לא למניעת הידרדרות
            </h2>
            <p className="mt-3 text-sm text-gray-500 leading-relaxed">
              80% מתקציב הסיעוד הולך לשירותי בית (ניקיון, ליווי).
              שירותי מניעה שמפחיתים אשפוזים ב-30-40% — כמעט לא מקבלים מימון.
            </p>
            <div className="mt-5 space-y-2.5">
              {[
                "ממוצע 760₪/חודש לאזרח — אך 80% לניקיון, לא לשייכות",
                "שירותי מניעה = ירידת 30-40% באשפוזים — לא בסל",
                "אין ליווי אישי, אין ניטור, אין התאמה לפרופיל",
              ].map((p) => (
                <div key={p} className="flex items-start gap-2.5">
                  <AlertCircle className="w-4 h-4 text-red-400 mt-0.5 shrink-0" />
                  <span className="text-sm text-gray-600">{p}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden h-64 shadow-md group">
            <img
              src="./images/volunteering.png"
              alt="יחד בקהילה"
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
            <div className="absolute bottom-4 right-4">
              <p className="text-white text-sm font-bold">יחד בקהילה</p>
              <p className="text-white/60 text-xs">מתנדבים עזרה לתקווה</p>
            </div>
          </div>
        </div>
      </section>

      {/* ── SERVICE IMAGE GRID ── */}
      <section className="max-w-5xl mx-auto px-6 py-12">
        <div className="text-center mb-8">
          <span className="text-xs font-bold uppercase tracking-widest text-[#1B3A5C]/50 mb-2 block">הפתרון</span>
          <h2 className="text-2xl font-bold text-gray-900">102 שירותי מניעה — מותאמים אישית</h2>
          <p className="mt-2 text-sm text-gray-500 max-w-md mx-auto">
            כל שירות מדורג לפי 5 שכבות: מניעה · מוטיבציה · פרופיל · קרבה · הוכחה חברתית
          </p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {SERVICES_GRID.map((s) => (
            <div key={s.label} className="relative rounded-xl overflow-hidden group cursor-pointer shadow-sm" style={{ aspectRatio: "16/9" }}>
              <img
                src={s.img}
                alt={s.label}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/10 to-transparent" />
              <div className="absolute bottom-2.5 right-3">
                <p className="text-white text-xs font-bold drop-shadow-sm">{s.label}</p>
              </div>
            </div>
          ))}
        </div>

        {/* Value props row */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          {[
            { icon: Brain,      title: "AI מוסבר",        desc: "כל המלצה מפורקת ל-5 שכבות — ניתן לסמוך ולתקן" },
            { icon: TrendingUp, title: "מניעה, לא תגובה",  desc: "5 אייג'נטים מנטרים 24/7 ומתריעים לפני הידרדרות" },
            { icon: CheckCircle,title: "פיילוט חי",        desc: "286 אזרחים ממשיים, פסגת זאב — לא PoC" },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="flex items-start gap-3 p-4 rounded-xl bg-[#1B3A5C]/[0.03] border border-[#1B3A5C]/10">
              <div className="w-9 h-9 rounded-lg bg-[#1B3A5C]/10 flex items-center justify-center shrink-0">
                <Icon className="w-4 h-4 text-[#1B3A5C]" />
              </div>
              <div>
                <p className="text-sm font-bold text-gray-900">{title}</p>
                <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ── MODULE CARDS ── */}
      <section className="bg-gray-50 border-t border-gray-100">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <div className="mb-6">
            <span className="text-xs font-bold uppercase tracking-widest text-[#1B3A5C]/50 mb-2 block">הממשקים</span>
            <h2 className="text-xl font-bold text-gray-900">5 ממשקים — לכל שחקן במערכת</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MODULES.map((mod) => {
              const Icon = mod.icon;
              const inner = (
                <div className="group bg-white border border-gray-200 rounded-xl p-5 hover:border-[#1B3A5C]/40 hover:shadow-md transition-all h-full">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 rounded-lg bg-[#1B3A5C]/5 flex items-center justify-center shrink-0">
                      <Icon className="w-5 h-5 text-[#1B3A5C]" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[10px] text-gray-400 font-bold">{mod.num}</span>
                        <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold border ${mod.badgeCls}`}>{mod.badge}</span>
                      </div>
                      <h3 className="text-sm font-bold text-gray-900 group-hover:text-[#1B3A5C] transition-colors">
                        {mod.title}
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">{mod.description}</p>
                      <span className="mt-3 inline-flex items-center gap-0.5 text-xs text-[#1B3A5C] font-medium">
                        כניסה {mod.external && <ExternalLink className="w-3 h-3" />}
                        <ChevronLeft className="w-3 h-3" />
                      </span>
                    </div>
                  </div>
                </div>
              );

              return mod.external ? (
                <a key={mod.title} href={mod.href} target="_blank" rel="noopener noreferrer">{inner}</a>
              ) : (
                <Link key={mod.title} to={mod.href}>{inner}</Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── FULL-WIDTH COMMUNITY PHOTO ── */}
      <section className="relative h-44 md:h-56 overflow-hidden">
        <img
          src="./images/community-club.png"
          alt="קהילה חיה ופעילה — מתנס נווה יעקב"
          className="w-full h-full object-cover object-top"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#1B3A5C]/85 via-[#1B3A5C]/40 to-transparent" />
        <div className="absolute inset-0 flex items-center">
          <div className="max-w-5xl mx-auto px-6">
            <p className="text-white text-xl md:text-2xl font-bold max-w-xs leading-snug">
              "קהילה תומכת מאריכה חיים"
            </p>
            <p className="text-white/55 text-xs mt-1.5">Harvard School of Public Health</p>
          </div>
        </div>
      </section>

      {/* ── FOOTER ── */}
      <footer className="bg-[#1B3A5C] text-white">
        <div className="max-w-5xl mx-auto px-6 py-8 flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center">
              <Wallet className="w-4 h-4" />
            </div>
            <div>
              <p className="text-sm font-bold">סל אישי</p>
              <p className="text-[10px] text-white/40">להזדקנות מיטבית</p>
            </div>
          </div>
          <p className="text-xs text-white/30">פיילוט ירושלים · 5 שכונות · 102 שירותים · 5 אייג'נטים AI</p>
          <p className="text-[10px] text-white/25">
            Powered by <span className="text-[#FF9900] font-semibold">Amazon Bedrock</span> · Transcribe · Personalize
          </p>
        </div>
      </footer>

      {/* Hidden hackathon entry */}
      {showHackathon && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 p-4 rounded-xl border border-dashed border-[#1B3A5C]/30 bg-white shadow-xl text-center">
          <Link
            to="/hackathon"
            className="inline-flex items-center gap-2 px-5 py-2.5 bg-[#1B3A5C] text-white rounded-lg text-sm font-bold hover:bg-[#15304d] transition-colors"
          >
            <Play className="w-4 h-4 fill-current" /> דף האקתון AWS
          </Link>
          <button onClick={() => setShowHackathon(false)} className="block mx-auto mt-2 text-[10px] text-gray-400">
            סגור
          </button>
        </div>
      )}
    </div>
  );
}
