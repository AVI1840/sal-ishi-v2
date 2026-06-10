/**
 * AutoDemoOverlay — דמו אוטומטי 30 שניות
 * 
 * גישה: Global overlay שחי מחוץ ל-Routes (ב-App.tsx).
 * מופעל דרך localStorage event — כך הוא שורד navigate בין דפים.
 * 
 * Flow:
 * 1. סקירה מהירה 3 שניות (מה זה סל אישי + מה נראה)
 * 2. 6 תחנות × 5 שניות = 30 שניות סה"כ (כולל הסקירה)
 * 3. מסך סיום עם CTA
 */
import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pause, X, ChevronLeft, ChevronRight, RotateCcw, Wallet } from "lucide-react";

// ─── Types ───
interface DemoStop {
  route: string;
  title: string;
  subtitle: string;
  duration: number;
}

// ─── Demo Stops ───
const STOPS: DemoStop[] = [
  {
    route: "/",
    title: "דף הבית — סל אישי",
    subtitle: "פלטפורמת AI להתאמת שירותי מניעה לאזרחים ותיקים",
    duration: 5000,
  },
  {
    route: "/citizen",
    title: "ממשק האזרח — שרה כהן, בת 78",
    subtitle: "סל מותאם אישית · ארנק דיגיטלי · לוח פעילויות",
    duration: 5000,
  },
  {
    route: "/citizen/services",
    title: "102 שירותי מניעה — ציוני התאמה",
    subtitle: "כל שירות מדורג 0-100 לפי 5 שכבות · AI שקוף ומוסבר",
    duration: 5000,
  },
  {
    route: "/coordinator",
    title: "דשבורד המלווה — רונית",
    subtitle: "75 אזרחים · ניטור סיכונים · משימות · AI אייג'נטים 24/7",
    duration: 5000,
  },
  {
    route: "/coordinator/agents",
    title: "5 אייג'נטים AI פעילים",
    subtitle: "Discovery → Matching → Monitor → Nudge → Supervisor",
    duration: 5000,
  },
  {
    route: "/executive",
    title: "דשבורד ניהולי — ROI",
    subtitle: "286 אזרחים · 5 שכונות · 67% מימוש · חיסכון ₪2B בהרחבה",
    duration: 5000,
  },
];

const TOTAL_DURATION = STOPS.reduce((sum, s) => sum + s.duration, 0);
const STORAGE_KEY = "sal_auto_demo_active";

// ─── Public API ───
export function startAutoDemo() {
  localStorage.setItem(STORAGE_KEY, "1");
  window.dispatchEvent(new Event("auto_demo_change"));
}

export function stopAutoDemo() {
  localStorage.removeItem(STORAGE_KEY);
  window.dispatchEvent(new Event("auto_demo_change"));
}

