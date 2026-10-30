/**
 * דף הבית: סיפור אחד, שלוש דלתות. האדם במרכז, ושלוש הדלתות הן מערכת אחת: בחירה,
 * ליווי ולמידה מערכתית. כל מספר מההגדרות, מהקטלוג או מ-app-settings.json, ומספר
 * שלא אומת מסומן [לאמת]. כלי ההדגמה (איפוס, מצבי קצה) בתפריט "הדגמה" שבפס העליון.
 */
import type { MouseEvent } from "react";
import { Link } from "react-router-dom";
import { BookOpen, Building2, ChevronLeft, Compass, FileJson, Heart, HeartHandshake, LineChart, MapPin, Network, Phone, Scale, ShieldCheck, Sprout, Store, UserRound, Wallet } from "lucide-react";
import { catalogState } from "@/data/catalogSource";
import { realServices } from "@/data/realServices";
import { appSettings, shownBackground } from "@/pilot/settings";

const basket = () => catalogState.seed.settings as unknown as Record<"total" | "personal_wallet", number>;

const DOORS = () => [
  {
    to: "/citizen",
    icon: Phone,
    role: "בחירה",
    who: "שרה, 78, פסגת זאב",
    title: "האזרחית",
    text: `${basket().personal_wallet} נקודות לבחירת שירותים בקהילה, לפי מה שחשוב לה.`,
    note: null as string | null,
    img: "./images/choir.png",
  },
  {
    to: "/coordinator",
    icon: Heart,
    role: "ליווי",
    who: appSettings.companion.name,
    title: "המלווה החברתית קהילתית",
    text: "ניהול תיקי האזרחים, זיהוי מי זקוק לפנייה היום, וחיבור בין צורכי האנשים לשירותים בקהילה.",
    note: null,
    img: "./images/community-club.png",
  },
  {
    to: "/executive",
    icon: Building2,
    role: "למידה מערכתית",
    who: "כיום: ביטוח לאומי וירושלים",
    title: "המטה",
    text: "כללים וקטלוג שירותים, זיהוי פערים בשכונות, עבודה מול ספקים ולמידה מהשטח. מיקוד בתפקיד, באתגר ובהזדמנות של כל שותף.",
    note: "בהרחבה המערכתית: משרד הרווחה, רשויות מקומיות, מערכת הבריאות, קופות החולים ומשרד האוצר.",
    img: "./images/services-mosaic.png",
  },
];

const STEPS = () => [
  { icon: ShieldCheck, title: "הצטרפות לתכנית", text: "אזרח ותיק הזכאי לגמלת סיעוד מצטרף לתכנית." },
  { icon: HeartHandshake, title: "היכרות וליווי (אינטייק)", text: "מבררים מה חשוב לאדם, מה מתאים לו, מה הוא רוצה וצריך: מוטיבציות, כוחות, יעדים ואתגרים." },
  { icon: Wallet, title: "סל אישי להזדקנות מיטבית", text: `ארנק חודשי של ${basket().personal_wallet} נקודות בתרחיש ההדגמה. נקודה אחת שווה שקל.` },
  { icon: MapPin, title: "בחירת שירותים", text: "בחירה מתוך קטלוג שירותים מקומי, לפי התאמה, נגישות וזמינות." },
  { icon: LineChart, title: "למידה ושיפור", text: "המדינה מזהה פערים, עוקבת אחר השימוש ולומדת מהשטח ומהתוצאות." },
];

const SHIFT = [
  { icon: UserRound, title: "האדם במרכז", text: "לא הקצבה, לא הארנק ולא הטכנולוגיה. מה שחשוב לאדם מוביל את הבחירה." },
  { icon: Network, title: "מערכת אחת", text: "בחירה, ליווי ולמידה מערכתית, על אותם נתונים ואותם כללים." },
  { icon: Sprout, title: "משעות לתוצאות", text: "מהקצאת משאבים למענים מותאמים, וללמידה על מה שהם תורמים לאדם." },
];

const STATE_GETS = [
  { icon: Scale, title: "קטלוג וכללים בבעלות המדינה", text: "מה נכנס לסל, במחיר ובתנאים, עם רצפה בכל תחום ושכונה.", to: "/executive", label: "למבט מטה" },
  { icon: FileJson, title: "תקן קליטה פתוח לכל ספק", text: "כל ספק נכנס לשוק דרך אותו תקן. אין נעילת ספק.", to: "/providers", label: "לפורטל הספקים" },
  { icon: BookOpen, title: "פנקס למידה שהופך לדרישות", text: "תובנות מהשטח נרשמות, ומיוצאות כרישום דרישות למכרז.", href: "./hq/", label: "לאטלס המטה" },
];

const jump = (id: string) => (e: MouseEvent) => {
  e.preventDefault();
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
};

