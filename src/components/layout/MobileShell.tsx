import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Home, Star, MessageCircle, User, ImageOff, Image } from "lucide-react";
import { cn } from "@/lib/utils";
import { useVisualMode } from "@/hooks/use-visual-mode";

const TABS = [
  { to: "/citizen", label: "בית", icon: Home, end: true },
  { to: "/citizen/services", label: "שירותים", icon: Star },
  { to: "/citizen/chat", label: "שיחה", icon: MessageCircle },
  { to: "/citizen/profile", label: "פרופיל", icon: User },
];

export default function MobileShell() {
  const { pathname } = useLocation();
  const [mode, toggleMode] = useVisualMode();
  const isImages = mode === "images";

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8fafc]">
      {/* Content */}
      <div className="pb-24">
        <Outlet />
      </div>

      {/* Visual mode toggle — floating chip, top-left, only in citizen section */}
      <button
        onClick={toggleMode}
        className={cn(
          "fixed top-12 left-3 z-40 flex items-center gap-1.5 px-2.5 py-1.5 rounded-full text-[10px] font-semibold shadow-md border transition-all",
          isImages
            ? "bg-white border-[#1B3A5C]/20 text-[#1B3A5C] hover:bg-[#1B3A5C]/5"
            : "bg-[#1B3A5C] border-[#1B3A5C] text-white"
        )}
        title={isImages ? "עבור לתצוגה נקייה" : "עבור לתצוגה עם תמונות"}
      >
        {isImages
          ? <><ImageOff className="w-3 h-3" /> ללא תמונות</>
          : <><Image className="w-3 h-3" /> עם תמונות</>
        }
      </button>

      {/* Bottom Navigation — always visible */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-200 shadow-lg">
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
                  "flex flex-col items-center justify-center gap-1 w-16 h-16 rounded-xl transition-all",
                  isActive
                    ? "bg-[#1B3A5C] text-white shadow-md"
                    : "text-gray-400 hover:text-gray-600"
                )}
                style={{ minHeight: 48, minWidth: 48 }}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] font-medium">{tab.label}</span>
              </NavLink>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
