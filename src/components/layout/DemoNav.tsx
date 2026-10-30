/**
 * DemoNav: הפס העליון. שלוש הדלתות של הסיפור (שרה, רונית, המטה), הספקים,
 * ותפריט "הדגמה" עם איפוס, הכנה לעבודה בלי אינטרנט ומצבי קצה, מכל מסך.
 * התפריט מופיע רק במצב הדגמה (app-settings.json: mode = demo).
 */
import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { Phone, Heart, Building2, Users, Wallet, SlidersHorizontal } from "lucide-react";
import { cn } from "@/lib/utils";
import { appSettings, isDemo } from "@/pilot/settings";
import { reportAttendance, setSimulation, usePilot } from "@/pilot/store";
import { resetDemo } from "@/pilot/reset";
import { prepareOffline } from "@/pilot/offline";
import type { Simulation } from "@/pilot/model";

const MODULES = [
  { to: "/", label: "בית", icon: Wallet, end: true },
  { to: "/citizen", label: "שרה", icon: Phone },
  { to: "/coordinator", label: "רונית", icon: Heart },
  { to: "/executive", label: "מטה", icon: Building2 },
  { to: "/providers", label: "ספקים", icon: Users },
];

const SWITCHES: { key: keyof Simulation; label: string }[] = [
  { key: "offline", label: "אין אינטרנט (הדמיה)" },
  { key: "walletEmpty", label: "הארנק של החודש נגמר" },
  { key: "companionAway", label: "המלווה לא זמינה השבוע" },
  { key: "noServices", label: "אין שירותים בשכונה" },
];

function DemoMenu() {
  const [open, setOpen] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const { state, derived } = usePilot();
  const navigate = useNavigate();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    const onClick = (e: MouseEvent) => ref.current && !ref.current.contains(e.target as Node) && setOpen(false);
    window.addEventListener("keydown", onKey);
    window.addEventListener("mousedown", onClick);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("mousedown", onClick);
    };
  }, [open]);

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-expanded={open}
        aria-controls="demo-menu"
        onClick={() => setOpen(!open)}
        className={cn("flex items-center gap-1.5 px-2 sm:px-3 min-h-[32px] rounded-md text-xs font-semibold whitespace-nowrap", open ? "bg-white text-[#0f172a]" : "text-white/90 hover:bg-white/10")}
      >
        <SlidersHorizontal className="w-3.5 h-3.5" aria-hidden="true" /> הדגמה
      </button>
      {open ? (
        <div id="demo-menu" role="region" aria-label="כלי ההדגמה" className="absolute top-9 right-0 w-72 bg-white text-gray-900 rounded-xl shadow-xl border border-gray-200 p-4 space-y-3" dir="rtl">
          <button
            type="button"
            className="w-full min-h-[44px] rounded-lg bg-[#1B3A5C] text-white text-sm font-semibold"
            onClick={async () => {
              await resetDemo();
              setMsg("ההדגמה אופסה. נתוני הפתיחה נטענו מחדש.");
              navigate("/");
            }}
          >
            איפוס ההדגמה
          </button>
          <button type="button" className="w-full min-h-[44px] rounded-lg border border-[#1B3A5C]/40 text-[#1B3A5C] text-sm font-semibold" onClick={async () => setMsg(await prepareOffline())}>
            הכנה לעבודה בלי אינטרנט
          </button>
          <button
            type="button"
            className="w-full min-h-[44px] rounded-lg border border-[#1B3A5C]/40 text-[#1B3A5C] text-sm font-semibold"
            onClick={() => {
              const active = derived.bookings.filter((b) => b.citizenId === appSettings.citizen.persona_id && b.status === "booked");
              for (const b of active) reportAttendance({ citizenId: b.citizenId, bookingId: b.id });
              setMsg(active.length ? `הספק דיווח: שרה השתתפה במפגש (${active.length === 1 ? "פעילות אחת" : `${active.length} פעילויות`}). "שמור" הפך ל"נוצל".` : "אין לשרה פעילות פעילה לדווח עליה.");
            }}
          >
            הספק מדווח נוכחות של שרה
          </button>
          <fieldset className="space-y-1">
            <legend className="text-sm font-semibold mb-1">מצבי קצה</legend>
            {SWITCHES.map((s) => (
              <label key={s.key} className="flex items-center gap-2 min-h-[40px] text-sm cursor-pointer">
                <input type="checkbox" className="w-4 h-4" checked={state.simulation[s.key]} onChange={(e) => setSimulation({ [s.key]: e.target.checked })} />
                {s.label}
              </label>
            ))}
          </fieldset>
          <p className="text-xs text-gray-600">אשפוז ושירות שנדחה מדגימים אצל רונית, בתיק של שרה.</p>
          {msg ? <p role="status" className="text-xs text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg px-2 py-1.5">{msg}</p> : null}
        </div>
      ) : null}
    </div>
  );
}

export default function DemoNav() {
  const { pathname } = useLocation();

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-[#0f172a] text-white">
      <div className="flex items-center justify-between gap-1 sm:gap-2 px-2 sm:px-4 h-10 max-w-7xl mx-auto">
        <NavLink to="/" className="flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity shrink-0">
          <Wallet className="w-3.5 h-3.5 text-blue-300" aria-hidden="true" />
          {/* בטלפון: רק הסמל, כדי שכל הדלתות ייכנסו בפס בלי גלילה. */}
          <span className="sr-only sm:not-sr-only text-blue-300 font-bold">הסל האישי</span>
        </NavLink>
        <nav aria-label="שלוש הדלתות" className="flex items-center gap-0.5 min-w-0 overflow-x-auto" dir="rtl">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = mod.end ? pathname === "/" : pathname.startsWith(mod.to);
            return (
              <NavLink
                key={mod.to}
                to={mod.to}
                end={mod.end}
                className={cn(
                  "flex items-center gap-1.5 px-2 sm:px-3 min-h-[32px] rounded-md text-xs font-medium whitespace-nowrap transition-colors",
                  isActive ? "bg-white/15 text-white" : "text-white/80 hover:text-white hover:bg-white/10",
                )}
              >
                <Icon className="hidden sm:block w-3.5 h-3.5" aria-hidden="true" />
                {mod.label}
              </NavLink>
            );
          })}
        </nav>
        {isDemo() ? <DemoMenu /> : null}
      </div>
    </div>
  );
}