export default function DemoHome() {
  const s = basket();
  const bg = shownBackground();
  return (
    <div dir="rtl" className="min-h-screen bg-white">
      {/* פתיחה */}
      <section className="relative bg-[#1B3A5C] overflow-hidden">
        <img src="./images/activities-hero.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="relative max-w-5xl mx-auto px-6 pt-14 pb-16 text-white">
          <p className="text-sm font-semibold text-white/85">
            <span className="font-bold text-white">מגמלה לצמיחה</span> · סל אישי להזדקנות מיטבית
          </p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mt-3 max-w-3xl">
            האזרח הוותיק בוחר מה חשוב לו.
            <span className="block text-white/90">המדינה לומדת מה עובד.</span>
          </h1>
          <p className="text-lg text-white/90 mt-5 max-w-2xl">
            סל אישי שמחבר בין העדפות האדם לשירותים בקהילה. מלווה חברתית מסייעת בבחירה ובמימוש, והמטה מזהה פערים ולומד מנתוני השימוש.
          </p>
          <div className="flex flex-wrap items-center gap-3 mt-8">
            <a href="#doors-h" onClick={jump("doors")} className="inline-flex items-center gap-2 min-h-[52px] px-6 rounded-xl bg-white text-[#1B3A5C] font-bold hover:bg-white/90">
              <Compass className="w-5 h-5" aria-hidden="true" /> לבחור דלת
            </a>
            <a href="#how-h" onClick={jump("how")} className="inline-flex items-center gap-2 min-h-[52px] px-5 rounded-xl border border-white/50 text-white font-semibold hover:bg-white/10">
              איך זה עובד
            </a>
            <Link to="/scope" className="text-sm text-white/90 underline underline-offset-4 min-h-[44px] leading-[44px] px-1">
              מה הכלי כן ולא עושה
            </Link>
          </div>
        </div>
      </section>

      {/* סיפור אחד, שלוש דלתות */}
      <section id="doors" className="max-w-5xl mx-auto px-6 py-12 scroll-mt-16" aria-labelledby="doors-h">
        <h2 id="doors-h" className="text-2xl md:text-3xl font-bold text-gray-900">סיפור אחד, שלוש דלתות</h2>
        <p className="text-lg text-gray-700 mt-2 max-w-3xl">
          אותם נתונים ואותם כללים בכל הדלתות: שרה בוחרת, רונית מלווה, והמטה מכוון מדיניות, מזהה פערים ולומד מה עובד.
        </p>
        <div className="relative mt-8">
          {/* קו שמחבר את שלוש הדלתות: מערכת אחת */}
          <span className="hidden md:block absolute top-4 right-[16%] left-[16%] h-0.5 bg-[#1B3A5C]/25" aria-hidden="true" />
          <ul className="relative grid grid-cols-1 md:grid-cols-3 gap-6">
            {DOORS().map((d) => (
              <li key={d.to} className="flex flex-col">
                <span className="self-center relative z-10 mb-3 px-4 py-1 rounded-full bg-[#1B3A5C] text-white text-sm font-semibold">{d.role}</span>
                <Link to={d.to} className="group flex flex-col flex-1 rounded-2xl border border-gray-200 bg-white overflow-hidden hover:shadow-md hover:border-[#1B3A5C]/40 transition-shadow">
                  <div className="h-40 overflow-hidden">
                    <img src={d.img} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform" loading="lazy" />
                  </div>
                  <div className="p-5 flex flex-col flex-1">
                    <p className="text-sm text-gray-600">{d.who}</p>
                    <h3 className="text-xl font-bold text-gray-900 mt-0.5 flex items-center gap-2">
                      <d.icon className="w-5 h-5 text-[#1B3A5C] shrink-0" aria-hidden="true" /> {d.title}
                    </h3>
                    <p className="text-base text-gray-800 mt-2">{d.text}</p>
                    {d.note ? <p className="text-sm text-gray-600 mt-2">{d.note}</p> : null}
                    <p className="mt-auto pt-4 text-sm font-semibold text-[#1B3A5C] inline-flex items-center gap-1">
                      כניסה <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                    </p>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* איך זה עובד: רצף של חמישה שלבים */}
      <section id="how" className="bg-gray-50 border-y border-gray-200 scroll-mt-16" aria-labelledby="how-h">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h2 id="how-h" className="text-2xl md:text-3xl font-bold text-gray-900">איך זה עובד</h2>
          <div className="relative mt-8">
            <span className="hidden md:block absolute top-7 right-[10%] left-[10%] h-0.5 bg-[#1B3A5C]/30" aria-hidden="true" />
            <span className="md:hidden absolute top-7 bottom-7 right-7 w-0.5 bg-[#1B3A5C]/30" aria-hidden="true" />
            <ol className="relative grid grid-cols-1 md:grid-cols-5 gap-6 md:gap-4">
              {STEPS().map((st, i) => (
                <li key={st.title} className="flex md:flex-col md:items-center md:text-center gap-4">
                  <span className="relative z-10 shrink-0 w-14 h-14 rounded-full bg-[#1B3A5C] text-white flex items-center justify-center ring-4 ring-gray-50">
                    <st.icon className="w-6 h-6" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-xs font-semibold text-[#1B3A5C]">שלב {i + 1}</p>
                    <h3 className="text-base font-bold text-gray-900">{st.title}</h3>
                    <p className="text-sm text-gray-700 mt-1">{st.text}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </section>

      {/* שינוי תפיסתי */}
      <section className="max-w-5xl mx-auto px-6 py-12" aria-labelledby="shift-h">
        <h2 id="shift-h" className="text-2xl md:text-3xl font-bold text-gray-900">מגמלה לצמיחה: שינוי תפיסתי</h2>
        <ul className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
          {SHIFT.map((x) => (
            <li key={x.title} className="border-r-4 border-[#1B3A5C] pr-4">
              <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <x.icon className="w-5 h-5 text-[#1B3A5C]" aria-hidden="true" /> {x.title}
              </h3>
              <p className="text-base text-gray-800 mt-1">{x.text}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* מה המדינה מקבלת */}
      <section className="bg-gray-50 border-y border-gray-200" aria-labelledby="state-h">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h2 id="state-h" className="text-2xl font-bold text-gray-900">מה המדינה מקבלת</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
            {STATE_GETS.map((g) => {
              const body = (
                <>
                  <g.icon className="w-7 h-7 text-[#1B3A5C]" aria-hidden="true" />
                  <h3 className="text-lg font-bold text-gray-900 mt-3">{g.title}</h3>
                  <p className="text-base text-gray-800 mt-1">{g.text}</p>
                  <p className="text-sm font-semibold text-[#1B3A5C] mt-3 inline-flex items-center gap-1">
                    {g.label} <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                  </p>
                </>
              );
              const cls = "block rounded-2xl border border-gray-200 bg-white p-6 hover:shadow-md hover:border-[#1B3A5C]/30";
              return g.to ? (
                <Link key={g.title} to={g.to} className={cls}>{body}</Link>
              ) : (
                <a key={g.title} href={g.href} className={cls}>{body}</a>
              );
            })}
          </div>
        </div>
      </section>

      {/* מה ידוע והצעד הבא */}
      <section className="bg-[#1B3A5C] text-white" aria-labelledby="next-h">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold">מה כבר ידוע מהפיילוט</h2>
            <ul className="mt-4 space-y-2 text-base text-white/90">
              <li>{bg ? `${bg.pilot_months} חודשי פיילוט בפסגת זאב, ${appSettings.program.pilot_participants} משתתפים.` : `${appSettings.program.pilot_participants} משתתפים בפסגת זאב.`}</li>
              {bg ? <li>קשרים חברתיים: מ-{bg.social_ties_from}% ל-{bg.social_ties_to}% מהמשתתפים.</li> : null}
              {bg ? <li>דחייה של כ-{bg.delay_months} חודשים בהידרדרות.</li> : null}
            </ul>
            {bg ? <p className="text-xs text-white/75 mt-3">{bg.source}.</p> : null}
            <dl className="grid grid-cols-3 gap-3 mt-6 text-white">
              <div><dt className="text-xs text-white/80">סל לאזרח בחודש</dt><dd className="text-xl font-bold">₪{s.total}</dd></div>
              <div><dt className="text-xs text-white/80">שירותים מאושרים</dt><dd className="text-xl font-bold">{realServices.length}</dd></div>
              <div><dt className="text-xs text-white/80">שכונות באטלס</dt><dd className="text-xl font-bold">{catalogState.neighborhoods}</dd></div>
            </dl>
          </div>
          <div>
            <h2 id="next-h" className="text-2xl font-bold">הצעד הבא</h2>
            <ul className="mt-4 space-y-2 text-base text-white/90">
              <li>{bg ? `פיילוט 2027 ב-${bg.authorities_2027} רשויות, ${bg.budget_label}, עם ספק העל על חבילת הפיילוט.` : "פיילוט 2027 עם ספק העל על חבילת הפיילוט."}</li>
              {bg ? <li>האוכלוסייה בהרחבה: {bg.level3_population_label}.</li> : null}
              <li>מכרז על בסיס הכלי: התקן, הכללים ורישום הדרישות.</li>
            </ul>
            <div className="flex flex-wrap gap-3 mt-6">
              <a href="./field/" className="inline-flex items-center gap-2 min-h-[48px] px-4 rounded-xl border border-white/40 font-semibold">
                <MapPin className="w-4 h-4" aria-hidden="true" /> אטלס השטח
              </a>
              <a href="./hq/" className="inline-flex items-center gap-2 min-h-[48px] px-4 rounded-xl border border-white/40 font-semibold">
                <Store className="w-4 h-4" aria-hidden="true" /> אטלס המטה
              </a>
            </div>
          </div>
        </div>
      </section>

      <footer className="max-w-5xl mx-auto px-6 py-6 text-sm text-gray-600 flex flex-wrap items-center justify-between gap-2">
        <span>הסל האישי · {appSettings.demo.data_label} · גרסה {appSettings.version} · בנייה {__BUILD_COMMIT__}</span>
        <Link to="/scope" className="underline underline-offset-4 min-h-[44px] leading-[44px]">מה הכלי כן ולא עושה</Link>
      </footer>
    </div>
  );
}
