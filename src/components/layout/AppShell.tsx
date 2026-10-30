import { useEffect, useState } from "react";
import { NavLink, useLocation, Outlet } from "react-router-dom";
import { Home, Users, Wallet, BarChart3, BookOpen, Menu, X, WifiOff, MapPinned, Store, ExternalLink } from "lucide-react";
import { appSettings } from "@/pilot/settings";
import { useOnline } from "@/pilot/components/Frame";
import { cn } from "@/lib/utils";

interface NavItem {
  to: string;
  label: string;
  icon: typeof Home;
  badge?: number;
  end?: boolean;
}

// הדגמה: שלושה מסכים שמספרים את הסיפור. שאר המסכים (קליטה, משימות, הזמנות,
// ניטור, שירותים ממופים) נשארים בכתובת ישירה ולא נמחקו.
const COORDINATOR_NAV: NavItem[] = [
  { to: "/coordinator", label: "היום שלי", icon: Home, end: true },
  { to: "/coordinator/patients", label: "האזרחים שלי", icon: Users },
  { to: "/coordinator/community", label: "הקהילה שלי", icon: MapPinned },
];

const EXECUTIVE_NAV: NavItem[] = [
  { to: "/executive", label: "מבט על", icon: Home, end: true },
  { to: "/executive/catalog", label: "קטלוג סל", icon: BookOpen },
  { to: "/executive/algorithm", label: "אלגוריתם התאמה", icon: BarChart3 },
];

const PROVIDER_NAV: NavItem[] = [
  { to: "/providers", label: "קליטה לפי התקן", icon: Store, end: true },
];

interface AppShellProps {
  variant: "coordinator" | "executive" | "provider";
}

export default function AppShell({ variant }: AppShellProps) {
  const nav = variant === "coordinator" ? COORDINATOR_NAV : variant === "executive" ? EXECUTIVE_NAV : PROVIDER_NAV;
  const title = variant === "coordinator" ? "סל אישי" : variant === "executive" ? "סל אישי - מטה" : "פורטל ספקים";
  const subtitle = variant === "coordinator" ? "לוח בקרה למלווה חברתית" : variant === "executive" ? "מבט על הרפורמה" : "ניהול שירותים";
  const { pathname } = useLocation();
  // בטלפון התפריט נפתח בכפתור ולא מכסה את התוכן (0.5: המלווה עובדת מהנייד).
  const [open, setOpen] = useState(false);
  const online = useOnline();
  useEffect(() => setOpen(false), [pathname]);

  return (
    <div dir="rtl" className="min-h-screen bg-background">
      <div className="lg:hidden sticky top-10 z-30 flex items-center justify-between bg-white border-b border-border px-4 h-14">
        <span className="font-bold text-primary">{title}</span>
        <button type="button" className="min-h-[44px] min-w-[44px] inline-flex items-center justify-center gap-1 rounded-lg border border-border px-3 text-sm font-semibold" aria-expanded={open} aria-controls="app-sidebar" onClick={() => setOpen(!open)}>
          {open ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
          תפריט
        </button>
      </div>
      {open ? <div className="lg:hidden fixed inset-0 z-30 bg-black/30" aria-hidden="true" onClick={() => setOpen(false)} /> : null}
      {/* Sidebar */}
      <aside id="app-sidebar" className={cn("fixed top-10 right-0 h-[calc(100vh-2.5rem)] w-64 border-l border-border bg-white flex-col z-40 lg:z-30", open ? "flex" : "hidden lg:flex")}>
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

        <div className="border-t border-border p-3 space-y-2">
          {/* האטלס: אותו קטלוג, אצל הרשות (שטח) ובמטה */}
          <a
            href={variant === "executive" ? "./hq/" : "./field/"}
            className="flex items-center gap-2 px-3 min-h-[44px] rounded-lg text-sm font-medium text-foreground hover:bg-accent transition-colors border border-border"
          >
            <MapPinned className="w-4 h-4" aria-hidden="true" />
            <span>{variant === "executive" ? "אטלס וקטלוג - מטה" : "אטלס השכונה (שטח)"}</span>
            <ExternalLink className="w-3.5 h-3.5 mr-auto text-muted-foreground" aria-hidden="true" />
          </a>

          <div className="flex items-center gap-3 px-2 py-2 rounded-lg hover:bg-accent transition-colors">
            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-primary to-primary-glow text-primary-foreground flex items-center justify-center text-sm font-semibold">
              {variant === "coordinator" ? appSettings.companion.name.charAt(0) : variant === "executive" ? "מט" : "ספ"}
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-foreground truncate">
                {variant === "coordinator" ? appSettings.companion.name : variant === "executive" ? "מטה התכנית" : "מתנ״ס פסגת זאב"}
              </div>
              <div className="text-[11px] text-muted-foreground truncate">
                {variant === "coordinator" ? "מלווה חברתית · פסגת זאב" : variant === "executive" ? "ביטוח לאומי ומשרד הרווחה" : "ספק שירות"}
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main id="main" tabIndex={-1} className="lg:mr-64 min-h-screen">
        {!online ? (
          <div role="status" className="sticky top-10 z-30 flex items-center gap-2 bg-warning-soft border-b border-border text-foreground px-4 lg:px-8 py-2.5 text-sm font-medium">
            <WifiOff className="w-4 h-4 shrink-0" aria-hidden="true" /> אין חיבור. אפשר להמשיך לעבוד: הכל נשמר במכשיר ויסונכרן כשהחיבור יחזור.
          </div>
        ) : null}
        <div className="p-4 lg:p-8 animate-fade-in">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
