import { useEffect, useState } from "react";
import { Outlet, NavLink, useLocation } from "react-router-dom";
import { CITIZEN_CHAT_ENABLED } from "@/lib/edition";
import { Store, CalendarCheck, MessageCircle, User, HeartHandshake, ImageOff, Image, Volume2, Square, Contrast, WifiOff } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVisualMode } from "@/hooks/use-visual-mode";
import { useReadAloud } from "@/pilot/speech";
import { useOnline } from "@/pilot/components/Frame";
import { he } from "@/pilot/i18n/he";
import { CallbackCard } from "@/components/citizen/CallbackCard";

// ארבע לשוניות: השוק (כניסה), השירותים שלי, הפרופיל שלי, המלווה שלי.
const TABS = [
  { to: "/citizen", label: "שירותים", icon: Store, match: (p: string) => p === "/citizen" || p.startsWith("/citizen/services") },
  { to: "/citizen/activities", label: "השירותים שלי", icon: CalendarCheck, match: (p: string) => p.startsWith("/citizen/activities") },
  { to: "/citizen/profile", label: "הפרופיל שלי", icon: User, match: (p: string) => p.startsWith("/citizen/profile") || p.startsWith("/citizen/needs") },
  { to: "/citizen/companion", label: "המלווה שלי", icon: HeartHandshake, match: (p: string) => p.startsWith("/citizen/companion") },
  ...(CITIZEN_CHAT_ENABLED ? [{ to: "/citizen/chat", label: "שיחה", icon: MessageCircle, match: (p: string) => p.startsWith("/citizen/chat") }] : []),
];

// גודל טקסט: מקטין עד 90% ומגדיל עד 137% (Tailwind ב-rem). נשמר במכשיר.
const SCALES = [90, 100, 118, 137] as const;
const SCALE_KEY = "sal-ishi-text-scale";
const HC_KEY = "sal-ishi-contrast";

function useStored(key: string, fallback: number) {
  const [v, setV] = useState<number>(() => {
    try {
      return Number(localStorage.getItem(key)) || fallback;
    } catch {
      return fallback;
    }
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, String(v));
    } catch {
      /* אחסון חסום */
    }
  }, [key, v]);
  return [v, setV] as const;
}

function useTextScale() {
  const [scale, setScale] = useStored(SCALE_KEY, 100);
  useEffect(() => {
    document.documentElement.style.fontSize = scale === 100 ? "" : `${scale}%`;
    return () => {
      document.documentElement.style.fontSize = "";
    };
  }, [scale]);
  const i = Math.max(0, SCALES.indexOf(scale as (typeof SCALES)[number]));
  return {
    scale,
    up: i < SCALES.length - 1 ? () => setScale(SCALES[i + 1]) : undefined,
    down: i > 0 ? () => setScale(SCALES[i - 1]) : undefined,
  };
}

/** ניגודיות גבוהה: 1 פעיל, 2 כבוי (0 אינו נשמר כערך). */
function useContrast() {
  const [hc, setHc] = useStored(HC_KEY, 2);
  useEffect(() => {
    document.documentElement.classList.toggle("hc", hc === 1);
    return () => document.documentElement.classList.remove("hc");
  }, [hc]);
  return [hc === 1, () => setHc(hc === 1 ? 2 : 1)] as const;
}

const toolClass =
  "flex items-center justify-center gap-1.5 px-3 min-h-[44px] min-w-[44px] rounded-full text-base font-bold border bg-white border-[#1B3A5C]/25 text-[#1B3A5C] hover:bg-[#1B3A5C]/5 disabled:opacity-40 aria-pressed:bg-[#1B3A5C] aria-pressed:text-white";

