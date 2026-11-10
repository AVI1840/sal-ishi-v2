/**
 * מעטפת הדוכן: פס עליון (לוגו עם לחיצה ארוכה לאיפוס, תווית "אב טיפוס"), קיוסק
 * (חזרה אוטומטית אחרי חוסר פעילות), ומצב מציג (5 הקשות על התווית) שמחזיר את הפס
 * והניווט החופשי של המוצר. מחליף את DemoNav רק בגרסת הדוכן.
 */
import { useCallback, useEffect, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { Heart, Home } from "lucide-react";
import DemoNav from "@/components/layout/DemoNav";
import { resetDemo } from "@/pilot/reset";
import { booth, useBooth } from "./store";
import { startBoothCopy } from "./boothCopy";
import BoothA11y from "./BoothA11y";
import { a11y, initKiosk } from "./a11y";
import "./booth.css";
import "./booth-a11y.css";

export const BADGE = "אב טיפוס להמחשה · נתונים סינתטיים";
/** שניות בלי מגע עד הספירה לאחור, ואורך הספירה. */
export const IDLE_BEFORE = 50;
export const IDLE_COUNTDOWN = 10;
const LONG_PRESS_MS = 3000;
const TAPS_FOR_PRESENTER = 5;

export function useBoothReset() {
  const navigate = useNavigate();
  return useCallback(async () => {
    await resetDemo();
    booth.reset();
    navigate("/");
  }, [navigate]);
}

function useKioskIdle(active: boolean, onTimeout: () => void) {
  const [left, setLeft] = useState<number | null>(null);
  const idle = useRef(0);
  const timeout = useRef(onTimeout);
  timeout.current = onTimeout;

  useEffect(() => {
    idle.current = 0;
    setLeft(null);
    if (!active) return;
    const touch = () => {
      idle.current = 0;
      setLeft(null);
    };
    const events = ["pointerdown", "keydown", "touchstart", "wheel"] as const;
    events.forEach((e) => window.addEventListener(e, touch, { passive: true }));
    const timer = window.setInterval(() => {
      idle.current += 1;
      if (idle.current >= IDLE_BEFORE + IDLE_COUNTDOWN) {
        idle.current = 0;
        setLeft(null);
        timeout.current();
      } else if (idle.current >= IDLE_BEFORE) {
        setLeft(IDLE_BEFORE + IDLE_COUNTDOWN - idle.current);
      }
    }, 1000);
    return () => {
      events.forEach((e) => window.removeEventListener(e, touch));
      window.clearInterval(timer);
    };
  }, [active]);

  return left;
}

function LogoButton({ onLongPress }: { onLongPress: () => void }) {
  const [pressing, setPressing] = useState(false);
  const timer = useRef<number>();
  const stop = () => {
    setPressing(false);
    window.clearTimeout(timer.current);
  };
  const start = () => {
    setPressing(true);
    window.clearTimeout(timer.current);
    timer.current = window.setTimeout(() => {
      setPressing(false);
      onLongPress();
    }, LONG_PRESS_MS);
  };
  useEffect(() => () => window.clearTimeout(timer.current), []);
  return (
    <button
      type="button"
      data-booth-logo
      aria-label="לוגו. לחיצה ארוכה של 3 שניות מאפסת את המסך"
      className="booth-logo"
      onPointerDown={start}
      onPointerUp={stop}
      onPointerLeave={stop}
      onPointerCancel={stop}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") e.preventDefault();
      }}
    >
      <svg className={"booth-ring" + (pressing ? " booth-ring--on" : "")} viewBox="0 0 72 72" aria-hidden="true">
        <circle cx="36" cy="36" r="34" />
      </svg>
      <Heart className="w-5 h-5 text-white" aria-hidden="true" />
    </button>
  );
}

export default function BoothChrome() {
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { presenter } = useBooth();
  const reset = useBoothReset();
  const atStart = pathname === "/";
  useEffect(() => startBoothCopy(), []);
  // העדפות הנגישות השמורות מוחלות בכל מסך. הקיוסק (איפוס אחרי חוסר פעילות) רק בדוכן הפיזי: kiosk=1.
  useEffect(() => a11y.init(), []);
  const [kiosk] = useState(initKiosk);
  const left = useKioskIdle(kiosk && !atStart && !presenter && !pathname.startsWith("/booth/wall"), () => void reset());

  // 5 הקשות על התווית בתוך 3 שניות מחליפות מצב מציג.
  const taps = useRef<number[]>([]);
  const onBadge = () => {
    const now = Date.now();
    taps.current = [...taps.current.filter((t) => now - t < 3000), now];
    if (taps.current.length >= TAPS_FOR_PRESENTER) {
      taps.current = [];
      booth.togglePresenter();
    }
  };

  return (
    <>
      {presenter ? (
        <DemoNav />
      ) : (
        <header className="fixed top-0 left-0 right-0 z-[60] h-10 bg-[#1B3A5C] text-white" dir="rtl">
          <a
            href="#main"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("main")?.focus();
            }}
            className="sr-only focus:not-sr-only focus:fixed focus:top-1 focus:right-2 focus:z-[70] focus:bg-white focus:text-[#1B3A5C] focus:px-4 focus:py-3 focus:rounded-lg focus:shadow-lg"
          >
            לדלג לתוכן
          </a>
          <div className="flex items-center gap-2 px-2 sm:px-4 h-full max-w-7xl mx-auto">
            <LogoButton onLongPress={() => void reset()} />
            <span className="hidden sm:block text-sm font-bold text-white/95 whitespace-nowrap">מגמלה לצמיחה</span>
            {atStart ? null : (
              <button
                type="button"
                onClick={() => {
                  booth.leave();
                  navigate("/");
                }}
                className="booth-bar-btn"
              >
                <Home className="w-4 h-4" aria-hidden="true" />
                <span className="hidden sm:inline">לבחירת תפקיד</span>
                <span className="sr-only sm:hidden">לבחירת תפקיד</span>
              </button>
            )}
            <span className="flex-1" />
            <BoothA11y />
            <span className="booth-badge" onClick={onBadge}>
              {BADGE}
            </span>
          </div>
        </header>
      )}
      {presenter ? <BoothA11y floating /> : null}
      {presenter ? (
        <span className="booth-badge booth-badge--float" onClick={onBadge}>
          {BADGE}
        </span>
      ) : null}

      {left !== null ? (
        <div role="alertdialog" aria-live="assertive" aria-label="חזרה למסך הפתיחה" className="booth-idle">
          <p className="text-2xl">עדיין כאן?</p>
          <div className="booth-idle__n">{left}</div>
          <p className="text-2xl">געו במסך כדי להמשיך</p>
        </div>
      ) : null}
    </>
  );
}
