/**
 * Hackathon — דף פיץ' לאקתון AWS GenAI
 * 4 פרקים: הבעיה, הפתרון, הדמו, האימפקט
 */
import { useState } from "react";
import { AlertTriangle, Sparkles, BarChart2, Zap, Brain, Mic, Database, Cloud, ChevronDown, ChevronUp, ExternalLink } from "lucide-react";
import { catalogStats } from "@/data/realServices";

const SECTIONS = [
  { id: "problem", label: "🔴 הבעיה", color: "#ef4444" },
  { id: "solution", label: "🟢 הפתרון", color: "#22c55e" },
  { id: "demo", label: "🟦 הדמו", color: "#3b82f6" },
  { id: "impact", label: "🟡 האימפקט", color: "#f59e0b" },
];

const AWS_SERVICES = [
  { name: "Amazon Bedrock", desc: "אנתרופיק Claude — מנוע ה-AI, צ'אט לימור, המלצות", icon: "🧠" },
  { name: "Amazon Transcribe", desc: "תמלול אוטומטי של אינטייק קולי עם רגשות", icon: "🎙️" },
  { name: "Amazon Personalize", desc: "אלגוריתם המלצות שירותים מותאם אישית", icon: "⚡" },
  { name: "Amazon S3", desc: "אחסון פרופילים, שירותים, מסמכים", icon: "🗄️" },
  { name: "AWS Lambda", desc: "Serverless — אגנט שבועי + Nudge engine", icon: "λ" },
  { name: "Amazon DynamoDB", desc: "ניהול פרופילי אזרחים בזמן אמת", icon: "⚡" },
];

const STATS = [
  { num: "220,000", label: "זכאי גמלת סיעוד", sub: "בישראל היום" },
  { num: "₪20B", label: "תקציב סיעוד שנתי", sub: "רפורמת ממשלה 2025" },
  { num: "30%", label: "מימוש זכויות בלבד", sub: "← יעד 75%" },
  { num: "₪2B", label: "חיסכון פוטנציאלי", sub: "20% דחיית הידרדרות" },
];

const PILOT_STATS = [
  { num: "286", label: "משתתפי פיילוט", sub: "פסגת זאב, ירושלים" },
  { num: "102", label: "שירותים ממופים", sub: `${catalogStats.free} חינם, ${catalogStats.subsidized} מסובסד` },
  { num: "5", label: "שכונות מכוסות", sub: "6 מגזרים שונים" },
  { num: "64%", label: "התמדה ממוצעת", sub: "+5% מהחודש שעבר" },
];

