import { useState } from "react";
import { Link } from "react-router-dom";
import { Users, Phone, Building2, Heart, Wallet } from "lucide-react";

const MODULES = [
  {
    to: "/citizen",
    title: "אפליקציית אזרח",
    subtitle: "חוויה מובייל לאזרח הוותיק",
    description: "ארנק שירותים, הזמנות, שיחה עם מלווה",
    icon: Phone,
    color: "from-pink-500 to-rose-600",
    persona: "שרה, בת 72, ירושלים",
  },
  {
    to: "/coordinator",
    title: "דשבורד מתאמת",
    subtitle: "לוח בקרה למתאמת חברתית",
    description: "ניהול 68 אזרחים, התראות, המלצות AI",
    icon: Heart,
    color: "from-[#1B3A5C] to-[#2d5a8c]",
    persona: "רונית, מתאמת חברתית",
  },
  {
    to: "/executive",
    title: "דשבורד ניהולי",
    subtitle: "מבט על לסמנכ״ל בכיר",
    description: "KPIs, מפת פיילוטים, בקרה ועצירה",
    icon: Building2,
    color: "from-indigo-600 to-purple-700",
    persona: "מנהל בכיר, ביטוח לאומי",
  },
  {
    to: "/providers",
    title: "פורטל ספקים",
    subtitle: "ניהול שירותים והזמנות",
    description: "הזמנות, שירותים, תשלומים",
    icon: Users,
    color: "from-emerald-500 to-teal-600",
    persona: "מתנ״ס פסגת זאב",
  },
];

export default function DemoHome() {
  const [clickCount, setClickCount] = useState(0);
  const [showHidden, setShowHidden] = useState(false);

  const handleLogoClick = () => {
    const newCount = clickCount + 1;
    setClickCount(newCount);
    if (newCount >= 3) {
      setShowHidden(true);
    }
    // Reset after 2 seconds if not completed
    setTimeout(() => { if (newCount < 3) setClickCount(0); }, 2000);
  };

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Hero */}
      <div className="bg-gradient-to-l from-[#1B3A5C] to-[#2d5a8c] text-white">
        <div className="max-w-5xl mx-auto px-6 py-16 text-center">
          <div className="flex items-center justify-center gap-3 mb-6">
            <div
              className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur flex items-center justify-center cursor-pointer select-none"
              onClick={handleLogoClick}
              title=""
            >
              <Wallet className="w-7 h-7" />
            </div>
          </div>
          <h1 className="text-4xl font-bold mb-3">סל אישי</h1>
          <p className="text-lg text-white/80 max-w-2xl mx-auto">
            פלטפורמת שירותים ממשלתית לליווי אזרחים ותיקים — פיילוט ירושלים
          </p>
          <p className="text-sm text-white/60 mt-3">
            ביטוח לאומי × משרד האוצר • 736 אזרחים • 5 מתאמות • 24 ספקים
          </p>
        </div>
      </div>

      {/* Module Cards */}
      <div className="max-w-5xl mx-auto px-6 -mt-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            return (
              <Link
                key={mod.to}
                to={mod.to}
                className="group bg-card rounded-2xl border border-border/70 p-6 shadow-sm hover:shadow-md hover:-translate-y-1 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${mod.color} text-white flex items-center justify-center shrink-0 shadow-sm`}>
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-foreground group-hover:text-primary transition-colors">
                      {mod.title}
                    </h3>
                    <p className="text-sm text-muted-foreground mt-0.5">{mod.subtitle}</p>
                    <p className="text-xs text-muted-foreground mt-2">{mod.description}</p>
                    <div className="mt-3 flex items-center gap-2">
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center text-[10px] font-semibold text-accent-foreground">
                        {mod.persona[0]}
                      </div>
                      <span className="text-xs text-muted-foreground">{mod.persona}</span>
                    </div>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Footer */}
        <div className="text-center py-12">
          <p className="text-sm text-muted-foreground">
            דמו אינטראקטיבי — כל הנתונים סינתטיים לצורך הדגמה
          </p>
        </div>

        {/* Hidden Panel - appears after 3 clicks on logo */}
        {showHidden && (
          <div className="mb-8 p-5 rounded-2xl border border-dashed border-primary/30 bg-primary/5 animate-in fade-in slide-in-from-bottom-4 duration-500">
            <div className="flex items-center justify-between mb-3">
              <button onClick={() => setShowHidden(false)} className="text-xs text-muted-foreground hover:text-foreground">✕ סגור</button>
              <h3 className="text-sm font-bold text-primary">🧠 מערכות AI נוספות</h3>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <a
                href="https://avi1840.github.io/SAL-ISHI-SIUD/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-pink-100 text-pink-600 flex items-center justify-center text-lg">💗</div>
                <div>
                  <div className="text-sm font-semibold">דשבורד מלווה סיעוד</div>
                  <div className="text-xs text-muted-foreground">SDI/RDI • 75 מטופלים • משימות יומיות</div>
                </div>
              </a>
              <a
                href="https://avi1840.github.io/sal-ishi-v2/#/coordinator"
                className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border hover:border-primary/50 hover:shadow-sm transition-all"
              >
                <div className="w-10 h-10 rounded-lg bg-amber-100 text-amber-600 flex items-center justify-center text-lg">✨</div>
                <div>
                  <div className="text-sm font-semibold">מתאמת + AI מתקדם</div>
                  <div className="text-xs text-muted-foreground">5 שכבות התאמה • מוטיבציות • VIA</div>
                </div>
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
