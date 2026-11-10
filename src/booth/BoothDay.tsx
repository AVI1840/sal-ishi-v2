/**
 * שני דפי יום: הקיר (מסך גדול בחלון שני, מתעדכן כל שתי שניות: מה באי הדוכן בחרו עכשיו) וסיכום היום
 * (להדפסה ולשמירה: כמה סלים, מה נבחר, מי התעניין לפי תפקיד). הנתונים אנונימיים, מאותו לוח.
 */
import { useEffect, useState } from "react";
import { Page } from "./BoothPanels";
import { PARTNERS } from "./content";
import { readBoard, readRoles } from "./dayBoard";

function useBoard(ms = 2000) {
  const [board, setBoard] = useState(readBoard);
  useEffect(() => {
    const t = window.setInterval(() => setBoard(readBoard()), ms);
    const on = () => setBoard(readBoard());
    window.addEventListener("storage", on);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("storage", on);
    };
  }, [ms]);
  return board;
}

export function BoothWall() {
  const board = useBoard();
  const max = Math.max(1, ...board.byCat.map(([, n]) => n));
  return (
    <Page>
      <h1 className="text-4xl sm:text-6xl font-extrabold text-[#1B3A5C]">מה מבקרי הכנס בחרו היום</h1>
      <p className="text-2xl font-bold text-[#2d5a8c]">כך המדינה לומדת מה עובד ולמי. אלה בחירות של מבקרים, לא נתוני תושבים.</p>
      {board.baskets === 0 ? (
        <div className="rounded-3xl bg-[#eef3f8] p-10 text-3xl font-extrabold text-[#1B3A5C]">היו הראשונים לבחור. געו במסך ובנו סל לשרה.</div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[18rem_1fr]">
          <div className="rounded-3xl bg-gradient-to-l from-[#1B3A5C] to-[#2d5a8c] p-6 text-center text-white shadow-lg">
            <div className="font-black leading-none" style={{ fontSize: "clamp(4rem, 12vw, 9rem)" }}>{board.baskets}</div>
            <div className="text-2xl font-bold">סלים נבנו היום</div>
            {board.last ? <div className="mt-4 rounded-2xl bg-white/15 p-3 text-xl font-bold" aria-live="polite">עכשיו נבחר: {board.last}</div> : null}
          </div>
          <div className="space-y-3" role="list" aria-label="בחירות לפי תחום">
            {board.byCat.map(([cat, n]) => (
              <div key={cat} role="listitem" className="grid grid-cols-[10rem_1fr_3rem] sm:grid-cols-[16rem_1fr_3rem] items-center gap-3 text-2xl font-bold">
                <span>{cat}</span>
                <div className="h-10 rounded-full bg-[#eef3f8] border-2 border-[#e5e7eb] overflow-hidden">
                  <div className="h-full bg-[#1B3A5C]" style={{ width: `${Math.round((n / max) * 100)}%` }} />
                </div>
                <span>{n}</span>
              </div>
            ))}
            <div className="flex flex-wrap items-center gap-2 pt-2 text-xl">
              <b>הכי נבחרו:</b>
              {board.top.map(([name, n]) => (
                <span key={name} className="rounded-full bg-[#eef3f8] px-4 py-1 font-bold text-[#1B3A5C]">{name} · {n}</span>
              ))}
            </div>
          </div>
        </div>
      )}
    </Page>
  );
}

export function BoothSummary() {
  const board = useBoard(5000);
  const roles = readRoles();
  const date = new Date().toLocaleDateString("he-IL", { day: "numeric", month: "long", year: "numeric" });
  return (
    <Page>
      <h1 className="text-3xl sm:text-5xl font-extrabold text-[#1B3A5C]">סיכום היום בדוכן</h1>
      <p className="text-xl text-[#4b5563]">{date}. נתונים אנונימיים: אין שם או פרט מזהה של מבקר.</p>
      <section aria-labelledby="sum-baskets" className="rounded-3xl bg-white border-2 border-[#e5e7eb] p-5 space-y-2">
        <h2 id="sum-baskets" className="text-2xl font-extrabold text-[#1B3A5C]">{board.baskets} סלים נבנו</h2>
        <ul className="text-xl space-y-1">
          {board.byCat.length === 0 ? <li>עוד לא נבנו סלים.</li> : null}
          {board.byCat.map(([cat, n]) => (
            <li key={cat}>{cat}: <b>{n}</b></li>
          ))}
        </ul>
        {board.top.length ? <p className="text-xl"><b>הכי נבחרו:</b> {board.top.map(([name, n]) => `${name} (${n})`).join(", ")}</p> : null}
      </section>
      <section aria-labelledby="sum-roles" className="rounded-3xl bg-white border-2 border-[#e5e7eb] p-5 space-y-2">
        <h2 id="sum-roles" className="text-2xl font-extrabold text-[#1B3A5C]">מי התעניין, לפי תפקיד</h2>
        <ul className="text-xl space-y-1">
          {PARTNERS.map((p) => (
            <li key={p.id}>{p.who}: <b>{roles[p.id]}</b></li>
          ))}
        </ul>
      </section>
      <button type="button" className="rounded-full bg-[#1B3A5C] px-8 text-xl font-bold text-white print:hidden" onClick={() => window.print()}>
        להדפסה או לשמירה כקובץ
      </button>
    </Page>
  );
}
