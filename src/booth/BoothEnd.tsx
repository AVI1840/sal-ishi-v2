/**
 * מסך הסיום המשותף: משפט אישי לפי מה שהמבקר בחר, תוצאות עם מקור, "מי אתה בסיפור" (חמישה תפקידים,
 * ולכל אחד: מה מבקשים, מה מקבלים וקוד QR למייל עם נושא מוכן), מעבר לעדשה אחרת ו"מבקר הבא".
 * נשמר רק מונה אנונימי לכל תפקיד. שום פרט על המבקר.
 */
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { booth, useBooth, type TourLens } from "./store";
import { useBoothReset } from "./BoothChrome";
import { bookingIds, noteRole, readBoard, type RoleId } from "./dayBoard";
import { CONTACT_MAIL, PARTNERS } from "./content";
import { ResultsBoard } from "./ResultsBoard";

const QR = import.meta.glob("./qr/*.svg", { query: "?raw", import: "default", eager: true }) as Record<string, string>;
const qrOf = (id: string) => QR[`./qr/${id}.svg`] ?? "";

const SENTENCE: Record<TourLens, (picked: string | null) => string> = {
  citizen: (p) => (p ? `שרה תצטרף ל${p}. ההמלצה התאימה למה שחשוב לה, והבחירה שלה.` : "בניתם לשרה שבוע שיש בו אנשים, תנועה ובחירה."),
  companion: () => "ראיתם את התמונה המלאה, ועזרתם לאדם אחד לבחור ולהמשיך.",
  hq: () => "ראיתם איך בחירה אישית הופכת לידע שהמערכת לומדת ממנו.",
  judges: () => "ראיתם איך בחירה אישית הופכת לידע שהמערכת לומדת ממנו.",
};

const OTHERS: { lens: TourLens; to: string; label: string }[] = [
  { lens: "citizen", to: "/citizen", label: "מהעיניים של שרה" },
  { lens: "companion", to: "/coordinator", label: "מהעיניים של המלווה" },
  { lens: "hq", to: "/booth/challenge", label: "מהעיניים של מקבל ההחלטות" },
];

export default function BoothEnd() {
  const { last, picked, seen } = useBooth();
  const navigate = useNavigate();
  const reset = useBoothReset();
  const lens = last ?? "hq";
  const [role, setRole] = useState<RoleId | null>(null);
  const chosen = PARTNERS.find((p) => p.id === role);

  const choose = (id: RoleId) => {
    if (id !== role) noteRole(id);
    setRole(id);
  };

  return (
    <main id="main" tabIndex={-1} dir="rtl" className="min-h-[calc(100vh-2.5rem)] bg-[#f8fafc] px-4 sm:px-8 py-8 focus:outline-none">
      <div className="max-w-6xl mx-auto space-y-8">
        <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1B3A5C] leading-tight">{SENTENCE[lens](picked)}</h1>
        <ResultsBoard compact />

        <section className="rounded-3xl bg-gradient-to-l from-[#1B3A5C] to-[#2d5a8c] p-6 space-y-4 text-white shadow-lg" aria-labelledby="partners-h">
          <h2 id="partners-h" className="text-2xl sm:text-3xl font-extrabold text-white">מי אתם בסיפור?</h2>
          <p className="text-lg">הסל האישי נבנה בשותפות. געו בתפקיד שלכם, ונראה מה אפשר לעשות יחד.</p>
          <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {PARTNERS.map((p) => (
              <li key={p.id}>
                <button
                  type="button"
                  aria-pressed={role === p.id}
                  onClick={() => choose(p.id)}
                  className={`w-full text-right rounded-2xl border-2 p-3 ${role === p.id ? "bg-white text-[#1B3A5C] border-white" : "bg-white/10 border-white/40 text-white"}`}
                >
                  <span className="block text-xl font-extrabold">{p.who}</span>
                  <span className="block text-base">{p.line}</span>
                </button>
              </li>
            ))}
          </ul>
          {chosen ? (
            <div className="rounded-2xl bg-white text-[#1B3A5C] p-4 flex flex-wrap items-center gap-6" aria-live="polite">
              <div className="w-36 h-36 sm:w-44 sm:h-44 shrink-0" role="img" aria-label={`קוד QR לשליחת מייל: ${chosen.who}`} dangerouslySetInnerHTML={{ __html: qrOf(chosen.id) }} />
              <div className="space-y-2 flex-1 basis-[10rem] min-w-0">
                <div className="text-2xl font-extrabold">{chosen.who}</div>
                <p className="text-xl"><b>מה מבקשים ממכם:</b> {chosen.ask}</p>
                <p className="text-xl"><b>מה תקבלו:</b> {chosen.get}</p>
                <p className="text-lg">סרקו, והמייל נפתח עם נושא מוכן. או כתבו אל <span dir="ltr">{CONTACT_MAIL}</span></p>
              </div>
            </div>
          ) : (
            <p className="text-lg font-bold">היום נבנו כאן {readBoard().baskets} סלים</p>
          )}
        </section>

        <section className="rounded-3xl bg-[#eef3f8] p-6 space-y-4" aria-labelledby="other-h">
          <h2 id="other-h" className="text-2xl font-extrabold text-[#1B3A5C]">רוצים לראות את זה מהצד השני?</h2>
          <div className="flex flex-wrap gap-3">
            {OTHERS.filter((o) => !seen.includes(o.lens) && o.lens !== lens && !(lens === "judges" && o.lens === "hq")).map((o) => (
              <button
                key={o.lens}
                type="button"
                className="rounded-full border-2 border-[#1B3A5C] bg-white px-6 text-lg font-bold text-[#1B3A5C]"
                onClick={() => {
                  booth.start(o.lens, bookingIds());
                  navigate(o.to);
                }}
              >
                {o.label}
              </button>
            ))}
          </div>
        </section>
        <button type="button" className="rounded-full bg-[#1B3A5C] px-8 text-xl font-bold text-white" onClick={() => void reset()}>
          מבקר הבא
        </button>
      </div>
    </main>
  );
}
