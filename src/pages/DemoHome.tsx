/**
 * DemoHome — Landing page
 * Visual architecture: צורך → פתרון → ערך → כניסה
 * Images: trust-building, not decorative
 */
import { useState, type ReactNode } from "react";
import { Link } from "react-router-dom";
import { SHOW_DEMO_LAYERS } from "@/lib/edition";
import { catalogState } from "@/data/catalogSource";
import { realServices } from "@/data/realServices";
import { buildCaseload } from "@/pilot/caseload";
import { appSettings } from "@/pilot/settings";
import { DemoControls } from "@/pilot/components/DemoControls";
import { resetDemo } from "@/pilot/reset";
import { prepareOffline } from "@/pilot/offline";
import {
  Wallet, Phone, Heart, Building2, Users,
  ChevronLeft, CheckCircle, AlertCircle, TrendingUp, Brain,
  Play, MapPin,
} from "lucide-react";

// מספרים מהקטלוג, מה-seed ומ-app-settings.json, לא בקוד (0.5).
const caseloadSize = () => buildCaseload().length;

const MODULES = () => [
  {
    num: "01", title: "ממשק האזרח הוותיק",
    description: "סל שירותים אישי, המלצות מוסברות, ארנק בשקלים, הזמנה וביטול",
    href: "/citizen", external: false, icon: Phone,
    badge: "65+", badgeCls: "bg-blue-50 border-blue-200 text-blue-700",
  },
  {
    num: "02", title: "מערכת המלווה החברתית",
    description: `${caseloadSize()} אזרחים בתיק, מי דורש פנייה היום, פגישה משותפת ומעקב חודשי`,
    href: "/coordinator", external: false, icon: Heart,
    badge: "יומי", badgeCls: "bg-emerald-50 border-emerald-200 text-emerald-700",
  },
  {
    num: "03", title: "דשבורד ניהולי",
    description: "מדדים, מפת פיילוטים וקטלוג הסל",
    href: "/executive", external: false, icon: Building2,
    badge: "מנהלים", badgeCls: "bg-amber-50 border-amber-200 text-amber-700",
  },
  {
    num: "04", title: "פורטל ספקי שירות",
    description: "קליטה לפי תקן קליטת המפעילים ובדיקת השלמות",
    href: "/providers", external: false, icon: Users,
    badge: "ספקים", badgeCls: "bg-gray-50 border-gray-200 text-gray-600",
  },
  // האטלס והקטלוג הם אתרים נפרדים באותו פרסום (dist/field, dist/hq), ולכן קישור רגיל ולא Link.
  {
    num: "05", title: "אטלס וקטלוג - שטח",
    description: "רכזת ומנהלת שכונה: אטלס ספקים, קטלוג לשכונה, מבחן כיסוי, חבילת פיילוט",
    href: "./field/", external: true, icon: MapPin,
    badge: "רשויות", badgeCls: "bg-sky-50 border-sky-200 text-sky-700",
  },
  {
    num: "06", title: "אטלס וקטלוג - מטה",
    description: "איחוד פיילוטים, תמונה ארצית, מחירי ייחוס, כללים וייצוא לאינטגרטור",
    href: "./hq/", external: true, icon: Building2,
    badge: "ביטוח לאומי", badgeCls: "bg-sky-50 border-sky-200 text-sky-700",
  },
];

const STATS = () => [
  { num: `₪${catalogState.seed.settings.personal_wallet / (catalogState.seed.settings.points_per_shekel || 1)}`, label: "סל אישי לחודש", sub: "לכל אזרח" },
  { num: String(realServices.length), label: "שירותים בקטלוג", sub: "מאושרים" },
  { num: String(catalogState.neighborhoods), label: "שכונות", sub: "בקטלוג" },
  { num: String(appSettings.program.pilot_participants), label: "אזרחים בפיילוט", sub: "פסגת זאב" },
];

const SERVICES_GRID = [
  { label: "מיצוי זכויות",   img: "./images/volunteering.png" },
  { label: "שירה ומוזיקה",   img: "./images/choir.png" },
  { label: "בריאות ופעילות", img: "./images/exercise-weights.png" },
  { label: "חיבור משפחתי",   img: "./images/telemedicine.png" },
  { label: "יצירה ואמנות",   img: "./images/art-class.png" },
  { label: "קהילה ושייכות",  img: "./images/community-club.png" },
];

function BeforeDemo() {
  const [msg, setMsg] = useState<string | null>(null);
  return (
    <section className="bg-gray-50 border-t border-gray-200" aria-labelledby="before-demo">
      <div className="max-w-5xl mx-auto px-6 py-8 space-y-4">
        <h2 id="before-demo" className="text-lg font-bold text-gray-900">לפני ההדגמה</h2>
        <div className="flex flex-wrap gap-3">
          <button type="button" className="min-h-[48px] px-5 rounded-xl bg-[#1B3A5C] text-white font-semibold" onClick={async () => { await resetDemo(); setMsg("ההדגמה אופסה. נתוני הפתיחה נטענו מחדש."); }}>
            איפוס ההדגמה
          </button>
          <button type="button" className="min-h-[48px] px-5 rounded-xl border border-[#1B3A5C]/30 text-[#1B3A5C] font-semibold bg-white" onClick={async () => setMsg(await prepareOffline())}>
            הכנה לעבודה בלי אינטרנט
          </button>
        </div>
        {msg ? <p role="status" className="text-sm text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-3 py-2">{msg}</p> : null}
        <div className="pilot legacy-skin"><DemoControls /></div>
      </div>
    </section>
  );
}

