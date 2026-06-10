/**
 * AutoDemo — דמו אוטומטי 30 שניות שרץ לבד
 * 
 * עקרונות:
 * 1. מתחיל רגע שנכנסים — אין צורך ללחוץ "הפעל"
 * 2. מתחיל מדף הבית (כולל hero + סטטיסטיקות + שירותים)
 * 3. עובר בין 6 תחנות × 5 שניות = 30 שניות
 * 4. Progress bar חי + timestamp + שם התחנה
 * 5. שליטה ידנית: רווח=עצירה, חיצים=דילוג, Esc=יציאה
 * 6. בסיום — חוזר לדף הבית עם CTA
 */
import { useState, useEffect, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Play, Pause, X, ChevronLeft, ChevronRight, RotateCcw } from "lucide-react";

interface DemoStop {
  route: string;
  title: string;
  subtitle: string;
  duration: number; // ms
}

const STOPS: DemoStop[] = [
  {
    route: "/",
    title: "דף הבית — סל אישי",
    subtitle: "5 ממשקים · 102 שירותים · AI מוסבר · פיילוט חי ירושלים",
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
    subtitle: "כל שירות מדורג 0-100 לפי 5 שכבות · AI שקוף",
    duration: 5000,
  },
  {
    route: "/coordinator",
    title: "דשבורד מלווה — רונית",
    subtitle: "75 אזרחים · סיכונים · משימות · AI אייג'נטים 24/7",
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
    title: "דשבורד ניהולי — ROI ₪2B",
    subtitle: "286 אזרחים · 5 שכונות · 67% מימוש · חיסכון לאומי",
    duration: 5000,
  },
];

const TOTAL_DURATION = STOPS.reduce((sum, s) => sum + s.duration, 0); // 30000ms

