/**
 * DemoNav — ניווט עליון גלובלי
 * מאפשר לקפוץ בין ממשקים מכל מקום
 */
import { NavLink, useLocation } from "react-router-dom";
import { Phone, Heart, Building2, Users, Wallet } from "lucide-react";
import { cn } from "@/lib/utils";

const MODULES = [
  { to: "/", label: "בית", icon: Wallet, end: true },
  { to: "/citizen", label: "אזרח", icon: Phone },
  { to: "/coordinator", label: "מתאמת", icon: Heart },
  { to: "/executive", label: "ניהולי", icon: Building2 },
  { to: "/providers", label: "ספקים", icon: Users },
];

export default function DemoNav() {
  const { pathname } = useLocation();
  const activeModule = MODULES.find((m) => !m.end && pathname.startsWith(m.to))?.to || "/";

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-[#0f172a] text-white">
      <div className="flex items-center justify-between px-4 h-10 max-w-7xl mx-auto">
        <NavLink to="/" className="flex items-center gap-1.5 text-xs font-medium hover:opacity-80 transition-opacity">
          <Wallet className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-blue-400 font-bold">סל אישי</span>
          <span className="text-white/30 mx-1">|</span>
          <span className="text-white/50 text-[10px]">להזדקנות מיטבית</span>
        </NavLink>
        <div className="flex items-center gap-0.5" dir="rtl">
          {MODULES.map((mod) => {
            const Icon = mod.icon;
            const isActive = mod.end ? activeModule === "/" : pathname.startsWith(mod.to);
            return (
              <NavLink
                key={mod.to}
                to={mod.to}
                end={mod.end}
                className={cn(
                  "flex items-center gap-1.5 px-3 py-1.5 rounded-md text-[11px] font-medium transition-colors",
                  isActive ? "bg-white/15 text-white" : "text-white/50 hover:text-white/80 hover:bg-white/5"
                )}
              >
                <Icon className="w-3 h-3" />
                {mod.label}
              </NavLink>
            );
          })}
        </div>
      </div>
    </div>
  );
}