export default function DemoHome() {
  const [clicks, setClicks] = useState(0);
  const [showHackathon, setShowHackathon] = useState(false);

  const handleLogoClick = () => {
    const n = clicks + 1;
    setClicks(n);
    if (n >= 3 && SHOW_DEMO_LAYERS) { setShowHackathon(true); setClicks(0); }
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
              מנוע התאמה שמציע לכל אזרח ותיק שירותי מניעה לפי מה שחשוב לו, ומסביר
              במשפט אחד למה כל שירות הומלץ.
            </p>

            <div className="mt-7 flex flex-wrap items-center gap-3">
              <Link
                to="/citizen"
                className="inline-flex items-center gap-2 px-6 min-h-[48px] rounded-xl bg-white text-[#1B3A5C] font-bold text-base hover:bg-white/90 transition-colors shadow-lg"
              >
                שרה, אזרחית ותיקה <ChevronLeft className="w-4 h-4" />
              </Link>
              <Link
                to="/coordinator"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-sm hover:bg-white/20 transition-colors"
              >
                רונית, מלווה <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
              <a
                href={import.meta.env.DEV ? "http://localhost:5175/" : "./hq/"}
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-white/10 border border-white/20 text-white font-medium text-sm hover:bg-white/20 transition-colors"
              >
                גורם מטה <ChevronLeft className="w-3.5 h-3.5" />
              </a>
              <Link
                to="/scope"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-white/90 underline underline-offset-4 font-medium text-sm"
              >
                מה הכלי כן ולא עושה
              </Link>
            </div>

            <div className="mt-6 inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-white/8 border border-white/12">
              <MapPin className="w-3.5 h-3.5 text-white/50" />
              <span className="text-xs text-white/70">פיילוט פסגת זאב, ירושלים</span>
            </div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="relative border-t border-white/10 bg-black/20">
          <div className="max-w-5xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 divide-x divide-x-reverse divide-white/10">
            {STATS().map((s) => (
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
              רוב תקציב הסיעוד מופנה היום לשירותי בית, ומעט ממנו לשירותים שמונעים הידרדרות [לאמת].
            </p>
            <div className="mt-5 space-y-2.5">
              {[
                `בסל החדש ${catalogState.seed.settings.total} ש"ח לחודש לאזרח: ${catalogState.seed.settings.personal_wallet} לסל האישי, והשאר לליווי, לקהילה ולתקורה`,
                "שירותי מניעה, שייכות ותנועה כמעט לא היו בסל",
                "לא היה ליווי אישי ולא התאמה למה שחשוב לאדם",
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
          <h2 className="text-2xl font-bold text-gray-900">{realServices.length} שירותי מניעה, מותאמים אישית</h2>
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
            { icon: Brain,      title: "המלצה מוסברת",    desc: "כל המלצה עם משפט אחד שמסביר למה, מחמש שכבות שמשקלן בהגדרות" },
            { icon: TrendingUp, title: "מניעה, לא תגובה",  desc: "המלווה רואה כל בוקר מי דורש פנייה, לפי כללים ברורים" },
            SHOW_DEMO_LAYERS
              ? { icon: CheckCircle, title: "פיילוט", desc: `${appSettings.program.pilot_participants} אזרחים בפיילוט פסגת זאב` }
              : { icon: CheckCircle, title: "גרסת תצוגה", desc: "כל הנתונים במערכת הזו סינתטיים, לצורך התרשמות ומשוב" },
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
            <h2 className="text-xl font-bold text-gray-900">{MODULES().length} ממשקים, לכל שחקן במערכת</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {MODULES().map((mod) => {
              const Icon = mod.icon;
              const Wrapper = ({ children }: { children: ReactNode }) =>
                mod.external ? <a href={mod.href}>{children}</a> : <Link to={mod.href}>{children}</Link>;
              return (
                <Wrapper key={mod.title}>
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
                          כניסה <ChevronLeft className="w-3 h-3" />
                        </span>
                      </div>
                    </div>
                  </div>
                </Wrapper>
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
              קהילה, שייכות ותנועה. לכל אחד לפי מה שחשוב לו.
            </p>
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
          <p className="text-xs text-white/70">פיילוט ירושלים · {catalogState.neighborhoods} שכונות · {realServices.length} שירותים</p>
          <Link to="/scope" className="text-xs text-white/80 underline underline-offset-4">מה הכלי כן ולא עושה</Link>
        </div>
      </footer>

      {/* לפני ההדגמה: איפוס, עבודה בלי אינטרנט ומצבי קצה */}
      <BeforeDemo />

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