export default function AutoDemo() {
  const navigate = useNavigate();
  const [phase, setPhase] = useState<"running" | "ended">("running");
  const [currentStop, setCurrentStop] = useState(0);
  const [paused, setPaused] = useState(false);
  const [elapsed, setElapsed] = useState(0); // ms elapsed in current stop
  const [time, setTime] = useState("");
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const startTimeRef = useRef<number>(Date.now());

  // Live clock
  useEffect(() => {
    const tick = () => setTime(new Date().toLocaleTimeString("he-IL", { hour: "2-digit", minute: "2-digit", second: "2-digit" }));
    tick();
    const iv = setInterval(tick, 1000);
    return () => clearInterval(iv);
  }, []);

  // Navigate on stop change
  useEffect(() => {
    if (phase === "running" && currentStop < STOPS.length) {
      navigate(STOPS[currentStop].route);
    }
  }, [currentStop, phase, navigate]);

  // Auto-advance timer
  useEffect(() => {
    if (phase !== "running" || paused) return;

    startTimeRef.current = Date.now() - elapsed;

    timerRef.current = setInterval(() => {
      const now = Date.now();
      const elapsedInStop = now - startTimeRef.current;
      setElapsed(elapsedInStop);

      if (elapsedInStop >= STOPS[currentStop].duration) {
        // Advance to next stop
        if (currentStop < STOPS.length - 1) {
          setCurrentStop(prev => prev + 1);
          setElapsed(0);
          startTimeRef.current = Date.now();
        } else {
          // Demo ended
          setPhase("ended");
          if (timerRef.current) clearInterval(timerRef.current);
        }
      }
    }, 50);

    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [phase, paused, currentStop]); // eslint-disable-line react-hooks/exhaustive-deps

  // Keyboard controls
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (phase === "ended") return;
      if (e.key === " " || e.key === "Spacebar") {
        e.preventDefault();
        setPaused(p => !p);
      }
      if (e.key === "ArrowLeft" && currentStop < STOPS.length - 1) {
        setCurrentStop(prev => prev + 1);
        setElapsed(0);
      }
      if (e.key === "ArrowRight" && currentStop > 0) {
        setCurrentStop(prev => prev - 1);
        setElapsed(0);
      }
      if (e.key === "Escape") {
        setPhase("ended");
        navigate("/");
      }
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [phase, currentStop, navigate]);

  // Restart
  const restart = () => {
    setPhase("running");
    setCurrentStop(0);
    setElapsed(0);
    setPaused(false);
  };

  // Calculate total progress
  const completedMs = STOPS.slice(0, currentStop).reduce((s, stop) => s + stop.duration, 0) + elapsed;
  const totalProgress = Math.min((completedMs / TOTAL_DURATION) * 100, 100);
  const stopProgress = Math.min((elapsed / STOPS[currentStop]?.duration) * 100, 100);
  const secondsLeft = Math.max(0, Math.ceil((TOTAL_DURATION - completedMs) / 1000));

  // End screen
  if (phase === "ended") {
    return (
      <div className="fixed inset-0 z-[200] bg-[#0a1628] flex items-center justify-center" dir="rtl">
        <div className="text-center max-w-md px-6">
          <div className="w-16 h-16 rounded-2xl bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
            <span className="text-3xl">✅</span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-3">הסיור הסתיים</h1>
          <p className="text-white/50 text-sm mb-8">
            30 שניות · 6 תחנות · מערכת חיה עם נתונים אמיתיים
          </p>
          <div className="flex flex-col gap-3 items-center">
            <button
              onClick={restart}
              className="px-8 py-3 bg-[#1B3A5C] hover:bg-[#2d5a8c] text-white font-bold rounded-xl transition-colors flex items-center gap-2"
            >
              <RotateCcw className="w-5 h-5" />
              הפעל שוב
            </button>
            <button
              onClick={() => navigate("/")}
              className="px-6 py-2.5 bg-white/10 hover:bg-white/20 text-white/70 font-medium rounded-xl transition-colors text-sm"
            >
              חזרה לדף הבית
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Running — overlay banner at bottom
  const current = STOPS[currentStop];
  return (
    <div className="fixed bottom-0 left-0 right-0 z-[200] pointer-events-none" dir="rtl">
      {/* Full-width progress bar */}
      <div className="h-1 bg-white/10">
        <div
          className="h-full bg-gradient-to-l from-blue-400 to-emerald-400 transition-all duration-100"
          style={{ width: `${totalProgress}%` }}
        />
      </div>

      {/* Banner */}
      <div className="pointer-events-auto bg-[#0a1628]/95 backdrop-blur-md border-t border-white/10">
        <div className="max-w-6xl mx-auto px-5 py-3 flex items-center gap-4">

          {/* Stop indicator */}
          <div className="shrink-0 flex flex-col items-center gap-0.5">
            <div className="w-10 h-10 rounded-xl bg-[#1B3A5C] flex items-center justify-center">
              <span className="text-white font-bold text-sm">{currentStop + 1}/{STOPS.length}</span>
            </div>
            <span className="text-[9px] text-white/30 font-mono">{secondsLeft}s</span>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="text-white font-bold text-sm truncate">{current.title}</p>
              {paused && <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">⏸ עצור</span>}
            </div>
            <p className="text-white/45 text-xs mt-0.5 truncate">{current.subtitle}</p>
            {/* Stop progress */}
            <div className="mt-1.5 h-0.5 bg-white/10 rounded-full overflow-hidden w-full max-w-xs">
              <div className="h-full bg-white/30 transition-all duration-100" style={{ width: `${stopProgress}%` }} />
            </div>
          </div>

          {/* Live time */}
          <div className="shrink-0 hidden sm:block">
            <span className="text-[10px] text-white/30 font-mono">LIVE {time}</span>
          </div>

          {/* Controls */}
          <div className="shrink-0 flex items-center gap-1.5">
            <button
              onClick={() => { if (currentStop > 0) { setCurrentStop(prev => prev - 1); setElapsed(0); } }}
              disabled={currentStop === 0}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
              aria-label="תחנה קודמת"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setPaused(p => !p)}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
              aria-label={paused ? "המשך" : "עצור"}
            >
              {paused ? <Play className="w-4 h-4" /> : <Pause className="w-4 h-4" />}
            </button>
            <button
              onClick={() => { if (currentStop < STOPS.length - 1) { setCurrentStop(prev => prev + 1); setElapsed(0); } }}
              disabled={currentStop === STOPS.length - 1}
              className="w-8 h-8 rounded-lg bg-white/10 hover:bg-white/20 disabled:opacity-30 disabled:cursor-not-allowed flex items-center justify-center text-white transition-colors"
              aria-label="תחנה הבאה"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => { setPhase("ended"); navigate("/"); }}
              className="w-8 h-8 rounded-lg bg-red-500/20 hover:bg-red-500/40 flex items-center justify-center text-red-400 transition-colors mr-1"
              aria-label="סיום"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Dots */}
          <div className="shrink-0 flex gap-1">
            {STOPS.map((_, i) => (
              <button
                key={i}
                onClick={() => { setCurrentStop(i); setElapsed(0); }}
                className={`w-2 h-2 rounded-full transition-all ${
                  i === currentStop ? "bg-white w-5" : i < currentStop ? "bg-white/50" : "bg-white/15"
                }`}
                aria-label={`תחנה ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
