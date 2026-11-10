/**
 * פאנלי הדוכן למקבל ההחלטות: האתגר במספרים, לוח הדוכן החי, קנה מידה, ותוצאות.
 * המספרים מהפוסטר, ב-content.ts.
 */
import { useState, type ReactNode } from "react";
import { readBoard } from "./dayBoard";
import { useBooth } from "./store";
import { CHALLENGE, EXPAND, SCALE } from "./content";
import { ResultsBoard } from "./ResultsBoard";

export function Page({ children }: { children: ReactNode }) {
  return (
    <main id="main" tabIndex={-1} dir="rtl" className="min-h-[calc(100vh-2.5rem)] bg-[#f8fafc] px-4 sm:px-8 py-8 pb-40 focus:outline-none">
      <div className="max-w-6xl mx-auto space-y-6">{children}</div>
    </main>
  );
}

const Big = ({ big, label }: { big: string; label: string }) => (
  <div className="rounded-3xl bg-white border-2 border-[#e5e7eb] shadow p-5 text-center">
    <div className="font-black text-[#1B3A5C] leading-none" style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.5rem)" }}>{big}</div>
    <div className="text-xl font-bold mt-2">{label}</div>
  </div>
);

export function BoothChallenge() {
  return (
    <Page>
      <h2 className="text-2xl font-extrabold text-[#2d5a8c]">האתגר</h2>
      <div className="grid gap-4 md:grid-cols-3 rounded-3xl bg-gradient-to-l from-[#1B3A5C] to-[#2d5a8c] p-5 shadow-lg">
        {CHALLENGE.map((c) => (
          <div key={c.label} className="rounded-2xl bg-white/10 p-4 text-center text-white">
            <div className="font-black leading-none" style={{ fontSize: "clamp(2.4rem, 5.5vw, 4.5rem)" }}>{c.big}</div>
            <div className="text-xl font-bold mt-2">{c.label}</div>
          </div>
        ))}
      </div>
      <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1B3A5C] text-center">מי אחראי שהאדם ימשיך לצאת מהבית?</h1>
      <p className="text-xl text-center font-bold text-[#2d5a8c]">לצד הסיוע: השקעה במניעה, בבחירה ובעצמאות</p>
    </Page>
  );
}

export function BoothBoard() {
  const board = readBoard();
  const { pick } = useBooth();
  const max = Math.max(1, ...board.byCat.map(([, n]) => n));
  return (
    <Page>
      <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1B3A5C]">זה מה שבאי הדוכן בחרו היום</h1>
      <p className="text-xl text-[#4b5563]">ככה המערכת לומדת מה אנשים רוצים באמת. נבנו כאן היום {board.baskets} סלים.</p>
      {board.baskets === 0 ? (
        <div className="rounded-3xl bg-[#eef3f8] p-6 text-xl">הלוח מתמלא עם כל סל שנבנה כאן. אפשר להתחיל ב"אני שרה", ולחזור לכאן.</div>
      ) : (
        <>
          <div className="space-y-3" role="list" aria-label="בחירות לפי תחום">
            {board.byCat.map(([cat, n]) => (
              <div key={cat} role="listitem" className="grid grid-cols-[9rem_1fr_3rem] sm:grid-cols-[14rem_1fr_3rem] items-center gap-3 text-xl font-bold">
                <span>{cat}{pick?.cat === cat ? <b className="booth-mine">הבחירה שלכם</b> : null}</span>
                <div className="h-8 rounded-full bg-[#eef3f8] border-2 border-[#e5e7eb] overflow-hidden">
                  <div className="h-full bg-[#1B3A5C] transition-all duration-300" style={{ width: `${Math.round((n / max) * 100)}%` }} />
                </div>
                <span>{n}</span>
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-2 text-lg">
            <b>הכי נבחרו:</b>
            {board.top.map(([name, n]) => (
              <span key={name} className={pick?.name === name ? "rounded-full bg-[#1B3A5C] px-4 py-1 font-bold text-white" : "rounded-full bg-[#eef3f8] px-4 py-1 font-bold text-[#1B3A5C]"}>{name} · {n}{pick?.name === name ? " · הבחירה שלכם" : ""}</span>
            ))}
          </div>
        </>
      )}
    </Page>
  );
}

export function BoothScale() {
  const [i, setI] = useState(0);
  const s = SCALE[i];
  return (
    <Page>
      <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1B3A5C]">איך מרחיבים?</h1>
      <div className="rounded-3xl bg-white border-2 border-[#e5e7eb] shadow p-6 text-center space-y-2" aria-live="polite">
        <div className="font-black text-[#1B3A5C] leading-none" style={{ fontSize: "clamp(3rem, 7vw, 6rem)" }}>{s.big}</div>
        <div className="text-2xl font-bold">{s.unit}</div>
        <p className="text-xl text-[#4b5563]">{s.line}</p>
      </div>
      <div className="space-y-2" data-booth-scale>
        <input
          type="range" min={0} max={2} step={1} value={i} onChange={(e) => setI(Number(e.target.value))}
          aria-label="היקף" aria-valuetext={s.name} className="w-full h-14 accent-[#1B3A5C]"
        />
        <div className="flex justify-between text-xl font-bold text-[#1B3A5C]">{SCALE.map((x) => <span key={x.name}>{x.name}</span>)}</div>
      </div>
      <p className="text-base text-[#4b5563]">היקף משתתפים ושירותים בלבד.</p>
    </Page>
  );
}

export function BoothResults() {
  return (
    <Page>
      <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1B3A5C]">מה קרה בפיילוט</h1>
      <ResultsBoard />
      <h2 className="text-2xl sm:text-3xl font-extrabold booth-gold-text text-center">מפצחים יחד את האלגוריתם להזדקנות מיטבית</h2>
      <div className="flex flex-wrap items-center justify-center gap-3">
        <span className="text-xl font-bold text-[#1B3A5C]">אותה שיטה:</span>
        {EXPAND.map((t) => <span key={t} className="rounded-full bg-[#eef3f8] px-6 py-2 text-xl font-bold text-[#1B3A5C]">{t}</span>)}
      </div>
    </Page>
  );
}
