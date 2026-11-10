/**
 * פס ההדרכה: פס קבוע בתחתית המסך (מעל הניווט התחתון של האזרחית), בשורה אחת על מסך רחב.
 * הוא מראה באיזו תחנה אנחנו, משפט אחד, והארה של אלמנט אמיתי במסך. בתחנות פעולה המבקר לוחץ
 * בעצמו על הכפתור האמיתי, ו"הבא" תמיד עובד: אם יש אלמנט פעולה זמין, הוא נלחץ עבורו.
 * בסוף מערכה הכפתור הראשי הוא ההמשך בחוט ("ועכשיו: מה רונית רואה"), ו"לסיום" תמיד זמין.
 * המסך מקבל ריפוד תחתון בגובה הפס, כך שהפס אף פעם לא מכסה את מה שהוא מצביע עליו.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { appSettings } from "@/pilot/settings";
import { booth, nextActOf, useBooth, type TourLens } from "./store";
import { tourFor } from "./tours";
import { matchesAny, resolveTarget } from "./tourEngine";

interface Box {
  top: number;
  left: number;
  width: number;
  height: number;
}

const ACT_NAME: Record<TourLens, () => string> = {
  citizen: () => "שרה",
  companion: () => appSettings.companion.name,
  hq: () => "המטה",
  judges: () => "מסלול שופטים",
};

const NEXT_LABEL: Record<"citizen" | "companion" | "hq", () => string> = {
  citizen: () => "ועכשיו: הצד של שרה",
  companion: () => `ועכשיו: מה ${appSettings.companion.name} רואה`,
  hq: () => "ועכשיו: מה רואה המדינה",
};

export default function BoothTour() {
  const state = useBooth();
  const { lens, step } = state;
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const steps = lens ? tourFor(lens, state) : [];
  const cur = lens ? steps[step] : undefined;
  const [box, setBox] = useState<Box | null>(null);
  const [navH, setNavH] = useState(0);
  const [, tick] = useState(0);
  const advancing = useRef(false);
  const barRef = useRef<HTMLElement>(null);
  const scrolledFor = useRef<HTMLElement | null>(null);

  const go = useCallback(
    (n: number) => {
      advancing.current = false;
      if (n >= steps.length) {
        const next = nextActOf(booth.get());
        booth.finish();
        if (next) booth.startAct(next);
        else navigate("/booth/end");
        return;
      }
      booth.goto(n);
    },
    [steps.length, navigate],
  );

  // כניסה לתחנה: מעבר למסך שלה.
  useEffect(() => {
    advancing.current = false;
    scrolledFor.current = null;
    if (cur?.route && pathname !== cur.route) navigate(cur.route);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lens, step]);

  // מעבר כתובת שמקדם תחנה (למשל לחיצה על כרטיס שירות).
  useEffect(() => {
    if (!cur?.advance?.route || advancing.current) return;
    if (cur.advance.route.test(pathname)) {
      advancing.current = true;
      window.setTimeout(() => go(step + 1), 400);
    }
  }, [pathname, cur, step, go]);

  // לחיצה של המבקר על אלמנט הפעולה.
  useEffect(() => {
    if (!cur?.advance?.click) return;
    const onClick = (e: MouseEvent) => {
      if (advancing.current) return;
      if (matchesAny(e.target as Element, cur.advance!.click)) {
        advancing.current = true;
        window.setTimeout(() => go(step + 1), 700);
      }
    };
    document.addEventListener("click", onClick, true);
    return () => document.removeEventListener("click", onClick, true);
  }, [cur, step, go]);

  // מיקום ההארה ושמירה שהפס לא מכסה אותה: מתעדכן עם גלילה, שינוי גודל ושינויים במסך.
  useEffect(() => {
    if (!cur) {
      setBox(null);
      return;
    }
    const update = () => {
      const nav = document.querySelector<HTMLElement>('nav[aria-label="ניווט ראשי"]');
      setNavH(nav && getComputedStyle(nav).position === "fixed" ? nav.getBoundingClientRect().height : 0);
      const el = resolveTarget(cur.target);
      if (!el) {
        setBox(null);
        return;
      }
      const reduced = window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
      if (scrolledFor.current !== el) {
        scrolledFor.current = el;
        // בפאנלי הדוכן הדף קצר, ואין צורך לגלול אליו.
        if (!window.location.hash.startsWith("#/booth/")) el.scrollIntoView({ block: "center", behavior: reduced ? "auto" : "smooth" });
      }
      const r = el.getBoundingClientRect();
      const barTop = barRef.current?.getBoundingClientRect().top ?? window.innerHeight;
      // האלמנט המואר נשאר מעל הפס ומתחת לפס העליון: מזיזים את הדף בדיוק במידה שצריך.
      if (r.bottom > barTop - 8) {
        const dy = Math.min(r.bottom - (barTop - 14), r.top - 76);
        if (dy > 4) window.scrollBy({ top: dy, behavior: "auto" });
      }
      const r2 = el.getBoundingClientRect();
      // כרטיס גבוה מהמקום שנשאר: ההארה נעצרת מעל הפס, כדי שהפס לא יכסה אותה.
      const room = barTop - 8 - r2.top;
      setBox({ top: r2.top, left: r2.left, width: r2.width, height: Math.max(24, Math.min(r2.height, room)) });
      tick((n) => n + 1);
    };
    update();
    const t = window.setInterval(update, 250);
    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);
    return () => {
      window.clearInterval(t);
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [cur]);

  // ריפוד תחתון בגובה הפס, כדי שתוכן המסך לא יסתתר מאחוריו.
  useEffect(() => {
    const bar = barRef.current;
    const root = document.documentElement;
    if (!bar) {
      root.style.removeProperty("--booth-bar-h");
      return;
    }
    const apply = () => root.style.setProperty("--booth-bar-h", `${Math.ceil(bar.offsetHeight + navH)}px`);
    apply();
    const ro = typeof ResizeObserver !== "undefined" ? new ResizeObserver(apply) : null;
    ro?.observe(bar);
    return () => {
      ro?.disconnect();
      root.style.removeProperty("--booth-bar-h");
    };
  }, [lens, step, navH]);

  if (!lens || !cur) return null;

  const next = () => {
    const el = cur.advance ? resolveTarget(cur.target) : null;
    if (el && !advancing.current) el.click();
    else go(step + 1);
  };
  const last = step === steps.length - 1;
  const following = last ? nextActOf(state) : null;
  const nextText = last ? (following ? NEXT_LABEL[following]() : "לסיכום") : "הבא";
  const showAction = cur.action && (cur.action.show ? cur.action.show() : true);
  const title = typeof cur.title === "function" ? cur.title() : cur.title;
  const text = typeof cur.text === "function" ? cur.text() : cur.text;

  return (
    <>
      {box ? <div aria-hidden="true" className="booth-spot" style={{ top: box.top - 6, left: box.left - 6, width: box.width + 12, height: box.height + 12 }} /> : null}
      <section ref={barRef} data-booth-tour role="region" aria-label="סיור מודרך" aria-live="polite" dir="rtl" className="booth-bar" style={{ bottom: navH }}>
        <div className="booth-bar__body">
          <div className="booth-bar__head">
            <ol className="booth-dots" aria-hidden="true">
              {steps.map((_, i) => (
                <li key={i} className={i === step ? "booth-dot booth-dot--now" : i < step ? "booth-dot booth-dot--done" : "booth-dot"} />
              ))}
            </ol>
            <span className="booth-tour__count">
              {ACT_NAME[lens]()}, תחנה {step + 1} מתוך {steps.length}
            </span>
          </div>
          <h2 className="booth-tour__title">{title}</h2>
          <p className="booth-tour__text">{text}</p>
        </div>
        <div className="booth-bar__ctl">
          {showAction ? (
            <button type="button" className="booth-tour__action" onClick={() => { cur.action!.run(); tick((n) => n + 1); }}>
              {cur.action!.label}
            </button>
          ) : null}
          <button type="button" className="booth-tour__skip" onClick={() => { booth.finish(); navigate("/booth/end"); }}>
            לסיום
          </button>
          <button type="button" className="booth-tour__btn booth-tour__btn--sec" disabled={step === 0} onClick={() => booth.goto(step - 1)}>
            <ChevronRight className="w-5 h-5" aria-hidden="true" /> הקודם
          </button>
          <button type="button" className="booth-tour__btn" onClick={next}>
            {nextText} <ChevronLeft className="w-5 h-5" aria-hidden="true" />
          </button>
        </div>
      </section>
    </>
  );
}
