/**
 * Hackathon — דף פיץ' AWS GenAI
 * עיצוב נקי, מקצועי — כמו ההאצה
 */
import { useState } from "react";
import { Link } from "react-router-dom";
import { ExternalLink, Play, Clock, Users, MapPin, Brain, Mic, Database, Zap, BarChart3, Target, TrendingUp } from "lucide-react";
import { cn } from "@/lib/utils";

const AWS_SERVICES = [
  { name: "Amazon Bedrock", desc: "Claude — מנוע AI, צ'אט, המלצות, ניתוח", color: "#FF9900" },
  { name: "Amazon Transcribe", desc: "תמלול אינטייק קולי + זיהוי רגשות", color: "#FF9900" },
  { name: "Amazon Personalize", desc: "אלגוריתם המלצות מותאם אישית", color: "#FF9900" },
  { name: "AWS Lambda", desc: "אייג'נט שבועי + Nudge engine", color: "#FF9900" },
  { name: "Amazon S3", desc: "אחסון פרופילים, שירותים, מסמכים", color: "#FF9900" },
  { name: "Amazon DynamoDB", desc: "ניהול פרופילי אזרחים real-time", color: "#FF9900" },
];

const DEMO_STEPS = [
  { time: "0:00", route: "/", title: "דף הבית", desc: "בחירת ממשק" },
  { time: "0:30", route: "/citizen", title: "ממשק אזרח", desc: "סל שירותים מותאם AI" },
  { time: "1:00", route: "/coordinator", title: "דשבורד מלווה", desc: "Agentic Flow + AI chat" },
  { time: "2:00", route: "/coordinator/agents", title: "אייג'נטים", desc: "5 agents + Super Agent" },
  { time: "2:30", route: "/coordinator/intake", title: "אינטייק AI", desc: "תמלול + ניתוח אוטומטי" },
  { time: "3:00", route: "/coordinator/catalog", title: "קטלוג סל", desc: "5 תחומים, 102 שירותים" },
  { time: "3:30", route: "/executive", title: "ניהולי", desc: "KPIs + חיסכון ₪2B" },
];

