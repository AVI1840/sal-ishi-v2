/**
 * דף הבית: סיפור אחד, שלוש דלתות. "משעות לתוצאות": האזרח בוחר עם מלווה, והמדינה
 * מחזיקה בקטלוג, בכללים ובנתונים. כל מספר מההגדרות, מהקטלוג או מ-app-settings.json,
 * ומספר שלא אומת מסומן [לאמת]. כלי ההדגמה (איפוס, מצבי קצה) בתפריט "הדגמה"
 * שבפס העליון.
 */
import { Link } from "react-router-dom";
import { BookOpen, Building2, ChevronLeft, ClipboardList, FileJson, Heart, MapPin, Phone, Scale, ShieldCheck, Store, Users, Wallet } from "lucide-react";
import { catalogState } from "@/data/catalogSource";
import { realServices } from "@/data/realServices";
import { appSettings } from "@/pilot/settings";
import { buildCaseload } from "@/pilot/caseload";

const basket = () => catalogState.seed.settings as unknown as Record<"total" | "personal_wallet", number>;

const DOORS = () => [
  {
    to: "/citizen",
    icon: Phone,
    who: "שרה, 78, פסגת זאב",
    title: "האזרחית",
    text: `ארנק של ${basket().personal_wallet} נקודות, שוק שירותים בשכונה, והמלצה שמתחילה ממה שסיפרה.`,
    img: "./images/choir.png",
  },
  {
    to: "/coordinator",
    icon: Heart,
    who: `${appSettings.companion.name}, מלווה חברתית`,
    title: "המלווה",
    text: `${buildCaseload().length} אזרחים בתיק, מי לפנות היום ולמה, והקהילה שלה מהאטלס.`,
    img: "./images/community-club.png",
  },
  {
    to: "/executive",
    icon: Building2,
    who: "ביטוח לאומי ומשרד הרווחה",
    title: "המטה",
    text: "קטלוג וכללים בבעלות המדינה, פערים בשכונות, תקן פתוח לכל ספק ולמידה מהשטח.",
    img: "./images/services-mosaic.png",
  },
];

const STEPS = [
  { icon: ShieldCheck, title: "זכאי", text: "אזרח ותיק בגמלת סיעוד נכנס לתכנית." },
  { icon: Users, title: "מלווה ופגישה משותפת", text: "מה חשוב לו, מה הוא יכול, ומה קשה." },
  { icon: Wallet, title: "סל אישי", text: "ארנק של 500 נקודות בחודש, נקודה = ₪1." },
  { icon: MapPin, title: "שירותים בשכונה", text: "שוק מאושר מהאטלס: קהילה, תנועה, משמעות." },
  { icon: ClipboardList, title: "נתונים ולמידה", text: "המדינה רואה מה עובד, ומעדכנת את הכללים." },
];

const STATE_GETS = [
  { icon: Scale, title: "קטלוג וכללים בבעלות המדינה", text: "מה נכנס לסל, במחיר ובתנאים, עם רצפה בכל תחום ושכונה.", to: "/executive", label: "למבט מטה" },
  { icon: FileJson, title: "תקן קליטה פתוח לכל ספק", text: "כל ספק נכנס לשוק דרך אותו תקן. אין נעילת ספק.", to: "/providers", label: "לפורטל הספקים" },
  { icon: BookOpen, title: "פנקס למידה שהופך לדרישות", text: "תובנות מהשטח נרשמות, ומיוצאות כרישום דרישות למכרז.", href: "./hq/", label: "לאטלס המטה" },
];

