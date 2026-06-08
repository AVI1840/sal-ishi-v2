/**
 * Hackathon — דף פיץ' AWS GenAI
 * פיץ' מובנה: צורך → פתרון → ערך → פריצה → ישימות
 * + כפתור "התחל הדגמה המודרכת" שמפעיל את ה-GuidedDemo overlay
 */
import { Link } from "react-router-dom";
import { ExternalLink, Play, Mic, Brain, Target, Zap, Users, Building2, TrendingUp, AlertCircle, CheckCircle, BarChart3, Layers } from "lucide-react";
import { startGuidedDemo, DEMO_STEPS } from "@/components/GuidedDemo";
import { useNavigate } from "react-router-dom";

const AWS_SERVICES = [
  { name: "Amazon Bedrock", desc: "Claude Sonnet — ניתוח, צ'אט, המלצות, אינטייק" },
  { name: "Amazon Transcribe", desc: "תמלול אינטייק קולי בזמן אמת" },
  { name: "Amazon Personalize", desc: "אלגוריתם המלצות מותאם אישית" },
  { name: "AWS Lambda", desc: "אייג'נטים שבועיים + Nudge engine" },
  { name: "Amazon S3", desc: "אחסון פרופילים, שירותים, מסמכים" },
  { name: "Amazon DynamoDB", desc: "פרופילי אזרחים real-time" },
];

const PITCH_CARDS = [
  {
    num: "01",
    label: "הצורך",
    icon: AlertCircle,
    color: "border-red-200 bg-red-50",
    iconColor: "text-red-500",
    points: [
      "220K זכאי סיעוד — רק 30% מממשים זכויות",
      "מידע מפוזר ב-100+ גורמים, בירוקרטיה",
      "חסמי שפה ותרבות (ערבי, חרדי, עולים)",
      "העדר ליווי אישי וניטור מונע",
    ],
  },
  {
    num: "02",
    label: "הפתרון",
    icon: Brain,
    color: "border-blue-200 bg-blue-50",
    iconColor: "text-blue-600",
    points: [
      "AI matching — 5 שכבות × 102 שירותים × פרופיל אישי",
      "5 אייג'נטים אוטונומיים (Discovery, Matching, Monitor, Nudge, Super)",
      "אינטייק קולי — Transcribe + Claude בזמן אמת",
      "Explainability: המשתמש רואה למה כל שירות הומלץ",
    ],
  },
  {
    num: "03",
    label: "הערך",
    icon: TrendingUp,
    color: "border-emerald-200 bg-emerald-50",
    iconColor: "text-emerald-600",
    points: [
      "30% → 75% מימוש זכויות (×2.5 שיפור)",
      "דחיית הידרדרות ב-20% ≈ 3 חודשים נוספים",
      "חיסכון ₪2B שנתי בהרחבה לאומית",
      "SDI מ-0 ל-17+ שירותי מניעה פעילים",
    ],
  },
  {
    num: "04",
    label: "פריצת הדרך",
    icon: Layers,
    color: "border-purple-200 bg-purple-50",
    iconColor: "text-purple-600",
    points: [
      "אלגוריתם ראשון מסוגו — אישי, מוסבר, מדיד",
      "Agentic Loop מלא: תמלול → ניתוח → התאמה → CRM → Nudge",
      "מודל 1:75 — מלווה ל-75 אזרחים בליווי AI",
      "ממשקים לכל שחקן: אזרח, מלווה, ניהולי, ספק",
    ],
  },
  {
    num: "05",
    label: "ישימות",
    icon: CheckCircle,
    color: "border-amber-200 bg-amber-50",
    iconColor: "text-amber-600",
    points: [
      "פיילוט חי: 286 אזרחים, פסגת זאב, ירושלים",
      "מבוסס החלטות ממשלה 127 ו-150",
      "3 מלוות חברתיות, 18 ספקים, 102 שירותים ממופים",
      "מוכן להרחבה — 5 ערים + קול קורא ממשלתי",
    ],
  },
];