export default function Hackathon() {
  const [timer, setTimer] = useState(240);
  const timerMin = Math.floor(timer / 60);
  const timerSec = timer % 60;

  const startTimer = () => {
    setTimer(240);
    const iv = setInterval(() => {
      setTimer((t) => { if (t <= 1) { clearInterval(iv); return 0; } return t - 1; });
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* Header */}
      <div className="bg-[#1B3A5C] text-white">
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FF9900]/20 border border-[#FF9900]/40 mb-4">
            <span className="text-xs font-bold text-[#FF9900]">AWS GenAI Hackathon · 23/06/26</span>
          </div>
          <h1 className="text-3xl font-bold">סל אישי — להזדקנות מיטבית</h1>
          <p className="text-sm text-white/60 mt-2 max-w-lg mx-auto">
            מניעת הידרדרות לאזרחים ותיקים באמצעות AI — מ-30% מימוש זכויות ל-75%
          </p>

          {/* Timer */}
          <div className="mt-6 flex items-center justify-center gap-4">
            <div className="text-4xl font-bold tabular-nums" style={{ color: timer > 120 ? "#4ade80" : timer > 60 ? "#fbbf24" : "#f87171" }}>
              {String(timerMin).padStart(2, "0")}:{String(timerSec).padStart(2, "0")}
            </div>
            <button onClick={startTimer} className="px-4 py-2 rounded-lg bg-white/10 border border-white/20 text-sm hover:bg-white/20 transition-colors flex items-center gap-2">
              <Play className="w-3.5 h-3.5" /> התחל פיץ'
            </button>
          </div>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { num: "220K", label: "זכאי סיעוד", sub: "בישראל" },
            { num: "₪20B", label: "תקציב שנתי", sub: "רפורמה" },
            { num: "30%", label: "מימוש היום", sub: "יעד: 75%" },
            { num: "₪2B", label: "חיסכון", sub: "20% דחיית הידרדרות" },
          ].map((s) => (
            <div key={s.num} className="bg-white border border-gray-100 rounded-xl p-4 text-center">
              <div className="text-2xl font-bold text-[#1B3A5C]">{s.num}</div>
              <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
              <div className="text-[10px] text-gray-400">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Problem + Solution */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <Target className="w-4 h-4 text-red-500" /> הבעיה
            </h2>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" /> 220K זכאים — רק 30% מממשים זכויות</li>
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" /> מידע מפוזר ב-100+ גורמים, בירוקרטיה</li>
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" /> חסמי שפה ותרבות (ערבי, חרדי, עולים)</li>
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-red-400 mt-1.5 shrink-0" /> העדר ליווי אישי וניטור מונע</li>
            </ul>
          </div>

          <div className="bg-white border border-gray-100 rounded-xl p-5">
            <h2 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-emerald-500" /> הפתרון
            </h2>
            <ul className="space-y-2 text-xs text-gray-600">
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" /> AI matching — 5 שכבות × 102 שירותים × פרופיל אישי</li>
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" /> 5 אייג'נטים אוטונומיים (Discovery, Matching, Monitor, Nudge, Super)</li>
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" /> 5 ממשקים: אזרח, מלווה, ניהולי, ספקים, קטלוג</li>
              <li className="flex items-start gap-2"><span className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-1.5 shrink-0" /> פיילוט חי: 286 אזרחים, 5 שכונות, ירושלים</li>
            </ul>
          </div>
        </div>

        {/* AWS Services */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-[#FF9900]" /> Powered by AWS
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {AWS_SERVICES.map((aws) => (
              <div key={aws.name} className="p-3 rounded-lg border border-[#FF9900]/20 bg-[#FF9900]/5">
                <p className="text-xs font-bold text-[#FF9900]">{aws.name}</p>
                <p className="text-[10px] text-gray-500 mt-0.5">{aws.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Demo Flow */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Play className="w-4 h-4 text-[#1B3A5C]" /> מסלול דמו — 4 דקות
          </h2>
          <div className="space-y-2">
            {DEMO_STEPS.map((step) => (
              <div key={step.time} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-[#1B3A5C]/20 transition-colors">
                <span className="text-xs font-bold text-[#1B3A5C] w-10 shrink-0 tabular-nums">{step.time}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.desc}</p>
                </div>
                <Link to={step.route} className="flex items-center gap-1 text-[10px] text-[#1B3A5C] hover:underline shrink-0">
                  <ExternalLink className="w-3 h-3" /> פתח
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Pilot results */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <BarChart3 className="w-4 h-4 text-[#1B3A5C]" /> תוצאות פיילוט
          </h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { num: "286", label: "משתתפים", sub: "פסגת זאב" },
              { num: "102", label: "שירותים ממופים", sub: "5 שכונות" },
              { num: "64%", label: "התמדה", sub: "+5% מחודש קודם" },
              { num: "5", label: "אייג'נטים", sub: "פעילים 24/7" },
            ].map((s) => (
              <div key={s.num} className="text-center p-3 bg-[#1B3A5C]/5 rounded-lg border border-[#1B3A5C]/10">
                <div className="text-xl font-bold text-[#1B3A5C]">{s.num}</div>
                <div className="text-xs text-gray-600 mt-0.5">{s.label}</div>
                <div className="text-[10px] text-gray-400">{s.sub}</div>
              </div>
            ))}
          </div>
        </div>

        {/* Impact */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { num: "30% → 75%", label: "מימוש זכויות", sub: "x2.5 שיפור" },
            { num: "-20%", label: "דחיית הידרדרות", sub: "~3 חודשים" },
            { num: "₪2B", label: "חיסכון שנתי", sub: "בהרחבה לאומית" },
          ].map((s) => (
            <div key={s.num} className="bg-[#1B3A5C] text-white rounded-xl p-4 text-center">
              <div className="text-xl font-bold">{s.num}</div>
              <div className="text-xs text-white/70 mt-0.5">{s.label}</div>
              <div className="text-[10px] text-white/40">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Live link */}
        <div className="text-center pt-4 space-y-3">
          <a
            href="https://avi1840.github.io/sal-ishi-v2/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-6 py-3 bg-[#1B3A5C] text-white rounded-xl text-sm font-semibold hover:bg-[#15304d] transition-colors"
          >
            <ExternalLink className="w-4 h-4" /> דמו חי
          </a>
          <p className="text-[10px] text-gray-400">
            Powered by Amazon Bedrock · Transcribe · Personalize · Lambda · S3 · DynamoDB
          </p>
        </div>
      </main>
    </div>
  );
}
