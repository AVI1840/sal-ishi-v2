/**
 * GuidedDemo — floating golden-path overlay for the 4-minute hackathon demo.
 * State stored in localStorage so it survives route navigation.
 * Triggered from Hackathon.tsx via startGuidedDemo() helper.
 */
import { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft, ChevronRight, X, MapPin } from "lucide-react";
import { cn } from "@/lib/utils";

export interface DemoStep {
  time: string;
  route: string;
  title: string;
  callout: string;
  focus: string; // what to click/show on this page
}

export const DEMO_STEPS: DemoStep[] = [
  {
    time: "0:00",
    route: "/",
    title: "דף הבית",
    callout: "5 ממשקים — לאזרח, מלווה, ניהולי, ספקים, האקתון",
    focus: "לחץ על 'מלווה מורחב — AI ואייג'נטים'",
  },
  {
    time: "0:30",
    route: "/citizen",
    title: "ממשק אזרח — שרה",
    callout: "שרה כהן מקבלת המלצות מותאמות AI — מניעת הידרדרות, מוטיבציות, קרבה",
    focus: "לחץ על שירות מומלץ כדי לראות פירוק 5 שכבות",
  },
  {
    time: "1:00",
    route: "/citizen/services",
    title: "102 שירותים — ציוני התאמה",
    callout: "כל שירות מדורג 0-100 לפי פרופיל אישי — לא ממוצע",
    focus: "לחץ על שירות כלשהו ← ראה Explainability",
  },
  {
    time: "1:30",
    route: "/coordinator",
    title: "דשבורד מלווה — Agentic Flow",
    callout: "לחץ 'הפעל הדגמה' לראות לולאת AI מקצה לקצה — ללא התערבות ידנית",
    focus: "לחץ 'הפעל הדגמה' בכרטיס ה-Agentic Flow",
  },
  {
    time: "2:00",
    route: "/coordinator/agents",
    title: "5 אייג'נטים פעילים 24/7",
    callout: "כל אייג'נט מתמחה: Discovery → Matching → Monitor → Nudge → Super",
    focus: "בחר אייג'נט ← לחץ 'הפעל ידנית'",
  },
  {
    time: "2:30",
    route: "/coordinator/intake",
    title: "אינטייק קולי AI",
    callout: "Amazon Transcribe מתמלל בזמן אמת → Claude מנתח מוטיבציות וחסמים",
    focus: "לחץ 'התחל הקלטה' כדי להדגים",
  },
  {
    time: "3:00",
    route: "/coordinator/algorithm",
    title: "אלגוריתם 5 שכבות",
    callout: "כוון את ה-sliders וראה איך הציון משתנה בזמן אמת",
    focus: "גרור slider של מניעה ← ראה שינוי ציונים",
  },
  {
    time: "3:30",
    route: "/executive",
    title: "ניהולי — ROI ₪2B",
    callout: "286 אזרחים, 5 שכונות, 67% מימוש זכויות, חיסכון ₪2B בהרחבה לאומית",
    focus: "הראה timeline הרפורמה ומפת הפיילוטים",
  },
];

const STORAGE_KEY = "sal_demo_active";
const STORAGE_STEP = "sal_demo_step";

export function startGuidedDemo() {
  localStorage.setItem(STORAGE_KEY, "1");
  localStorage.setItem(STORAGE_STEP, "0");
  window.dispatchEvent(new Event("demo_state_change"));
}

export function GuidedDemo() {
  const [active, setActive] = useState(() => !!localStorage.getItem(STORAGE_KEY));
  const [step, setStep] = useState(() => Number(localStorage.getItem(STORAGE_STEP) ?? 0));

  // Listen for external activation (from Hackathon page button)
  useEffect(() => {
    const handler = () => {
      setActive(!!localStorage.getItem(STORAGE_KEY));
      setStep(Number(localStorage.getItem(STORAGE_STEP) ?? 0));
    };
    window.addEventListener("demo_state_change", handler);
    return () => window.removeEventListener("demo_state_change", handler);
  }, []);

  const persist = useCallback((newStep: number) => {
    localStorage.setItem(STORAGE_STEP, String(newStep));
    setStep(newStep);
  }, []);

  const close = useCallback(() => {
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(STORAGE_STEP);
    setActive(false);
    setStep(0);
  }, []);

  const next = useCallback(() => {
    const n = Math.min(step + 1, DEMO_STEPS.length - 1);
    persist(n);
  }, [step, persist]);

  const prev = useCallback(() => {
    const n = Math.max(step - 1, 0);
    persist(n);
  }, [step, persist]);

  if (!active) return null;

  const current = DEMO_STEPS[step];
  const progress = ((step + 1) / DEMO_STEPS.length) * 100;

  return (
    <div className="fixed bottom-0 right-0 left-0 z-50 pointer-events-none" dir="rtl">
      {/* Progress bar */}
      <div className="h-0.5 bg-gray-200">
        <div
          className="h-full bg-[#1B3A5C] transition-all duration-500"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Main bar */}
      <div className="pointer-events-auto bg-white/95 backdrop-blur border-t border-[#1B3A5C]/20 shadow-lg">
        <div className="max-w-5xl mx-auto px-4 py-3 flex items-center gap-3">

          {/* Step badge */}
          <div className="shrink-0 flex items-center gap-2">
            <span className="w-7 h-7 rounded-full bg-[#1B3A5C] text-white text-xs font-bold flex items-center justify-center">
              {step + 1}
            </span>
            <span className="text-[10px] font-bold text-[#1B3A5C] tabular-nums">{current.time}</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="text-sm font-bold text-gray-900">{current.title}</span>
              <span className="hidden sm:inline text-[10px] text-gray-400">·</span>
              <span className="hidden sm:inline text-xs text-gray-600 truncate">{current.callout}</span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5">
              <MapPin className="w-3 h-3 text-[#1B3A5C] shrink-0" />
              <span className="text-[10px] text-[#1B3A5C] font-medium">{current.focus}</span>
            </div>
          </div>

          {/* Navigation */}
          <div className="shrink-0 flex items-center gap-2">
            <button
              onClick={prev}
              disabled={step === 0}
              className={cn(
                "w-8 h-8 rounded-lg border flex items-center justify-center transition-colors",
                step === 0 ? "border-gray-100 text-gray-300 cursor-not-allowed" : "border-gray-200 text-gray-600 hover:bg-gray-50"
              )}
              aria-label="שלב קודם"
            >
              <ChevronRight className="w-4 h-4" />
            </button>

            {step < DEMO_STEPS.length - 1 ? (
              <Link
                to={DEMO_STEPS[step + 1].route}
                onClick={next}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[#1B3A5C] text-white text-xs font-semibold hover:bg-[#15304d] transition-colors"
              >
                הבא <ChevronLeft className="w-3.5 h-3.5" />
              </Link>
            ) : (
              <button
                onClick={close}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-semibold hover:bg-emerald-700 transition-colors"
              >
                סיום
              </button>
            )}

            <button
              onClick={close}
              className="w-8 h-8 rounded-lg border border-gray-200 flex items-center justify-center text-gray-400 hover:bg-gray-50 transition-colors"
              aria-label="סגור הדגמה"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Step dots */}
        <div className="pb-1.5 flex justify-center gap-1">
          {DEMO_STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => persist(i)}
              className={cn(
                "w-1.5 h-1.5 rounded-full transition-all",
                i === step ? "bg-[#1B3A5C] w-4" : i < step ? "bg-[#1B3A5C]/40" : "bg-gray-200"
              )}
              aria-label={`שלב ${i + 1}`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