// ─── Component ───
export function AutoDemoOverlay() {
  const navigate = useNavigate();
  const [active, setActive] = useState(() => !!localStorage.getItem(STORAGE_KEY));
  const [phase, setPhase] = useState<"intro" | "running" | "ended">("intro");
  const [currentStop, setCurrentStop] = useState(0);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [time, setTime] = useState("");
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startRef = useRef<number>(Date.now());

  // Listen for activation
  useEffect(() => {
    const handler = () => {
      const isActive = !!localStorage.getItem(STORAGE_KEY);
      setActive(isActive);
      if (isActive) {
        setPhase("intro");
        setCurrentStop(0);
        setElapsed(0);
        setPaused(false);
      }
    };
    window.addEventListener("auto_demo_change", handler);
    return () => window.removeEventListener("auto_demo_change", handler);
  }, []);

  // Live clock
  useEffect(() => {
    if (!active) return;
    const tick = () => setTime(new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, [active]);

  // Intro → running after 4s
  useEffect(() => {
    if (!active || phase !== "intro") return;
    const t = setTimeout(() => {
      setPhase("running");
      setCurrentStop(0);
      setElapsed(0);
      navigate(STOPS[0].route);
    }, 4000);
    return () => clearTimeout(t);
  }, [active, phase, navigate]);

  // Navigate on stop change
  useEffect(() => {
    if (!active || phase !== "running") return;
    if (currentStop >= 0 && currentStop < STOPS.length) {
      navigate(STOPS[currentStop].route);
    }
  }, [currentStop, active, phase, navigate]);

  // Auto-advance timer
  useEffect(() => {
    if (!active || phase !== "running" || paused) {
      if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; }
      return;
    }

    startRef.current = Date.now() - elapsed;

    intervalRef.current = setInterval(() => {
      const elapsedInStop = Date.now() - startRef.current;
      setElapsed(elapsedInStop);

      if (elapsedInStop >= STOPS[currentStop].duration) {
        if (currentStop < STOPS.length - 1) {
          setCurrentStop(prev => prev + 1);
          setElapsed(0);
          startRef.current = Date.now();
        } else {
          setPhase("ended");
          if (intervalRef.current) clearInterval(intervalRef.current);
        }
      }
    }, 60);

    return () => { if (intervalRef.current) { clearInterval(intervalRef.current); intervalRef.current = null; } };
  }, [active, phase, paused, currentStop]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard
  useEffect(() => {
    if (!active || phase === "ended") return;
    const handleKey = (e: KeyboardEvent) => {
      if (phase === "intro") return;
      if (e.key === " " || e.key === "Spacebar") { e.preventDefault(); setPaused(p => !p); }
      if (e.key === "ArrowLeft" && currentStop < STOPS.length - 1) { setCurrentStop(p => p + 1); setElapsed(0); }
      if (e.key === "ArrowRight" && currentStop > 0) { setCurrentStop(p => p - 1); setElapsed(0); }
      if (e.key === "Escape") { endDemo(); }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [active, phase, currentStop]);

  const endDemo = useCallback(() => {
    setPhase("ended");
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);

  const restart = useCallback(() => {
    setPhase("intro");
    setCurrentStop(0);
    setElapsed(0);
    setPaused(false);
  }, []);

  const closeDemo = useCallback(() => {
    stopAutoDemo();
    setActive(false);
    navigate("/");
  }, [navigate]);

  if (!active) return null;

  // ─── INTRO SCREEN ───
  if (phase === "intro") {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0a1628] flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-lg px-6 animate-fade-in">
          <div className="w-16 h-16 rounded-2xl bg-[#1B3A5C] flex items-center justify-center mx-auto mb-6">
            <Wallet className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">סל אישי</h1>
          <p className="text-xl text-white/70 mb-2">
            מערכת AI להתאמת שירותי מניעה לאזרחים ותיקים
          </p>
          <p className="text-sm text-white/40 mb-6">
            פיילוט חי · ירושלים · ביטוח לאומי + משרד האוצר
          </p>

          <div className="grid grid-cols-3 gap-6 mb-8">
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-400">286</div>
              <div className="text-xs text-white/40 mt-1">אזרחים בפיילוט</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-emerald-400">102</div>
              <div className="text-xs text-white/40 mt-1">שירותי מניעה</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-amber-400">5</div>
              <div className="text-xs text-white/40 mt-1">אייג'נטים AI</div>
            </div>
          </div>

          <div className="mb-6 p-4 rounded-xl bg-white/5 border border-white/10 text-right">
            <p className="text-sm text-white/60 leading-relaxed">
              ⚡ <span className="text-white/80 font-medium">מה תראו בסיור:</span> ממשק האזרח הוותיק, 
              ציוני התאמה AI מוסברים, דשבורד המלווה עם ניטור סיכונים, 5 אייג'נטים אוטונומיים, 
              ודשבורד ניהולי עם ROI.
            </p>
          </div>

          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-white/50">הסיור מתחיל אוטומטית...</span>
          </div>

          {/* Progress bar for intro countdown */}
          <div className="w-48 h-1 bg-white/10 rounded-full mx-auto overflow-hidden">
            <div className="h-full bg-white/30 rounded-full animate-[grow_4s_linear]" style={{ animation: "grow 4s linear forwards" }} />
          </div>

          <button
            onClick={() => { setPhase("running"); setCurrentStop(0); setElapsed(0); navigate(STOPS[0].route); }}
            className="mt-5 text-xs text-white/30 hover:text-white/60 transition-colors"
          >
            דלג ← התחל עכשיו
          </button>
        </div>
      </div>
    );
  }

  // ─── END SCREEN ───
  if (phase === "ended") {
    return (
      <div className="fixed inset-0 z-[9999] bg-[#0a1628] flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">הסיור הסתיים</h1>
          <p className="text-white/50 text-sm mb-2">30 שניות · 6 תחנות · מערכת חיה</p>
          <p className="text-white/35 text-xs mb-8">פיילוט ירושלים · ביטוח לאומי + משרד האוצר</p>
          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={restart}
              className="px-8 py-3 bg-[#1B3A5C] hover:bg-[#2d5a8c] text-white font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              הפעל שוב
            </button>
            <button
              onClick={closeDemo}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white/70 font-medium rounded-xl transition-colors text-sm"
            >
              צפה במערכת בעצמך
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ─── RUNNING — TOP BANNER (avoids conflict with mobile nav) ───
  const current = STOPS[currentStop];
  const completedMs = STOPS.slice(0, currentStop).reduce((s, stop) => s + stop.duration, 0) + elapsed;
  const totalProgress = Math.min((completedMs / TOTAL_DURATION) * 100, 100);
  const stopProgress = Math.min((elapsed / current.duration) * 100, 100);
  const secondsLeft = Math.max(0, Math.ceil((TOTAL_DURATION - completedMs) / 1000));

  return (
    <>
      {/* TOP BANNER — always visible, above everything */}
      <div className="fixed top-0 left-0 right-0 z-[9999]" dir="rtl">
        {/* Banner */}
        <div className="bg-[#0a1628] border-b border-white/10 shadow-2xl">
          <div className="max-w-6xl mx-auto px-4 py-2.5 flex items-center gap-3">

            {/* Stop # + countdown */}
            <div className="shrink-0 flex items-center gap-2">
              <div className="w-8 h-8 rounded-lg bg-[#1B3A5C] flex items-center justify-center">
                <span className="text-white font-bold text-xs">{currentStop + 1}/{STOPS.length}</span>
              </div>
              <span className="text-xs text-white/40 font-mono tabular-nums">{secondsLeft}s</span>
            </div>

            {/* Title + subtitle */}
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2">
                <p className="text-white font-bold text-sm truncate">{current.title}</p>
                {paused && <span className="text-[10px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-400 font-medium">⏸ עצור</span>}
              </div>
              <p className="text-white/40 text-[11px] mt-0.5 truncate">{current.subtitle}</p>
            </div>

            {/* Live */}
            <div className="shrink-0 hidden sm:block text-[10px] text-white/30 font-mono">
              🔴 LIVE {time}
            </div>

            {/* Controls */}
            <div className="shrink-0 flex items-center gap-1">
              <button
                onClick={() => { if (currentStop > 0) { setCurrentStop(p => p - 1); setElapsed(0); } }}
                disabled={currentStop === 0}
                className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 disabled:opacity-20 flex items-center justify-center text-white"
              >
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={() => setPaused(p => !p)}
                className="w-7 h-7 rounded bg-white/15 hover:bg-white/25 flex items-center justify-center text-white"
              >
                {paused ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
              </button>
              <button
                onClick={() => { if (currentStop < STOPS.length - 1) { setCurrentStop(p => p + 1); setElapsed(0); } }}
                disabled={currentStop === STOPS.length - 1}
                className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 disabled:opacity-20 flex items-center justify-center text-white"
              >
                <ChevronLeft className="w-3.5 h-3.5" />
              </button>
              <button
                onClick={endDemo}
                className="w-7 h-7 rounded bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-400 mr-1"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Dots */}
            <div className="shrink-0 flex gap-1 items-center">
              {STOPS.map((_, i) => (
                <div
                  key={i}
                  className={`h-1.5 rounded-full transition-all ${
                    i === currentStop ? "bg-white w-4" : i < currentStop ? "bg-white/50 w-1.5" : "bg-white/15 w-1.5"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Progress bar at the bottom of the banner */}
          <div className="h-1 bg-white/5">
            <div
              className="h-full bg-gradient-to-l from-blue-400 to-emerald-400 transition-all duration-100 ease-linear"
              style={{ width: `${totalProgress}%` }}
            />
          </div>
        </div>
      </div>
    </>
  );
}