export default function DemoHome() {
  const s = basket();
  return (
    <div dir="rtl" className="min-h-screen bg-white">
      {/* גיבור */}
      <section className="relative bg-[#1B3A5C] overflow-hidden">
        <img src="./images/activities-hero.png" alt="" className="absolute inset-0 w-full h-full object-cover opacity-25" />
        <div className="relative max-w-5xl mx-auto px-6 py-14 text-white">
          <p className="text-sm font-semibold text-white/85 flex items-center gap-2">
            <Wallet className="w-4 h-4" aria-hidden="true" /> הסל האישי · פיילוט ירושלים
          </p>
          <h1 className="text-3xl md:text-5xl font-bold leading-tight mt-3 max-w-3xl">
            כל אזרח ותיק בוחר מה מחזיק אותו בחיים, והמדינה רואה מה עובד.
          </h1>
          <p className="text-lg text-white/90 mt-4 max-w-2xl">
            משעות לתוצאות: סל משלים שמחבר אנשים לקהילה, לתנועה ולמשמעות, עם מלווה ליד, ושוק שירותים שהמדינה מחזיקה בכלליו.
          </p>
          <div className="flex flex-wrap gap-3 mt-8">
            {DOORS().map((d) => (
              <Link key={d.to} to={d.to} className="inline-flex items-center gap-2 min-h-[52px] px-5 rounded-xl bg-white text-[#1B3A5C] font-bold hover:bg-white/90">
                <d.icon className="w-5 h-5" aria-hidden="true" /> {d.title} <ChevronLeft className="w-4 h-4" aria-hidden="true" />
              </Link>
            ))}
          </div>
          <Link to="/scope" className="inline-block mt-5 text-sm text-white/90 underline underline-offset-4 min-h-[44px] leading-[44px]">
            מה הכלי כן ולא עושה
          </Link>
        </div>
        <div className="relative bg-black/20 border-t border-white/10">
          <dl className="max-w-5xl mx-auto px-6 py-5 grid grid-cols-2 md:grid-cols-4 gap-4 text-white">
            <div><dt className="text-sm text-white/80">סל לאזרח בחודש</dt><dd className="text-2xl font-bold">₪{s.total}</dd><dd className="text-xs text-white/80">{s.personal_wallet} נקודות בארנק האישי</dd></div>
            <div><dt className="text-sm text-white/80">שירותים מאושרים</dt><dd className="text-2xl font-bold">{realServices.length}</dd><dd className="text-xs text-white/80">בקטלוג ההדגמה</dd></div>
            <div><dt className="text-sm text-white/80">שכונות באטלס</dt><dd className="text-2xl font-bold">{catalogState.neighborhoods}</dd><dd className="text-xs text-white/80">ירושלים</dd></div>
            <div><dt className="text-sm text-white/80">משתתפים בפיילוט</dt><dd className="text-2xl font-bold">{appSettings.program.pilot_participants}</dd><dd className="text-xs text-white/80">פסגת זאב [לאמת]</dd></div>
          </dl>
        </div>
      </section>

      {/* שלוש דלתות */}
      <section className="max-w-5xl mx-auto px-6 py-12" aria-labelledby="doors-h">
        <h2 id="doors-h" className="text-2xl font-bold text-gray-900">סיפור אחד, שלוש דלתות</h2>
        <p className="text-base text-gray-700 mt-1">אותם נתונים ואותם כללים בכל דלת: מה ששרה מזמינה, רונית רואה, והמטה סופר.</p>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mt-6">
          {DOORS().map((d) => (
            <Link key={d.to} to={d.to} className="group block rounded-2xl border border-gray-200 overflow-hidden hover:shadow-md hover:border-[#1B3A5C]/30 transition-all">
              <div className="h-40 overflow-hidden">
                <img src={d.img} alt="" className="w-full h-full object-cover group-hover:scale-[1.03] transition-transform" loading="lazy" />
              </div>
              <div className="p-5">
                <p className="text-sm text-gray-600">{d.who}</p>
                <h3 className="text-xl font-bold text-gray-900 mt-0.5 flex items-center gap-2">
                  <d.icon className="w-5 h-5 text-[#1B3A5C]" aria-hidden="true" /> {d.title}
                </h3>
                <p className="text-base text-gray-800 mt-2">{d.text}</p>
                <p className="text-sm font-semibold text-[#1B3A5C] mt-3 inline-flex items-center gap-1">
                  כניסה <ChevronLeft className="w-4 h-4" aria-hidden="true" />
                </p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* איך זה עובד */}
      <section className="bg-gray-50 border-y border-gray-200" aria-labelledby="how-h">
        <div className="max-w-5xl mx-auto px-6 py-12">
          <h2 id="how-h" className="text-2xl font-bold text-gray-900">איך זה עובד</h2>
          <ol className="grid grid-cols-1 md:grid-cols-5 gap-4 mt-6">
            {STEPS.map((st, i) => (
              <li key={st.title} className="bg-white rounded-xl border border-gray-200 p-4">
                <div className="flex items-center gap-2">
                  <span className="w-8 h-8 rounded-full bg-[#1B3A5C] text-white text-sm font-bold flex items-center justify-center" aria-hidden="true">{i + 1}</span>
                  <st.icon className="w-5 h-5 text-[#1B3A5C]" aria-hidden="true" />
                </div>
                <h3 className="text-base font-bold text-gray-900 mt-3">{st.title}</h3>
                <p className="text-sm text-gray-700 mt-1">{st.text}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* מה המדינה מקבלת */}
      <section className="max-w-5xl mx-auto px-6 py-12" aria-labelledby="state-h">
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
            return g.to ? (
              <Link key={g.title} to={g.to} className="block rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-[#1B3A5C]/30">{body}</Link>
            ) : (
              <a key={g.title} href={g.href} className="block rounded-2xl border border-gray-200 p-6 hover:shadow-md hover:border-[#1B3A5C]/30">{body}</a>
            );
          })}
        </div>
      </section>

      {/* מה ידוע והצעד הבא */}
      <section className="bg-[#1B3A5C] text-white" aria-labelledby="next-h">
        <div className="max-w-5xl mx-auto px-6 py-12 grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <h2 className="text-2xl font-bold">מה כבר ידוע מהפיילוט</h2>
            <ul className="mt-4 space-y-2 text-base text-white/90">
              <li>פיילוט בפסגת זאב, {appSettings.program.pilot_participants} משתתפים [לאמת].</li>
              <li>24 חודשי פיילוט [לאמת].</li>
              <li>תוצאות המחקר המלווה: יוצגו אחרי אימות.</li>
            </ul>
          </div>
          <div>
            <h2 id="next-h" className="text-2xl font-bold">הצעד הבא</h2>
            <ul className="mt-4 space-y-2 text-base text-white/90">
              <li>פיילוט 2027 בשכונות ירושלים ובשש רשויות [לאמת], עם ספק העל על חבילת הפיילוט.</li>
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
        <span>הסל האישי · {appSettings.demo.data_label} · גרסה {appSettings.version}</span>
        <Link to="/scope" className="underline underline-offset-4 min-h-[44px] leading-[44px]">מה הכלי כן ולא עושה</Link>
      </footer>
    </div>
  );
}
