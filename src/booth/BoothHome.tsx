/**
 * כניסת הדוכן: המבקר בוחר עדשה ורואה את המערכת האמיתית מהעיניים שלה, בחוט אחד של שלוש מערכות.
 * עיצוב כמו מסך השוק של שרה: כרטיס גיבור כחול ואריחי תמונה עם פס צבעוני.
 * אחרי 20 שניות בלי מגע הכרטיס הכחול מתחלף בשלוש שקופיות (שאלה, תוצאה אחת עם מקור, הזמנה לגעת).
 */
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { appSettings } from "@/pilot/settings";
import { booth, useBooth, type TourLens } from "./store";
import { bookingIds, readBoard } from "./dayBoard";
import { BEFORE_AFTER, SOURCE_LINE } from "./content";
import "./booth-story.css";

interface Door {
  lens: TourLens;
  to: string;
  title: string;
  line: string;
  photo: string;
  tone: string;
}

const DOORS: Door[] = [
  { lens: "citizen", to: "/citizen", title: "אני שרה, בת 78", line: "בנו את הסל שתרצו לעצמכם", photo: "images/choir.png", tone: "bg-amber-800/90" },
  { lens: "companion", to: "/coordinator", title: `אני ${appSettings.companion.name}, המלווה`, line: "עזרו לאדם אחד לבחור נכון", photo: "images/community-club.png", tone: "bg-emerald-800/90" },
  { lens: "hq", to: "/booth/challenge", title: "אני מקבל ההחלטות", line: "ראו מה המדינה מקבלת בתמורה", photo: "images/services-mosaic.png", tone: "bg-sky-800/90" },
];

const ATTRACT_AFTER_MS = 20000;
const QUESTION = "איך נראית הזדקנות טובה - מהעיניים שלך?";

export default function BoothHome() {
  const navigate = useNavigate();
  const { presenter } = useBooth();
  const baskets = readBoard().baskets;
  const [attract, setAttract] = useState(false);

  useEffect(() => {
    let timer = window.setTimeout(() => setAttract(true), ATTRACT_AFTER_MS);
    const touch = () => {
      setAttract(false);
      window.clearTimeout(timer);
      timer = window.setTimeout(() => setAttract(true), ATTRACT_AFTER_MS);
    };
    const events = ["pointerdown", "keydown", "touchstart"] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    return () => {
      window.clearTimeout(timer);
      events.forEach((e) => window.removeEventListener(e, touch));
    };
  }, []);

  const go = (lens: TourLens, to: string, full = false) => {
    booth.start(lens, bookingIds(), full);
    navigate(to);
  };
  const stat = BEFORE_AFTER[0];

  return (
    <main id="main" tabIndex={-1} dir="rtl" className="min-h-[calc(100vh-2.5rem)] bg-[#f8fafc] px-4 sm:px-8 py-4 focus:outline-none">
      <div className="max-w-6xl mx-auto space-y-4">
        <section className="rounded-3xl bg-gradient-to-l from-[#1B3A5C] to-[#2d5a8c] p-4 sm:p-5 text-white shadow-lg space-y-1">
          <span className="inline-block rounded-full bg-white/20 px-4 py-1 text-base font-bold">תחרות החדשנות הממשלתית 2026</span>
          <h1 className={attract ? "sr-only" : "text-3xl sm:text-4xl font-extrabold leading-tight"}>{QUESTION}</h1>
          {attract ? (
            <div className="booth-attract" aria-hidden="true">
              <p className="booth-attract__slide text-3xl sm:text-4xl font-extrabold leading-tight">{QUESTION}</p>
              <p className="booth-attract__slide">
                <span className="text-3xl sm:text-4xl font-extrabold">{stat.label}: מ-{stat.from} ל-{stat.to}</span>
                <span className="text-lg text-white/90">בפיילוט. {SOURCE_LINE}</span>
              </p>
              <p className="booth-attract__slide text-3xl sm:text-4xl font-extrabold leading-tight">געו כדי להתחיל. דקה אחת מספיקה.</p>
            </div>
          ) : (
            <p className="text-xl text-white/90">בחירה אחת של שרה, ושלושה מסכים זזים: שלה, של המלווה ושל המדינה.</p>
          )}
        </section>
        <div className="grid gap-4 md:grid-cols-3">
          {DOORS.map((d) => (
            <button
              key={d.lens}
              type="button"
              data-booth-door
              className="relative h-44 sm:h-52 rounded-2xl overflow-hidden border-2 border-transparent text-right shadow-sm hover:border-[#1B3A5C] hover:shadow-md transition-all focus-visible:ring-4 focus-visible:ring-[#1B3A5C]/30"
              onClick={() => go(d.lens, d.to)}
            >
              <img src={d.photo} alt="" className="absolute inset-0 w-full h-full object-cover" loading="eager" />
              <span className={`absolute bottom-0 right-0 left-0 px-4 py-3 text-white ${d.tone}`}>
                <span className="block text-2xl font-extrabold leading-tight">{d.title}</span>
                <span className="block text-lg">{d.line}</span>
              </span>
              <span className="absolute top-3 left-3 inline-flex items-center gap-1 rounded-full bg-white px-4 text-base font-bold text-[#1B3A5C] min-h-[56px]">
                להתחיל <ChevronLeft className="w-5 h-5" aria-hidden="true" />
              </span>
            </button>
          ))}
        </div>
        <div className="flex flex-wrap items-center justify-center gap-4">
          <button
            type="button"
            className="inline-flex items-center justify-center rounded-full border-2 border-[#1B3A5C] bg-white px-6 text-base font-bold text-[#1B3A5C] hover:bg-[#eef3f8]"
            onClick={() => go("judges", "/booth/challenge")}
          >
            מסלול שופטים - 30 שניות
          </button>
          {baskets > 0 ? <span className="rounded-full bg-[#eef3f8] px-5 py-2 text-lg font-bold text-[#1B3A5C]">היום נבנו כאן {baskets} סלים</span> : null}
        </div>
        {presenter ? (
          <div className="flex flex-wrap items-center justify-center gap-3" role="group" aria-label="סיור מלא למציג">
            <span className="text-base font-bold text-[#4b5563]">סיור מלא:</span>
            {DOORS.map((d) => (
              <button key={d.lens} type="button" className="rounded-full border-2 border-[#1B3A5C] bg-white px-5 text-base font-bold text-[#1B3A5C]" onClick={() => go(d.lens, d.to, true)}>
                {d.lens === "citizen" ? "שרה" : d.lens === "companion" ? appSettings.companion.name : "מטה"}
              </button>
            ))}
            <button type="button" className="rounded-full bg-[#1B3A5C] px-5 text-base font-bold text-white" onClick={() => navigate("/booth/summary")}>סיכום היום</button>
            <a className="rounded-full bg-[#1B3A5C] px-5 text-base font-bold text-white inline-flex items-center" href="#/booth/wall" target="_blank" rel="noopener">קיר (חלון חדש)</a>
          </div>
        ) : null}
      </div>
    </main>
  );
}
