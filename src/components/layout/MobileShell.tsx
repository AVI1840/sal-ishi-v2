import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { CITIZEN_CHAT_ENABLED } from "@/lib/edition";
import { Home, Star, MessageCircle, User, ImageOff, Image, Volume2, Square, Type } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVisualMode } from "@/hooks/use-visual-mode";
import { useReadAloud } from "@/pilot/speech";

const TABS = [
  { to: "/citizen", label: "בית", icon: Home, end: true },
  { to: "/citizen/services", label: "שירותים", icon: Star },
  ...(CITIZEN_CHAT_ENABLED ? [{ to: "/citizen/chat", label: "שיחה", icon: MessageCircle }] : []),
  { to: "/citizen/profile", label: "פרופיל", icon: User },
];

// "א+": מגדיל את כל הטקסט (Tailwind ב-rem), עד פי 1.5. נשמר במכשיר.
const SCALES = [100, 118, 137] as const;
const SCALE_KEY = "sal-ishi-text-scale";

function useTextScale() {
  const [scale, setScale] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(SCALE_KEY)) || 100;
    } catch {
      return 100;
    }
  });
  useEffect(() => {
    document.documentElement.style.fontSize = scale === 100 ? "" : `${scale}%`;
    try {
      localStorage.setItem(SCALE_KEY, String(scale));
    } catch {
      /* אחסון חסום */
    }
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [scale]);
  const next = () => setScale(SCALES[(SCALES.indexOf(scale as (typeof SCALES)[number]) + 1) % SCALES.length]);
  return { scale, next };
}

const toolClass =
  "flex items-center gap-1.5 px-3 min-h-[44px] min-w-[44px] rounded-full text-sm font-semibold shadow-md border bg-white border-[#1B3A5C]/20 text-[#1B3A5C] hover:bg-[#1B3A5C]/5";

export default function MobileShell() {
  const { pathname } = useLocation();
  const [mode, toggleMode] = useVisualMode();
  const isImages = mode === "images";
  const { speaking, read, stop, supported } = useReadAloud("he-IL");
  const { scale, next } = useTextScale();

  useEffect(() => stop(), [pathname, stop]);

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8fafc]">
      <a
        href="#main"
        onClick={(e) => {
          e.preventDefault();
          document.getElementById("main")?.focus();
        }}
        className="sr-only focus:not-sr-only focus:fixed focus:top-12 focus:right-3 focus:z-[70] focus:bg-white focus:text-[#1B3A5C] focus:px-4 focus:py-3 focus:rounded-lg focus:shadow-lg"
      >
        לדלג לתוכן
      </a>

      {/* Content */}
      <div className="pb-24">
        <Outlet />
      </div>

      {/* כלי נגישות: להקריא, א+, תמונות. בפינת הכותרת, בכל מסכי האזרח */}
      <div className="fixed top-12 left-3 z-40 flex items-center gap-2" role="toolbar" aria-label="כלי נגישות">
        {supported ? (
          <button type="button" className={toolClass} aria-pressed={speaking} onClick={speaking ? stop : read}>
            {speaking ? <Square className="w-4 h-4" aria-hidden="true" /> : <Volume2 className="w-4 h-4" aria-hidden="true" />}
            {speaking ? "לעצור" : "להקריא"}
          </button>
        ) : null}
        <button type="button" className={toolClass} onClick={next} aria-label={`גודל טקסט ${scale} אחוז. להגדלה`}>
          <Type className="w-4 h-4" aria-hidden="true" />
          <span aria-hidden="true">א+</span>
        </button>
        <button type="button" onClick={toggleMode} className={toolClass} aria-pressed={!isImages} aria-label={isImages ? "תצוגה בלי תמונות" : "תצוגה עם תמונות"}>
          {isImages ? <ImageOff className="w-4 h-4" aria-hidden="true" /> : <Image className="w-4 h-4" aria-hidden="true" />}
        </button>
      </div>

      {/* Bottom Navigation — always visible */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg" aria-label="ניווט ראשי">
        <div className="flex items-center justify-around h-20 max-w-2xl mx-auto px-4">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.end ? pathname === tab.to : pathname.startsWith(tab.to);
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end={tab.end}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 w-20 h-16 rounded-xl transition-all",
                  isActive
                    ? "bg-[#1B3A5C] text-white shadow-md"
                    : "text-gray-700 hover:text-gray-900"
                )}
                style={{ minHeight: 48, minWidth: 48 }}
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
                <span className="text-sm font-semibold">{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
