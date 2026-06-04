import { Outlet, NavLink, useLocation } from "react-router-dom";
import { Home, Star, MessageCircle, User, BookOpen } from "lucide-react";
import { cn } from "@/lib/utils";

const TABS = [
  { to: "/citizen", label: "בית", icon: Home, end: true },
  { to: "/citizen/services", label: "שירותים", icon: Star },
  { to: "/citizen/catalog", label: "קטלוג", icon: BookOpen },
  { to: "/citizen/chat", label: "שיחה", icon: MessageCircle },
  { to: "/citizen/profile", label: "פרופיל", icon: User },
];

export default function MobileShell() {
  const { pathname } = useLocation();

  return (
    <div dir="rtl" className="min-h-screen bg-[#f8fafc]">
      {/* Content — full width, responsive */}
      <div className="pb-24">
        <Outlet />
      </div>

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
