/**
 * לוח הנגישות של הדוכן: כפתור "נגישות" בפס העליון בכל מסך, שפותח הקראה בקול, הגדלה והקטנה של
 * הטקסט, ניגודיות גבוהה ואיפוס. כל הכפתורים 56 פיקסלים לפחות ועם שם בעברית. נסגר ב-Escape, ובמעבר
 * או בלחיצה מחוץ ללוח, והפוקוס חוזר לכפתור.
 */
import { useEffect, useRef, useState } from "react";
import { Contrast, Accessibility, Minus, Plus, RotateCcw, Square, Volume2 } from "lucide-react";
import { useReadAloud } from "@/pilot/speech";
import { a11y, SCALES, useA11y } from "./a11y";

const tool = "flex items-center justify-center gap-2 min-h-[56px] px-4 rounded-2xl border-2 border-[#1B3A5C] text-[#1B3A5C] bg-white text-lg font-bold disabled:opacity-40 aria-pressed:bg-[#1B3A5C] aria-pressed:text-white";

export default function BoothA11y({ floating = false }: { floating?: boolean }) {
  const [open, setOpen] = useState(false);
  const { scale, hc } = useA11y();
  const { speaking, read, stop, supported } = useReadAloud("he-IL");
  const ref = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);
  const i = (SCALES as readonly number[]).indexOf(scale);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setOpen(false);
        trigger.current?.focus();
      }
    };
    const onDown = (e: PointerEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("pointerdown", onDown);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("pointerdown", onDown);
    };
  }, [open]);

  // מעבר מסך סוגר את הלוח וקוטע הקראה.
  useEffect(() => {
    const close = () => {
      setOpen(false);
      stop();
    };
    window.addEventListener("hashchange", close);
    return () => window.removeEventListener("hashchange", close);
  }, [stop]);

  const readPage = () => {
    // מקריאים את אזור התוכן של המסך הנוכחי: אזור שסומן, ואם אין, ה-main.
    const root = document.querySelector("[data-read]") ?? document.querySelector("main");
    root?.setAttribute("data-read", "");
    read();
  };

  return (
    <div ref={ref} className={floating ? "fixed top-[3.6rem] right-2 z-[65]" : "relative"} dir="rtl">
      <button
        ref={trigger}
        type="button"
        aria-expanded={open}
        aria-controls="booth-a11y-panel"
        aria-label="נגישות: הקראה, גודל טקסט וניגודיות"
        onClick={() => setOpen(!open)}
        className="booth-bar-btn"
      >
        <Accessibility className="w-5 h-5" aria-hidden="true" />
        <span className="hidden sm:inline">נגישות</span>
      </button>
      {open ? (
        <div id="booth-a11y-panel" role="region" aria-label="כלי נגישות" className="fixed top-[3.8rem] left-2 right-2 sm:left-auto sm:right-2 sm:w-[22rem] z-[70] rounded-3xl border-2 border-[#1B3A5C] bg-white p-3 shadow-xl space-y-2 text-[#0c3058]">
          {supported ? (
            <button type="button" className={`${tool} w-full`} aria-pressed={speaking} onClick={speaking ? stop : readPage}>
              {speaking ? <Square className="w-5 h-5" aria-hidden="true" /> : <Volume2 className="w-5 h-5" aria-hidden="true" />}
              {speaking ? "לעצור הקראה" : "להקריא את המסך"}
            </button>
          ) : null}
          <div className="grid grid-cols-2 gap-2">
            <button type="button" className={tool} onClick={() => a11y.down()} disabled={i <= 0} aria-label={`הקטנת טקסט. עכשיו ${scale} אחוז`}>
              <Minus className="w-5 h-5" aria-hidden="true" /> א
            </button>
            <button type="button" className={tool} onClick={() => a11y.up()} disabled={i >= SCALES.length - 1} aria-label={`הגדלת טקסט. עכשיו ${scale} אחוז`}>
              <Plus className="w-5 h-5" aria-hidden="true" /> א
            </button>
          </div>
          <p className="text-base text-center font-bold" aria-live="polite">גודל הטקסט: {scale}%</p>
          <button type="button" className={`${tool} w-full`} aria-pressed={hc} onClick={() => a11y.toggleContrast()}>
            <Contrast className="w-5 h-5" aria-hidden="true" /> ניגודיות גבוהה
          </button>
          <button type="button" className={`${tool} w-full`} onClick={() => { a11y.reset(); stop(); }}>
            <RotateCcw className="w-5 h-5" aria-hidden="true" /> איפוס ההגדרות
          </button>
        </div>
      ) : null}
    </div>
  );
}