export default function MobileShell() {
  const { pathname } = useLocation();
  const [mode, toggleMode] = useVisualMode();
  const isImages = mode === "images";
  const { speaking, read, stop, supported } = useReadAloud("he-IL");
  const { scale, up, down } = useTextScale();
  const [contrast, toggleContrast] = useContrast();
  const online = useOnline();

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

      {/* אין חיבור: מה שעושים נשמר במכשיר ויישלח כשהחיבור יחזור */}
      {!online ? (
        <div role="status" className="fixed bottom-20 left-0 right-0 z-40 flex items-start gap-2 bg-amber-100 border-t border-amber-300 text-amber-950 pr-5 pl-20 py-3 text-base font-medium shadow-md">
          <WifiOff className="w-5 h-5 shrink-0 mt-0.5" aria-hidden="true" /> {he.offline}
        </div>
      ) : null}

      {/* במחשב: עמודה אחת במרכז, כמו טלפון גדול, ולא מתיחה על כל הרוחב */}
      <div className="relative md:max-w-3xl md:mx-auto md:bg-white md:shadow-[0_0_24px_rgba(27,58,92,0.08)] md:min-h-screen">
        {/* סרגל נגישות: בכל מסכי האזרח, בשורה משלו כדי לא לכסות טקסט. */}
        <div className="flex flex-wrap items-center justify-end gap-2 px-3 py-2 bg-[#eef3f8] border-b border-[#1B3A5C]/10" role="toolbar" aria-label="כלי נגישות">
          {supported ? (
            <button type="button" className={toolClass} aria-pressed={speaking} onClick={speaking ? stop : read}>
              {speaking ? <Square className="w-4 h-4" aria-hidden="true" /> : <Volume2 className="w-4 h-4" aria-hidden="true" />}
              {speaking ? "לעצור" : "להקריא"}
            </button>
          ) : null}
          <button type="button" className={toolClass} onClick={down} disabled={!down} aria-label={`הקטנת טקסט. עכשיו ${scale} אחוז`}>
            <span aria-hidden="true">א-</span>
          </button>
          <button type="button" className={toolClass} onClick={up} disabled={!up} aria-label={`הגדלת טקסט. עכשיו ${scale} אחוז`}>
            <span aria-hidden="true">א+</span>
          </button>
          <button type="button" className={toolClass} onClick={toggleContrast} aria-pressed={contrast} aria-label="ניגודיות גבוהה">
            <Contrast className="w-4 h-4" aria-hidden="true" />
          </button>
          <button type="button" onClick={toggleMode} className={toolClass} aria-pressed={!isImages} aria-label={isImages ? "תצוגה בלי תמונות" : "תצוגה עם תמונות"}>
            {isImages ? <ImageOff className="w-4 h-4" aria-hidden="true" /> : <Image className="w-4 h-4" aria-hidden="true" />}
          </button>
        </div>

        <div className={online ? "pb-28" : "pb-48"}>
          <Outlet />
          {/* "שיחזרו אליי": בכל מסך של האזרח. בדף המלווה הוא חלק מהדף עצמו. */}
          {pathname.startsWith("/citizen/companion") ? null : (
            <div className="px-6 pt-2 pb-6 max-w-3xl mx-auto">
              <CallbackCard />
            </div>
          )}
        </div>
      </div>

      {/* ניווט תחתון: תמיד גלוי */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg" aria-label="ניווט ראשי">
        <div className="flex items-stretch justify-around gap-1 max-w-2xl mx-auto px-2 py-2">
          {TABS.map((tab) => {
            const Icon = tab.icon;
            const isActive = tab.match(pathname);
            return (
              <NavLink
                key={tab.to}
                to={tab.to}
                end
                aria-current={isActive ? "page" : undefined}
                className={cn(
                  "flex-1 flex flex-col items-center justify-center gap-0.5 min-h-[60px] min-w-[48px] px-1 rounded-xl text-center transition-colors",
                  isActive ? "bg-[#1B3A5C] text-white shadow-md" : "text-gray-700 hover:text-gray-900 hover:bg-gray-50",
                )}
              >
                <Icon className="w-6 h-6" aria-hidden="true" />
                <span className="text-sm font-semibold leading-tight">{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
