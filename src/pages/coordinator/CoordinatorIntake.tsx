import { useState, useEffect, useRef } from "react";
import { User, Heart, Activity, Mic, CheckCircle2, ChevronLeft, ChevronRight, Check, AlertTriangle, Wallet, Sparkles, Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { ProgressBar } from "@/components/shared/ProgressBar";
import { Chip } from "@/components/shared/Chip";
import { toast } from "sonner";

const STEPS = [
  { label: "פרטים אישיים", icon: User },
  { label: "רצונות ומשמעות", icon: Heart },
  { label: "תפקוד ובריאות", icon: Activity },
  { label: "הקלטה ושיחה", icon: Mic },
  { label: "תוכנית אישית", icon: CheckCircle2 },
];

const PREFERENCE_OPTIONS = ["מוזיקה", "טבע", "אמונה", "משפחה", "התנדבות", "אומנות", "למידה", "חברה", "בישול", "גינון", "ספורט", "טכנולוגיה", "נכדים"];
const MEDICAL_CONDITIONS = ["סוכרת", "יתר לחץ דם", "אי ספיקת לב", "דמנציה", "פרקינסון", "אוסטאופורוזיס", "דיכאון", "COPD", "סרטן", "אירוע מוחי"];
const RISK_FLAGS_OPTIONS = ["נפילות חוזרות", "בדידות חברתית", "תת-תזונה", "הזנחה עצמית", "סיכון לאשפוז", "עומס מטפל", "בעיות תרופתיות"];
const CITIES = ["ירושלים", "תל אביב", "חיפה", "באר שבע", "נתניה", "אשדוד", "פתח תקווה", "ראשון לציון"];

export default function CoordinatorIntake() {
  const [step, setStep] = useState(0);
  const [personal, setPersonal] = useState({ firstName: "", lastName: "", age: "", city: "", phone: "", emergencyContact: "", emergencyPhone: "", nursingLevel: "" });
  const [desires, setDesires] = useState({ preferences: [] as string[], dream: "", meaningText: "" });
  const [health, setHealth] = useState({ mobility: 3, cognition: 3, emotional: 3, social: 3, vision: 3, hearing: 3, conditions: [] as string[], riskFlags: [] as string[] });
  const [recording, setRecording] = useState({ isRecording: false, seconds: 0, notes: "" });
  const [demoTranscription, setDemoTranscription] = useState<"idle" | "recording" | "processing" | "done">("idle");
  const [demoTimer, setDemoTimer] = useState(0);
  const demoTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (recording.isRecording) {
      timerRef.current = setInterval(() => setRecording((p) => ({ ...p, seconds: p.seconds + 1 })), 1000);
    } else if (timerRef.current) { clearInterval(timerRef.current); }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [recording.isRecording]);

  const startDemoTranscription = () => {
    setDemoTranscription("recording");
    setDemoTimer(0);
    demoTimerRef.current = setInterval(() => setDemoTimer((t) => t + 1), 1000);
    setTimeout(() => {
      if (demoTimerRef.current) clearInterval(demoTimerRef.current);
      setDemoTranscription("processing");
      setTimeout(() => {
        setDemoTranscription("done");
      }, 2000);
    }, 3000);
  };

  const formatTime = (s: number) => `${Math.floor(s / 60).toString().padStart(2, "0")}:${(s % 60).toString().padStart(2, "0")}`;
  const next = () => { if (step < 4) setStep(step + 1); };
  const prev = () => { if (step > 0) setStep(step - 1); };
  const progress = ((step + 1) / 5) * 100;

  const generatePlan = () => {
    const services: string[] = [];
    if (health.mobility <= 2) services.push("פיזיותרפיה בבית");
    if (health.social <= 2 || desires.preferences.includes("חברה")) services.push("מועדון יום חברתי");
    if (desires.preferences.includes("מוזיקה")) services.push("טיפול במוזיקה");
    if (desires.preferences.includes("טבע")) services.push("גינון טיפולי");
    if (health.cognition <= 2) services.push("הפעלה קוגניטיבית");
    if (health.emotional <= 2) services.push("תמיכה רגשית");
    if (services.length < 3) services.push("ביקור מתנדב שבועי", "סיוע טכנולוגי");
    const walletTotal = personal.nursingLevel === "1" ? 80 : personal.nursingLevel === "2" ? 120 : 160;
    return { services: services.slice(0, 5), walletTotal };
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">קליטה חדשה</h1>
        <p className="text-sm text-muted-foreground mt-1">אשף קליטת אזרח/ית חדש/ה למערכת הסל האישי</p>
      </div>

      <ProgressBar value={progress} max={100} tone="primary" size="sm" />

      {/* Step Indicator */}
      <div className="flex items-center justify-center gap-0">
        {STEPS.map((s, i) => {
          const Icon = s.icon;
          return (
            <div key={i} className="flex items-center">
              <button onClick={() => setStep(i)} className="flex flex-col items-center gap-1.5 px-2 group">
                <div className={cn("w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all",
                  i === step ? "bg-primary text-primary-foreground border-primary shadow-md" :
                  i < step ? "bg-success text-success-foreground border-success" :
                  "bg-background text-muted-foreground border-border group-hover:border-primary/40"
                )}>
                  {i < step ? <Check className="w-4 h-4" /> : <Icon className="w-4 h-4" />}
                </div>
                <span className={cn("text-[11px] font-medium whitespace-nowrap", i === step ? "text-primary" : i < step ? "text-success" : "text-muted-foreground")}>{s.label}</span>
              </button>
              {i < STEPS.length - 1 && <div className={cn("w-8 h-0.5 mt-[-18px]", i < step ? "bg-success" : "bg-border")} />}
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <div className="animate-fade-in">
        {step === 0 && (
          <div className="libi-card p-5">
            <h3 className="text-base font-semibold text-foreground mb-4">פרטים אישיים</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {[
                { label: "שם פרטי", key: "firstName", type: "text", placeholder: "שם פרטי" },
                { label: "שם משפחה", key: "lastName", type: "text", placeholder: "שם משפחה" },
                { label: "גיל", key: "age", type: "number", placeholder: "גיל" },
                { label: "טלפון", key: "phone", type: "tel", placeholder: "050-0000000" },
                { label: "איש קשר לחירום", key: "emergencyContact", type: "text", placeholder: "שם" },
                { label: "טלפון חירום", key: "emergencyPhone", type: "tel", placeholder: "050-0000000" },
              ].map((field) => (
                <div key={field.key}>
                  <label className="block text-sm font-medium text-foreground mb-1.5">{field.label}</label>
                  <input type={field.type} value={(personal as Record<string, string>)[field.key]} onChange={(e) => setPersonal({ ...personal, [field.key]: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30" placeholder={field.placeholder} />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">עיר</label>
                <select value={personal.city} onChange={(e) => setPersonal({ ...personal, city: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">בחר עיר</option>
                  {CITIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-foreground mb-1.5">רמת סיעוד</label>
                <select value={personal.nursingLevel} onChange={(e) => setPersonal({ ...personal, nursingLevel: e.target.value })} className="w-full px-3 py-2.5 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30">
                  <option value="">בחר רמה</option>
                  <option value="1">רמה 1</option>
                  <option value="2">רמה 2</option>
                  <option value="3">רמה 3</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {step === 1 && (
          <div className="libi-card p-5 space-y-6">
            <h3 className="text-base font-semibold text-foreground">רצונות ומשמעות</h3>
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">תחומי עניין</label>
              <div className="flex flex-wrap gap-2">
                {PREFERENCE_OPTIONS.map((pref) => (
                  <button key={pref} onClick={() => setDesires({ ...desires, preferences: desires.preferences.includes(pref) ? desires.preferences.filter((p) => p !== pref) : [...desires.preferences, pref] })}
                    className={cn("px-3 py-1.5 rounded-full text-sm font-medium border transition-colors", desires.preferences.includes(pref) ? "bg-primary text-primary-foreground border-primary" : "bg-background text-foreground border-border hover:border-primary/50")}>
                    {pref}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">מה מביא לך משמעות?</label>
              <textarea value={desires.meaningText} onChange={(e) => setDesires({ ...desires, meaningText: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[80px]" placeholder="ספר/י לנו מה חשוב לך..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">חלום 🌟</label>
              <textarea value={desires.dream} onChange={(e) => setDesires({ ...desires, dream: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[60px]" placeholder="אם היה אפשר להגשים חלום אחד..." />
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="libi-card p-5 space-y-6">
            <h3 className="text-base font-semibold text-foreground">תפקוד ובריאות</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              {(["mobility", "cognition", "emotional", "social", "vision", "hearing"] as const).map((key) => {
                const labels: Record<string, string> = { mobility: "ניידות", cognition: "קוגניציה", emotional: "רגשי", social: "חברתי", vision: "ראייה", hearing: "שמיעה" };
                return (
                  <div key={key}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-foreground">{labels[key]}</span>
                      <span className="text-xs text-muted-foreground">{health[key]}/5</span>
                    </div>
                    <div className="flex gap-1.5">
                      {[1, 2, 3, 4, 5].map((val) => (
                        <button key={val} onClick={() => setHealth({ ...health, [key]: val })}
                          className={cn("flex-1 h-8 rounded-md text-xs font-medium transition-colors border",
                            health[key] === val ? (val <= 2 ? "bg-destructive text-destructive-foreground border-destructive" : val === 3 ? "bg-warning text-warning-foreground border-warning" : "bg-success text-success-foreground border-success") : "bg-background text-muted-foreground border-border hover:border-primary/40"
                          )}>{val}</button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">מצבים רפואיים</label>
              <div className="flex flex-wrap gap-2">
                {MEDICAL_CONDITIONS.map((cond) => (
                  <button key={cond} onClick={() => setHealth({ ...health, conditions: health.conditions.includes(cond) ? health.conditions.filter((c) => c !== cond) : [...health.conditions, cond] })}
                    className={cn("px-3 py-1.5 rounded-full text-sm font-medium border transition-colors", health.conditions.includes(cond) ? "bg-destructive-soft text-destructive border-destructive/30" : "bg-background text-foreground border-border hover:border-destructive/40")}>
                    {cond}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-3">דגלי סיכון</label>
              <div className="flex flex-wrap gap-2">
                {RISK_FLAGS_OPTIONS.map((flag) => (
                  <button key={flag} onClick={() => setHealth({ ...health, riskFlags: health.riskFlags.includes(flag) ? health.riskFlags.filter((f) => f !== flag) : [...health.riskFlags, flag] })}
                    className={cn("px-3 py-1.5 rounded-full text-sm font-medium border transition-colors", health.riskFlags.includes(flag) ? "bg-warning-soft text-warning-foreground border-warning/30" : "bg-background text-foreground border-border hover:border-warning/40")}>
                    <AlertTriangle className="w-3 h-3 inline-block ml-1" />{flag}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="libi-card p-5 space-y-6">
            <h3 className="text-base font-semibold text-foreground">הקלטה ושיחה</h3>
            <div className="bg-primary-soft/50 border border-primary/10 rounded-xl p-4 text-center">
              <p className="text-sm text-primary font-medium">הקלטת השיחה תתומלל אוטומטית ותשמש לבניית תוכנית אישית</p>
            </div>
            <div className="flex flex-col items-center gap-6 py-6">
              <div className="text-4xl font-mono font-bold text-foreground tabular-nums">{formatTime(recording.seconds)}</div>
              <button onClick={() => setRecording((p) => ({ ...p, isRecording: !p.isRecording }))}
                className={cn("w-20 h-20 rounded-full flex items-center justify-center transition-all shadow-lg", recording.isRecording ? "bg-destructive animate-pulse shadow-destructive/30" : "bg-destructive hover:bg-destructive/90 shadow-destructive/20 hover:scale-105")}>
                {recording.isRecording ? <div className="w-6 h-6 bg-white rounded-sm" /> : <Mic className="w-8 h-8 text-white" />}
              </button>
              <p className="text-sm text-muted-foreground">{recording.isRecording ? "מקליט... לחץ לעצירה" : "לחץ להתחלת הקלטה"}</p>
            </div>

            {/* Demo Transcription Button */}
            <div className="border-t border-border/50 pt-5">
              {demoTranscription === "idle" && (
                <button
                  onClick={startDemoTranscription}
                  className="w-full flex items-center justify-center gap-3 px-5 py-3.5 rounded-xl bg-gradient-to-l from-[#FF9900]/10 to-[#FF9900]/5 border-2 border-dashed border-[#FF9900]/40 text-sm font-semibold text-[#FF9900] hover:border-[#FF9900]/70 hover:bg-[#FF9900]/10 transition-all"
                >
                  <Mic className="w-5 h-5" />
                  הקלט שיחה (דמו)
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#FF9900]/20 text-[#FF9900] font-bold">AI</span>
                </button>
              )}

              {demoTranscription === "recording" && (
                <div className="animate-fade-in flex flex-col items-center gap-4 py-4">
                  <div className="flex items-center gap-3">
                    <span className="relative flex h-4 w-4">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-4 w-4 bg-red-500"></span>
                    </span>
                    <span className="text-sm font-medium text-destructive">מקליט...</span>
                    <span className="text-lg font-mono font-bold text-foreground tabular-nums">{formatTime(demoTimer)}</span>
                  </div>
                  <div className="flex gap-1">
                    {[...Array(12)].map((_, i) => (
                      <div key={i} className="w-1 bg-red-400 rounded-full animate-pulse" style={{ height: `${Math.random() * 24 + 8}px`, animationDelay: `${i * 0.1}s` }} />
                    ))}
                  </div>
                </div>
              )}

              {demoTranscription === "processing" && (
                <div className="animate-fade-in flex flex-col items-center gap-3 py-6">
                  <Loader2 className="w-8 h-8 text-primary animate-spin" />
                  <span className="text-sm font-medium text-primary">מעבד...</span>
                  <span className="text-xs text-muted-foreground">מתמלל ומנתח את השיחה</span>
                </div>
              )}

              {demoTranscription === "done" && (
                <div className="animate-fade-in space-y-4">
                  {/* Transcription Result */}
                  <div className="bg-muted/50 rounded-xl p-4 border border-border/50">
                    <div className="flex items-center gap-2 mb-3">
                      <CheckCircle2 className="w-4 h-4 text-success" />
                      <span className="text-sm font-semibold text-foreground">תמלול שיחה</span>
                    </div>
                    <div className="text-sm text-foreground/80 leading-relaxed space-y-1.5 bg-white rounded-lg p-3 border border-border/30">
                      <p><span className="font-semibold text-primary">מלווה:</span> ספרי לי שרה, מה חשוב לך ביום יום?</p>
                      <p><span className="font-semibold text-muted-foreground">שרה:</span> אני אוהבת לצאת לטיול בוקר, לפגוש חברות. קשה לי עם המדרגות.</p>
                      <p><span className="font-semibold text-primary">מלווה:</span> מה היית רוצה שישתנה?</p>
                      <p><span className="font-semibold text-muted-foreground">שרה:</span> חלמתי תמיד ללמוד ציור. ואני רוצה לשמור על הכושר הגופני.</p>
                    </div>
                  </div>

                  {/* Extracted Insights */}
                  <div className="bg-primary-soft/30 rounded-xl p-4 border border-primary/10">
                    <div className="flex items-center gap-2 mb-3">
                      <Sparkles className="w-4 h-4 text-primary" />
                      <span className="text-sm font-semibold text-foreground">תובנות שזוהו</span>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-xs font-medium text-muted-foreground mb-1.5 block">מוטיבציות</span>
                        <div className="flex flex-wrap gap-1.5">
                          {["חברה", "טבע", "אומנות", "ספורט"].map((tag) => (
                            <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium bg-success-soft text-success border border-success/20">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground mb-1.5 block">חסמים</span>
                        <div className="flex flex-wrap gap-1.5">
                          {["ניידות מוגבלת", "מדרגות"].map((tag) => (
                            <span key={tag} className="px-2.5 py-1 rounded-full text-xs font-medium bg-warning-soft text-warning-foreground border border-warning/20">{tag}</span>
                          ))}
                        </div>
                      </div>
                      <div>
                        <span className="text-xs font-medium text-muted-foreground mb-1.5 block">שלב מוכנות</span>
                        <span className="px-3 py-1.5 rounded-lg text-xs font-bold bg-info-soft text-[hsl(var(--info))] border border-[hsl(var(--info))]/20">מוכנה להתחיל — מוטיבציה גבוהה</span>
                      </div>
                    </div>
                  </div>

                  {/* AWS Badge */}
                  <div className="flex items-center justify-center gap-2 pt-2">
                    <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#232F3E]/5 border border-[#232F3E]/10">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none"><path d="M6.5 17.5c-1.5-1-2.5-2.5-2.5-4.5 0-3 2.5-5 5.5-5 .5-2.5 2.5-4 5-4 3 0 5 2 5 5 0 .5 0 1-.1 1.5 1.5.5 2.6 2 2.6 3.5 0 2.5-2 4-4.5 4h-11z" stroke="#FF9900" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></svg>
                      <span className="text-[11px] font-semibold text-[#232F3E]">Amazon Transcribe + Bedrock</span>
                    </div>
                  </div>
                </div>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground mb-1.5">הערות מהשיחה</label>
              <textarea value={recording.notes} onChange={(e) => setRecording({ ...recording, notes: e.target.value })} className="w-full px-3 py-2 border border-border rounded-lg text-sm bg-background focus:outline-none focus:ring-2 focus:ring-primary/30 min-h-[120px]" placeholder="רשום כאן הערות חשובות מהשיחה..." />
            </div>
          </div>
        )}

        {step === 4 && (() => {
          const plan = generatePlan();
          return (
            <div className="space-y-5">
              <div className="libi-card p-5">
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2"><Sparkles className="w-4 h-4 text-primary" /> פרופיל אישי</h3>
                <div className="bg-primary-soft/30 rounded-xl p-4 border border-primary/10">
                  <p className="text-sm text-foreground leading-relaxed">{personal.firstName} {personal.lastName}, בן/בת {personal.age}, מ{personal.city}. רמת סיעוד {personal.nursingLevel}. {desires.dream && `חולם/ת: ${desires.dream}.`} מתעניין/ת ב: {desires.preferences.slice(0, 4).join(", ")}.</p>
                </div>
              </div>
              <div className="libi-card p-5">
                <h3 className="text-base font-semibold text-foreground mb-3">שירותים מומלצים</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {plan.services.map((service, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-lg bg-success-soft/30 border border-success/10">
                      <div className="w-8 h-8 rounded-full bg-success/10 flex items-center justify-center"><Check className="w-4 h-4 text-success" /></div>
                      <span className="text-sm font-medium text-foreground">{service}</span>
                    </div>
                  ))}
                </div>
              </div>
              {health.riskFlags.length > 0 && (
                <div className="libi-card p-5">
                  <h3 className="text-base font-semibold text-foreground mb-3">דגלי סיכון</h3>
                  <div className="flex flex-wrap gap-2">
                    {health.riskFlags.map((flag) => <Chip key={flag} tone="warning"><AlertTriangle className="w-3 h-3 inline ml-1" />{flag}</Chip>)}
                  </div>
                </div>
              )}
              <div className="libi-card p-5">
                <h3 className="text-base font-semibold text-foreground mb-3 flex items-center gap-2"><Wallet className="w-4 h-4 text-primary" /> הקצאת סל</h3>
                <div className="text-3xl font-bold text-primary">{plan.walletTotal} יחידות</div>
                <p className="text-sm text-muted-foreground mt-1">לחודש</p>
                <ProgressBar value={plan.walletTotal} max={160} tone="primary" className="mt-3" />
              </div>
              <div className="flex justify-center pt-2">
                <button onClick={() => toast.success("התוכנית האישית אושרה בהצלחה")} className="px-8 py-3 bg-primary text-primary-foreground rounded-xl text-base font-semibold shadow-md hover:shadow-lg transition-all hover:scale-[1.02] active:scale-[0.98]">
                  <Check className="w-5 h-5 inline ml-2" /> אשר תוכנית
                </button>
              </div>
            </div>
          );
        })()}
      </div>

      {/* Navigation */}
      {step < 4 && (
        <div className="flex items-center justify-between pt-2">
          <button onClick={prev} disabled={step === 0} className={cn("flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium transition-colors", step === 0 ? "text-muted-foreground cursor-not-allowed" : "text-foreground border border-border hover:bg-muted")}>
            <ChevronRight className="w-4 h-4" /> הקודם
          </button>
          <button onClick={next} className="flex items-center gap-2 px-5 py-2.5 rounded-lg text-sm font-medium bg-primary text-primary-foreground hover:bg-primary/90 transition-colors shadow-sm">
            הבא <ChevronLeft className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}