export default function Hackathon() {
  const navigate = useNavigate();

  const handleStartDemo = () => {
    startGuidedDemo();
    navigate(DEMO_STEPS[0].route);
  };

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">

      {/* Header */}
      <div className="bg-[#1B3A5C] text-white">
        <div className="max-w-5xl mx-auto px-6 py-10 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-[#FF9900]/20 border border-[#FF9900]/40 mb-4">
            <span className="text-xs font-bold text-[#FF9900]">AWS GenAI Hackathon · 23/06/2026</span>
          </div>
          <h1 className="text-3xl font-bold">סל אישי — להזדקנות מיטבית</h1>
          <p className="text-base text-white/70 mt-2 max-w-xl mx-auto">
            מניעת הידרדרות לאזרחים ותיקים באמצעות Agentic AI — מ-30% מימוש זכויות ל-75%
          </p>

          {/* KPIs */}
          <div className="mt-8 grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { num: "220K", label: "זכאי סיעוד", sub: "בישראל" },
              { num: "₪20B", label: "תקציב שנתי", sub: "רפורמה" },
              { num: "30%", label: "מימוש היום", sub: "יעד: 75%" },
              { num: "₪2B", label: "חיסכון שנתי", sub: "20% דחיית הידרדרות" },
            ].map((s) => (
              <div key={s.num} className="bg-white/10 rounded-xl p-4 text-center border border-white/10">
                <div className="text-2xl font-bold text-white">{s.num}</div>
                <div className="text-xs text-white/70 mt-0.5">{s.label}</div>
                <div className="text-[10px] text-white/40">{s.sub}</div>
              </div>
            ))}
          </div>

          {/* CTA */}
          <button
            onClick={handleStartDemo}
            className="mt-8 inline-flex items-center gap-2.5 px-8 py-3.5 rounded-xl bg-[#FF9900] text-[#1B3A5C] font-bold text-sm hover:bg-[#e8890a] transition-colors shadow-lg"
          >
            <Play className="w-4 h-4 fill-current" /> התחל הדגמה מודרכת — 4 דקות
          </button>
          <p className="mt-2 text-[11px] text-white/30">8 שלבים · מלווה בזמן אמת · על המוצר האמיתי</p>
        </div>
      </div>

      <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

        {/* Pitch narrative — 5 cards */}
        <div>
          <h2 className="text-base font-bold text-gray-900 mb-4">הסיפור</h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {PITCH_CARDS.map((card) => {
              const Icon = card.icon;
              return (
                <div key={card.num} className={`rounded-xl border p-4 ${card.color}`}>
                  <div className="flex items-center gap-2 mb-3">
                    <span className="text-[10px] font-bold text-gray-400">{card.num}</span>
                    <Icon className={`w-4 h-4 ${card.iconColor}`} />
                    <span className="text-xs font-bold text-gray-900">{card.label}</span>
                  </div>
                  <ul className="space-y-1.5">
                    {card.points.map((p, i) => (
                      <li key={i} className="flex items-start gap-1.5">
                        <span className="w-1 h-1 rounded-full bg-gray-400 mt-1.5 shrink-0" />
                        <span className="text-[11px] text-gray-700 leading-relaxed">{p}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
        </div>

        {/* AWS Stack */}
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

        {/* 5 Agents */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-[#1B3A5C]" /> 5 אייג'נטים אוטונומיים
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-5 gap-3">
            {[
              { icon: Target, name: "Service Discovery", freq: "שבועי", detail: "25+ מקורות" },
              { icon: Brain, name: "Matching Engine", freq: "שבועי + אינטייק", detail: "286×102 ציונים" },
              { icon: AlertCircle, name: "Deterioration Monitor", freq: "יומי 07:30", detail: "RDI/SDI" },
              { icon: Mic, name: "Nudge Engine", freq: "יומי + event", detail: "WhatsApp" },
              { icon: Zap, name: "Super Agent", freq: "24/7", detail: "ניהול + תזמון" },
            ].map((a, i) => {
              const Icon = a.icon;
              return (
                <div key={i} className="text-center p-3 bg-[#1B3A5C]/[0.03] rounded-lg border border-[#1B3A5C]/10">
                  <div className="w-8 h-8 rounded-lg bg-[#1B3A5C]/10 flex items-center justify-center mx-auto mb-2">
                    <Icon className="w-4 h-4 text-[#1B3A5C]" />
                  </div>
                  <p className="text-[10px] font-bold text-gray-900 leading-tight">{a.name}</p>
                  <p className="text-[9px] text-gray-500 mt-0.5">{a.freq}</p>
                  <p className="text-[9px] text-[#1B3A5C] font-medium mt-0.5">{a.detail}</p>
                </div>
              );
            })}
          </div>
        </div>

        {/* Pilot results */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { num: "286", label: "משתתפים", sub: "פסגת זאב, ירושלים" },
            { num: "102", label: "שירותים ממופים", sub: "5 תחומי ליבה" },
            { num: "64%", label: "התמדה ממוצעת", sub: "+5% מחודש קודם" },
            { num: "5", label: "אייג'נטים AI", sub: "פעילים 24/7" },
          ].map((s) => (
            <div key={s.num} className="bg-[#1B3A5C] text-white rounded-xl p-4 text-center">
              <div className="text-2xl font-bold">{s.num}</div>
              <div className="text-xs text-white/70 mt-0.5">{s.label}</div>
              <div className="text-[10px] text-white/40">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Demo flow steps */}
        <div className="bg-white border border-gray-100 rounded-xl p-5">
          <h2 className="text-sm font-bold text-gray-900 mb-4 flex items-center gap-2">
            <Play className="w-4 h-4 text-[#1B3A5C]" /> מסלול הדגמה מודרכת — 4 דקות
          </h2>
          <div className="space-y-2">
            {DEMO_STEPS.map((step, i) => (
              <div key={i} className="flex items-center gap-4 p-3 rounded-lg border border-gray-100 hover:border-[#1B3A5C]/20 transition-colors">
                <span className="text-xs font-bold text-[#1B3A5C] w-10 shrink-0 tabular-nums">{step.time}</span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{step.title}</p>
                  <p className="text-xs text-gray-500">{step.callout}</p>
                </div>
                <Link
                  to={step.route}
                  className="flex items-center gap-1 text-[10px] text-[#1B3A5C] hover:underline shrink-0"
                >
                  <ExternalLink className="w-3 h-3" /> פתח
                </Link>
              </div>
            ))}
          </div>
        </div>

        {/* Impact row */}
        <div className="grid grid-cols-3 gap-3">
          {[
            { num: "30% → 75%", label: "מימוש זכויות", sub: "×2.5 שיפור" },
            { num: "-20%", label: "דחיית הידרדרות", sub: "~3 חודשים נוספים" },
            { num: "₪2B", label: "חיסכון שנתי", sub: "בהרחבה לאומית" },
          ].map((s) => (
            <div key={s.num} className="bg-[#1B3A5C] text-white rounded-xl p-5 text-center">
              <div className="text-xl font-bold">{s.num}</div>
              <div className="text-xs text-white/70 mt-0.5">{s.label}</div>
              <div className="text-[10px] text-white/40">{s.sub}</div>
            </div>
          ))}
        </div>

        {/* Live links + CTA */}
        <div className="text-center space-y-3 pt-4">
          <button
            onClick={handleStartDemo}
            className="inline-flex items-center gap-2 px-8 py-3.5 bg-[#1B3A5C] text-white rounded-xl text-sm font-bold hover:bg-[#15304d] transition-colors shadow-md"
          >
            <Play className="w-4 h-4 fill-current" /> התחל הדגמה מודרכת
          </button>
          <div className="flex items-center justify-center gap-4">
            <a
              href="https://avi1840.github.io/sal-ishi-v2/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#1B3A5C] hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" /> דמו חי
            </a>
            <a
              href="https://avi1840.github.io/SAL-ISHI-SIUD/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-xs text-[#1B3A5C] hover:underline"
            >
              <ExternalLink className="w-3.5 h-3.5" /> דשבורד מלווה
            </a>
          </div>
          <p className="text-[10px] text-gray-400">
            Powered by Amazon Bedrock · Transcribe · Personalize · Lambda · S3 · DynamoDB
          </p>
        </div>
      </main>
    </div>
  );
}
