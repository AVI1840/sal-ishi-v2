import { NavLink, useLocation } from "react-router-dom";
import { Heart, Home, Users, Calendar, Bell, FileText, Activity, Settings, LogOut, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

interface AppSidebarProps {
  variant?: "coordinator" | "executive" | "provider";
}

const COORDINATOR_NAV = [
  { to: "/coordinator", label: "דף הבית", icon: Home, end: true },
  { to: "/coordinator/patients", label: "אזרחים", icon: Users },
  { to: "/coordinator/services-map", label: "מיפוי שירותים", icon: Heart },
  { to: "/coordinator/algorithm", label: "אלגוריתם", icon: Activity },
  { to: "/coordinator/intake", label: "אינטייק AI", icon: Sparkles },
  { to: "/coordinator", label: "יומן", icon: Calendar },
  { to: "/coordinator", label: "התראות", icon: Bell, badge: 3 },
  { to: "/coordinator", label: "דיווחים", icon: FileText },
  { to: "/coordinator", label: "הגדרות", icon: Settings },
];

export default function AppSidebar({ variant = "coordinator" }: AppSidebarProps) {
  const { pathname } = useLocation();

  return (
    <aside className="fixed top-0 right-0 h-screen w-64 border-l border-border bg-white flex flex-col z-30">
      {/* Logo */}
      <div className="px-5 py-5 border-b border-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
            <Heart className="w-5 h-5" fill="currentColor" />
          </div>
          <div>
            <div className="font-bold text-lg leading-none text-primary">סל אישי</div>
            <div className="text-[11px] text-muted-foreground mt-1">לוח בקרה למתאמות</div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
        {COORDINATOR_NAV.map((item) => {
          const Icon = item.icon;
          const active = item.end ? pathname === item.to : pathname.startsWith(item.to) && pathname !== "/coordinator";
          const isActive = item.end ? pathname === item.to : false;
          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.end}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                (item.end ? pathname === item.to : false)
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground/70 hover:bg-accent hover:text-accent-foreground"
              )}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span className="flex-1">{item.label}</span>
              {item.badge && (
                <span className="min-w-5 h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center bg-destructive text-destructive-foreground">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* User */}
      <div className="border-t border-border p-3">
        <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center text-sm font-semibold">
            רל
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-sm font-semibold text-foreground truncate">רונית לוי</div>
            <div className="text-[11px] text-muted-foreground truncate">מלווה חברתית</div>
          </div>
          <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:text-destructive transition-colors" aria-label="יציאה">
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  );
}
