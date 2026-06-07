import { ReactNode } from "react";
import { NavLink, useLocation, Outlet } from "react-router-dom";
import { Heart, Home, Users, Calendar, Bell, FileText, Activity, Settings, LogOut, Wallet, Sparkles, BarChart3, Building2, Bot } from "lucide-react";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  badge?: number;
  end?: boolean;
}

const COORDINATOR_NAV: NavItem[] = [
  { to: "/coordinator", label: "דף הבית", icon: Home, end: true },
  { to: "/coordinator/patients", label: "אזרחים", icon: Users },
  { to: "/coordinator/services-map", label: "קטלוג שירותים", icon: Activity },
  { to: "/coordinator/agents", label: "אייג'נטים", icon: Bot },
  { to: "/coordinator/ai", label: "עוזר AI", icon: Sparkles },
  { to: "/coordinator/intake", label: "קליטה חדשה", icon: Heart },
  { to: "/coordinator/algorithm", label: "אלגוריתם", icon: BarChart3 },
  { to: "/coordinator/deterioration", label: "ניטור הידרדרות", icon: Bell, badge: 4 },
  { to: "/coordinator/actions", label: "משימות", icon: Heart },
  { to: "/coordinator/bookings", label: "הזמנות", icon: Calendar },
];

const EXECUTIVE_NAV: NavItem[] = [
  { to: "/executive", label: "מבט על", icon: Home, end: true },
];

const PROVIDER_NAV: NavItem[] = [
  { to: "/providers", label: "דשבורד", icon: Home, end: true },
];

interface AppShellProps {
  variant: "coordinator" | "executive" | "provider";
}

export default function AppShell({ variant }: AppShellProps) {
  const nav = variant === "coordinator" ? COORDINATOR_NAV : variant === "executive" ? EXECUTIVE_NAV : PROVIDER_NAV;
  const title = variant === "coordinator" ? "סל אישי" : variant === "executive" ? "סל אישי — ניהולי" : "פורטל ספקים";
  const subtitle = variant === "coordinator" ? "לוח בקרה למתאמות" : variant === "executive" ? "מבט על הרפורמה" : "ניהול שירותים";
  const { pathname } = useLocation();

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      {/* Sidebar */}
      <aside className="fixed top-0 right-0 h-screen w-64 border-l border-border bg-white flex flex-col z-30">
        <div className="px-5 py-5 border-b border-border">
          <NavLink to="/" className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center shadow-sm">
              <Wallet className="w-5 h-5" />
            </div>
            <div>
              <div className="font-bold text-lg leading-none text-primary">{title}</div>
              <div className="text-[11px] text-muted-foreground mt-1">{subtitle}</div>
            </div>
          </NavLink>
        </div>

        <nav className="flex-1 px-3 py-4 space-y-1 overflow-y-auto scrollbar-thin">
          {nav.map((item) => {
            const Icon = item.icon;
            const active = item.end ? pathname === item.to : pathname.startsWith(item.to) && pathname !== item.to.split("/").slice(0, -1).join("/");
            const isExactActive = item.end ? pathname === item.to : pathname.startsWith(item.to);
            return (
              <NavLink
                key={item.to}
                to={item.to}
                end={item.end}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isExactActive
                    ? "bg-primary text-primary-foreground"
                    : "text-foreground hover:bg-accent hover:text-accent-foreground"
                )}
              >
                <Icon className="w-[18px] h-[18px] shrink-0" />
                <span className="flex-1">{item.label}</span>
                {item.badge ? (
                  <span className={cn(
                    "min-w-5 h-5 px-1.5 rounded-full text-[11px] font-semibold flex items-center justify-center",
                    isExactActive ? "bg-primary-foreground/20 text-primary-foreground" : "bg-destructive text-destructive-foreground"
                  )}>
                    {item.badge}
                  </span>
                ) : null}
              </NavLink>
            );
          })}
        </nav>

        <div className="border-t border-border p-3">
          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center text-sm font-semibold">
              {variant === "coordinator" ? "רל" : variant === "executive" ? "מנ" : "ספ"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">
                {variant === "coordinator" ? "רונית לוי" : variant === "executive" ? "מנהל בכיר" : "מתנ״ס פסגת זאב"}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {variant === "coordinator" ? "מתאמת חברתית" : variant === "executive" ? "סמנכ״ל" : "ספק שירות"}
              </div>
            </div>
            <button className="w-8 h-8 flex items-center justify-center rounded-lg text-muted-foreground hover:bg-background hover:text-destructive transition-colors" aria-label="יציאה">
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className="mr-64 min-h-screen">
        <div className="p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
