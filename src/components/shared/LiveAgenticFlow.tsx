/**
 * LiveAgenticFlow — Hero component for the Hackathon demo
 * Presenter clicks "הפעל הדגמה" → each step reveals with animation
 * Bedrock Analysis step shows streaming-like typing effect
 */
import { useState, useEffect, useRef } from "react";
import { Mic, Brain, Target, Zap, Mail, Play, CheckCircle, Sparkles, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

type StepStatus = "hidden" | "running" | "done";

interface FlowStep {
  icon: typeof Mic;
  title: string;
  service: string;
  input: string;
  output: string;
  color: string;
  border: string;
  bg: string;
  streaming?: boolean;
}

const STEPS: FlowStep[] = [
  {
    icon: Mic,
    title: "תמלול קולי",
    service: "Amazon Transcribe",
    input: "הקלטת שיחה — רבקה לוי, 78",
    output: "\"כואב לי הברך... לא יצאתי כבר 3 שבועות. מרגישה לבד.\"",
    color: "text-blue-600",
    border: "border-blue-200",
    bg: "bg-blue-50",
  },
  {
    icon: Brain,
    title: "ניתוח AI",
    service: "Amazon Bedrock (Claude)",
    input: "טקסט מתומלל + היסטוריית פרופיל",
    output: "זיהה: בדידות 5/5 · כאב ברגל · מוטיבציה: שייכות · חסם: ניידות",
    color: "text-purple-600",
    border: "border-purple-200",
    bg: "bg-purple-50",
    streaming: true,
  },
  {
    icon: Target,
    title: "התאמה 5-שכבות",
    service: "Matching Engine",
    input: "286×102 ציוני התאמה",
    output: "חוג שירה 94% · פיזיותרפיה ביתית 91% · מועדון הליכה 87%",
    color: "text-amber-600",
    border: "border-amber-200",
    bg: "bg-amber-50",
  },
  {
    icon: Zap,
    title: "פעולת CRM",
    service: "AWS Lambda",
    input: "top-match + פרופיל מלווה",
    output: "נוצרה משימה: להתקשר לרבקה ב-10:00 · תזכורת נשלחה לרונית",
    color: "text-emerald-600",
    border: "border-emerald-200",
    bg: "bg-emerald-50",
  },
  {
    icon: Mail,
    title: "Nudge אישי",
    service: "WhatsApp · Amazon SNS",
    input: "מוטיבציה: שייכות · שירות מובייל",
    output: "\"רבקה שלום! ✨ מחר ב-10:00 יש חוג שירה. מרים חברתך תהיה שם. אפשר להסיע?\"",
    color: "text-pink-600",
    border: "border-pink-200",
    bg: "bg-pink-50",
  },
];

const STEP_DELAY = 1400; // ms between steps
const STREAM_CHAR_DELAY = 22; // ms per character

function StreamingText({ text, active }: { text: string; active: boolean }) {
  const [displayed, setDisplayed] = useState("");
  const iRef = useRef(0);

  useEffect(() => {
    if (!active) { setDisplayed(""); iRef.current = 0; return; }
    const tick = () => {
      if (iRef.current < text.length) {
        iRef.current++;
        setDisplayed(text.slice(0, iRef.current));
        setTimeout(tick, STREAM_CHAR_DELAY + Math.random() * 15);
      }
    };
    tick();
  }, [active, text]);

  return (
    <span>
      {displayed}
      {active && displayed.length < text.length && (
        <span className="inline-block w-0.5 h-3.5 bg-purple-500 ml-0.5 animate-pulse align-text-bottom" />
      )}
    </span>
  );
}

export function LiveAgenticFlow() {
  const [phase, setPhase] = useState<"idle" | "running" | "done">("idle");
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>(STEPS.map(() => "hidden"));

  const startDemo = () => {
    setPhase("running");
    setStepStatuses(STEPS.map(() => "hidden"));

    STEPS.forEach((_, i) => {
      setTimeout(() => {
        setStepStatuses((prev) => {
          const next = [...prev];
          if (i > 0) next[i - 1] = "done";
          next[i] = "running";
          return next;
        });
        if (i === STEPS.length - 1) {
          // Mark last step done after streaming finishes
          const streamTime = STEPS[i].streaming ? STEPS[i].output.length * STREAM_CHAR_DELAY + 800 : 600;
          setTimeout(() => {
            setStepStatuses((prev) => {
              const next = [...prev];
              next[i] = "done";
              return next;
            });
            setPhase("done");
          }, streamTime);
        }
      }, i * STEP_DELAY);
    });
  };

  const reset = () => {
    setPhase("idle");
    setStepStatuses(STEPS.map(() => "hidden"));
  };

  return (
    <div className="libi-card p-5">
      {/* Header */}
      <div className="flex items-center gap-3 mb-5">
        <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-[#1B3A5C] to-[#2d5a8c] text-white flex items-center justify-center shrink-0">
          <Sparkles className="w-4 h-4" />
        </div>
        <div className="flex-1">
          <h3 className="text-base font-bold text-foreground">Agentic AI Flow — הדגמה חיה</h3>
          <p className="text-xs text-muted-foreground">מקצה לקצה · Amazon Bedrock · אוטומטי לחלוטין</p>
        </div>
        {phase === "idle" && (
          <button
            onClick={startDemo}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[#1B3A5C] text-white text-sm font-semibold hover:bg-[#15304d] transition-colors shadow-sm"
          >
            <Play className="w-3.5 h-3.5 fill-current" /> הפעל הדגמה
          </button>
        )}
        {phase === "running" && (
          <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-bold tracking-wide animate-pulse">
            LIVE
          </span>
        )}
        {phase === "done" && (
          <button onClick={reset} className="text-xs text-muted-foreground hover:text-foreground transition-colors underline">
            איפוס
          </button>
        )}
      </div>

      {/* Idle state instruction */}
      {phase === "idle" && (
        <div className="rounded-xl border border-dashed border-[#1B3A5C]/20 bg-[#1B3A5C]/[0.02] p-4 text-center">
          <p className="text-sm text-muted-foreground">
            לחץ <span className="font-semibold text-[#1B3A5C]">הפעל הדגמה</span> כדי לראות את הלולאה האוטונומית — מקליטת שיחה ועד Nudge אישי
          </p>
        </div>
      )}

      {/* Steps */}
      {phase !== "idle" && (
        <div className="relative grid grid-cols-1 sm:grid-cols-5 gap-2">
          {STEPS.map((step, i) => {
            const status = stepStatuses[i];
            const Icon = step.icon;
            const isRunning = status === "running";
            const isDone = status === "done";
            const isHidden = status === "hidden";

            return (
              <div key={i} className="relative">
                {/* Connector arrow */}
                {i < STEPS.length - 1 && (
                  <div className="hidden sm:flex absolute -left-1 top-1/2 -translate-y-1/2 z-10 w-2 justify-center">
                    <span className={cn("text-xs font-bold transition-colors", isDone ? "text-[#1B3A5C]" : "text-gray-200")}>›</span>
                  </div>
                )}

                <div className={cn(
                  "rounded-xl border p-3 transition-all duration-500",
                  isHidden && "opacity-0 translate-y-2",
                  isRunning && `${step.border} ${step.bg} shadow-sm scale-[1.02]`,
                  isDone && "border-gray-100 bg-white opacity-90",
                  !isHidden && "opacity-100 translate-y-0",
                )}>
                  <div className="flex items-start gap-2 mb-2">
                    <div className={cn(
                      "w-7 h-7 rounded-lg flex items-center justify-center shrink-0 transition-colors",
                      isRunning ? `${step.bg} ${step.color}` : isDone ? "bg-emerald-50 text-emerald-600" : "bg-gray-50 text-gray-400",
                    )}>
                      {isDone ? <CheckCircle className="w-3.5 h-3.5" /> : <Icon className="w-3.5 h-3.5" />}
                    </div>
                    <div className="min-w-0">
                      <p className="text-xs font-bold text-gray-900 leading-tight">{step.title}</p>
                      <p className="text-[9px] text-gray-400 leading-tight mt-0.5">{step.service}</p>
                    </div>
                  </div>

                  <div className="mt-2 space-y-1.5">
                    <div className="text-[9px] text-gray-400 font-medium">INPUT</div>
                    <p className="text-[10px] text-gray-600 leading-relaxed">{step.input}</p>
                    <div className="text-[9px] text-gray-400 font-medium mt-1">OUTPUT</div>
                    <p className={cn("text-[10px] leading-relaxed", isRunning ? step.color : "text-gray-700")}>
                      {step.streaming && isRunning ? (
                        <StreamingText text={step.output} active={isRunning} />
                      ) : isDone || (!step.streaming && isRunning) ? (
                        step.output
                      ) : (
                        <span className="text-gray-300">—</span>
                      )}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Final result */}
      {phase === "done" && (
        <div className="mt-4 p-3.5 rounded-xl bg-gradient-to-l from-[#1B3A5C]/8 to-[#1B3A5C]/3 border border-[#1B3A5C]/15 animate-in fade-in slide-in-from-bottom-2 duration-500">
          <div className="flex items-start gap-2.5">
            <TrendingUp className="w-4 h-4 text-[#1B3A5C] mt-0.5 shrink-0" />
            <div>
              <p className="text-xs font-bold text-[#1B3A5C] mb-1">תוצאה — ללא התערבות ידנית</p>
              <p className="text-xs text-gray-700 leading-relaxed">
                רבקה לוי (21 יום ללא פעילות) → AI זיהה בדידות + כאב ברגל → הותאם חוג שירה + פיזיותרפיה → נשלח Nudge אישי → <span className="font-semibold text-emerald-700">ממתין לאישור</span>
              </p>
              <p className="text-[10px] text-gray-400 mt-1.5">
                זמן ריצה: 2.3 שניות · 0 התערבות אנושית · מבוסס Amazon Bedrock
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