export default function Hackathon() {
  const [openSection, setOpenSection] = useState<string>("problem");
  const [timer, setTimer] = useState(240); // 4 minutes in seconds

  const toggleSection = (id: string) => setOpenSection(openSection === id ? "" : id);

  const startTimer = () => {
    setTimer(240);
    const interval = setInterval(() => {
      setTimer((t) => {
        if (t <= 1) { clearInterval(interval); return 0; }
        return t - 1;
      });
    }, 1000);
  };

  const timerMinutes = Math.floor(timer / 60);
  const timerSeconds = timer % 60;
  const timerColor = timer > 120 ? "#22c55e" : timer > 60 ? "#f59e0b" : "#ef4444";

  return (
    <div className="min-h-screen bg-[#0a0f1e] text-white" dir="rtl">

      {/* ── Hero ── */}
      <div className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-900/30 via-purple-900/20 to-transparent" />
        <div className="relative px-8 py-16 max-w-5xl mx-auto text-center">

          {/* AWS Badge */}
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#FF9900]/20 border border-[#FF9900]/40 mb-6">
            <Cloud className="w-4 h-4 text-[#FF9900]" />
            <span className="text-sm font-bold text-[#FF9900]">AWS GenAI Hackathon — 23/06/26 ת"א</span>
          </div>

          <h1 className="text-5xl font-black mb-4 leading-tight">
            סל אישי{" "}
            <span className="text-transparent bg-clip-text bg-gradient-to-l from-blue-400 to-purple-400">
              AI
            </span>
          </h1>
          <p className="text-xl text-gray-300 max-w-2xl mx-auto mb-8">
            מניעת הידרדרות לאזרחים ותיקים — מ-30% מימוש זכויות ל-75%
            <br />באמצעות Amazon Bedrock
          </p>

          {/* Timer */}
          <div className="inline-flex flex-col items-center gap-2 mb-8">
            <div className="text-6xl font-black tabular-nums" style={{ color: timerColor }}>
              {String(timerMinutes).padStart(2, "0")}:{String(timerSeconds).padStart(2, "0")}
            </div>
            <button
              onClick={startTimer}
              className="px-6 py-2 rounded-full bg-white/10 border border-white/20 text-sm font-medium hover:bg-white/20 transition-colors"
            >
              ▶ התחל פיץ' 4 דקות
            </button>
          </div>

          {/* Live Link */}
          <a
            href="https://avi1840.github.io/sal-ishi-v2/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-500 rounded-xl text-sm font-bold transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            דמו חי — avi1840.github.io/sal-ishi-v2
          </a>
        </div>
      </div>

      <div className="px-6 pb-16 max-w-5xl mx-auto space-y-4">

        {/* ── Stats row ── */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {STATS.map((s) => (
            <div key={s.num} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
              <div className="text-2xl font-black text-white">{s.num}</div>
              <div className="text-xs font-semibold text-gray-300 mt-1">{s.label}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Accordion sections ── */}
        {SECTIONS.map((section) => (
          <div key={section.id} className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <button
              onClick={() => toggleSection(section.id)}
              className="w-full flex items-center justify-between px-6 py-4 hover:bg-white/5 transition-colors"
            >
              <h2 className="text-lg font-bold" style={{ color: section.color }}>{section.label}</h2>
              {openSection === section.id
                ? <ChevronUp className="w-5 h-5 text-gray-400" />
                : <ChevronDown className="w-5 h-5 text-gray-400" />}
            </button>

            {openSection === section.id && (
              <div className="px-6 pb-6 space-y-4">

                {section.id === "problem" && (
                  <>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      220,000 ישראלים זכאים לגמלת סיעוד — אך <strong className="text-white">רק 30% מממשים את זכויותיהם</strong>.
                      הסיבות: מידע מפוזר ב-100+ גורמים, בירוקרטיה מסורבלת, חסמי שפה ותרבות, והעדר ליווי אישי.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      {[
                        { icon: "🏥", title: "עלות כשל", desc: "₪20 מיליארד תקציב שנתי — 70% לא מנוצל" },
                        { icon: "👴", title: "הידרדרות מהירה", desc: "ללא מניעה: הידרדרות ב-3-6 חודשים בממוצע" },
                        { icon: "🌍", title: "פערי מגזר", desc: "ערבי, חרדי, עולים — פחות מ-20% מימוש" },
                      ].map((card) => (
                        <div key={card.title} className="bg-red-950/30 border border-red-900/40 rounded-xl p-4">
                          <div className="text-2xl mb-2">{card.icon}</div>
                          <div className="text-sm font-bold text-red-300">{card.title}</div>
                          <div className="text-xs text-gray-400 mt-1">{card.desc}</div>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {section.id === "solution" && (
                  <>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      <strong className="text-white">סל אישי AI</strong> — מערכת GenAI שמזהה, ממפה ומתאימה שירותים לכל אזרח ותיק
                      לפי פרופיל אישי, שכונה, שפה, ניידות ומוטיבציות.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {[
                        { icon: "🧠", title: "AI Matching Engine", desc: "אלגוריתם 5 שכבות: תפקודי, רגשי, חברתי, נגישות, דחיפות" },
                        { icon: "🤖", title: "Agent שבועי", desc: "מנטר שינויים, מזהה סיכונים, שולח Nudges מותאמים" },
                        { icon: "📍", title: "102 שירותים ממופים", desc: "5 שכונות, 6 מגזרים, עברית/ערבית/רוסית/יידיש" },
                        { icon: "📱", title: "5 ממשקים", desc: "אזרח (מובייל), מתאמת, ניהולי, ספקים, לאומי" },
                      ].map((card) => (
                        <div key={card.title} className="bg-green-950/30 border border-green-900/40 rounded-xl p-4">
                          <div className="text-2xl mb-2">{card.icon}</div>
                          <div className="text-sm font-bold text-green-300">{card.title}</div>
                          <div className="text-xs text-gray-400 mt-1">{card.desc}</div>
                        </div>
                      ))}
                    </div>

                    {/* AWS Services */}
                    <div className="mt-2">
                      <h4 className="text-sm font-bold text-[#FF9900] mb-3 flex items-center gap-2">
                        <Cloud className="w-4 h-4" /> Powered by AWS
                      </h4>
                      <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                        {AWS_SERVICES.map((aws) => (
                          <div key={aws.name} className="bg-[#FF9900]/10 border border-[#FF9900]/20 rounded-xl p-3">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg">{aws.icon}</span>
                              <span className="text-xs font-bold text-[#FF9900]">{aws.name}</span>
                            </div>
                            <p className="text-[10px] text-gray-400">{aws.desc}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  </>
                )}

                {section.id === "demo" && (
                  <>
                    <p className="text-gray-300 text-sm">
                      סיור מהיר ב-5 ממשקים — כל אחד 30 שניות:
                    </p>
                    <div className="space-y-2">
                      {[
                        { time: "0:00", route: "/#/", title: "דף הבית — בחירת תפקיד", desc: "5 ממשקים שונים, הסבר מהיר" },
                        { time: "0:30", route: "/#/citizen", title: "ממשק אזרח", desc: "שרה, 78, פסגת זאב — סל מותאם AI, 102 שירותים, דירוג" },
                        { time: "1:00", route: "/#/coordinator", title: "דשבורד מתאמת", desc: "Agentic Flow, מיפוי שירותים, אינטייק AI עם תמלול" },
                        { time: "2:00", route: "/#/executive", title: "ממשק ניהולי", desc: "KPIs, 286 משתתפים, ₪2B חיסכון" },
                        { time: "2:30", route: "/#/national", title: "ממשק לאומי", desc: "ניתוח מדיניות + אלגוריתם המלצות" },
                        { time: "3:00", route: "/#/coordinator/services-map", title: "מיפוי 102 שירותים", desc: "סינון לפי שכונה, עלות, שפה" },
                      ].map((step) => (
                        <div key={step.time} className="flex items-center gap-4 bg-blue-950/30 border border-blue-900/30 rounded-xl p-3">
                          <div className="shrink-0 w-12 text-center">
                            <span className="text-xs font-black text-blue-400">{step.time}</span>
                          </div>
                          <div className="flex-1">
                            <div className="text-sm font-bold text-white">{step.title}</div>
                            <div className="text-xs text-gray-400">{step.desc}</div>
                          </div>
                          <a
                            href={step.route}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="shrink-0 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 rounded-lg text-xs font-medium transition-colors flex items-center gap-1"
                          >
                            <ExternalLink className="w-3 h-3" /> פתח
                          </a>
                        </div>
                      ))}
                    </div>
                  </>
                )}

                {section.id === "impact" && (
                  <>
                    <p className="text-gray-300 text-sm leading-relaxed">
                      פיילוט 286 אזרחים בפסגת זאב — תוצאות ראשונות:
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      {PILOT_STATS.map((s) => (
                        <div key={s.num} className="bg-yellow-950/30 border border-yellow-900/40 rounded-xl p-4 text-center">
                          <div className="text-3xl font-black text-yellow-300">{s.num}</div>
                          <div className="text-xs font-semibold text-gray-300 mt-1">{s.label}</div>
                          <div className="text-[10px] text-gray-500 mt-0.5">{s.sub}</div>
                        </div>
                      ))}
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mt-2">
                      {[
                        { icon: "📈", title: "30% → 75%", desc: "מימוש זכויות — x2.5" },
                        { icon: "🏥", title: "-20%", desc: "דחיית הידרדרות (~3 חודשים)" },
                        { icon: "💰", title: "₪2 מיליארד", desc: "חיסכון ממשלתי שנתי בהרחבה לאומית" },
                      ].map((card) => (
                        <div key={card.title} className="bg-white/5 border border-white/10 rounded-xl p-4 text-center">
                          <div className="text-3xl mb-2">{card.icon}</div>
                          <div className="text-xl font-black text-white">{card.title}</div>
                          <div className="text-xs text-gray-400 mt-1">{card.desc}</div>
                        </div>
                      ))}
                    </div>

                    <div className="mt-4 p-4 rounded-xl bg-gradient-to-l from-[#FF9900]/20 to-transparent border border-[#FF9900]/30">
                      <p className="text-sm text-center font-bold text-[#FF9900]">
                        🎯 מטרה: AWS GenAI Hackathon 2026 → הרחבה לאומית ל-220,000 אזרחים
                      </p>
                    </div>
                  </>
                )}

              </div>
            )}
          </div>
        ))}

        {/* ── Footer ── */}
        <div className="text-center pt-4 space-y-2">
          <p className="text-xs text-gray-500">בנוי על ידי אביעד · AI-assisted development עם Kiro + Claude</p>
          <div className="flex items-center justify-center gap-3 flex-wrap">
            <span className="text-[10px] px-2 py-1 rounded-full bg-[#FF9900]/20 text-[#FF9900] border border-[#FF9900]/30">Powered by Amazon Bedrock</span>
            <span className="text-[10px] px-2 py-1 rounded-full bg-blue-900/30 text-blue-300 border border-blue-800/30">AWS Transcribe</span>
            <span className="text-[10px] px-2 py-1 rounded-full bg-purple-900/30 text-purple-300 border border-purple-800/30">AWS Personalize</span>
          </div>
        </div>

      </div>
    </div>
  );
}
