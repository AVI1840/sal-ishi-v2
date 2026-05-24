/**
 * DemoNav — מחליף מודולים גלובלי
 * מאפשר לקפוץ בין אזרח/מתאמת/ניהולי/ספקים מכל מקום
 */
import { NavLink, useLocation } from "react-router-dom";
import { Phone, Heart, Building2, Users, Wallet, Globe } from "lucide-react";
import { cn } from "@/lib/utils";

const MODULES = [
  { to: "/", label: "בית", icon: Wallet, end: true },
  { to: "/citizen", label: "אזרח", icon: Phone },
  { to: "/coordinator", label: "מתאמת", icon: Heart },
  { to: "/executive", label: "ניהולי", icon: Building2 },
  { to: "/providers", label: "ספקים", icon: Users },
  { to: "/national", label: "מדינה", icon: Globe },
];

const V1_LINKS: { href: string; label: string }[] = [
  // Links to v1 only work locally
];

export default function DemoNav() {
  const { pathname } = useLocation();

  // Determine which module is active
  const activeModule = MODULES.find((m) => !m.end && pathname.startsWith(m.to))?.to || "/";

  return (
    <div className="fixed top-0 left-0 right-0 z-[60] bg-[#0f172a] text-white">
      <div className="flex items-center justify-between px-4 h-10 max-w-7xl mx-auto">
        <NavLink to="/" className="flex items-center gap-1 text-xs font-medium hover:opacity-80 transition-opacity">
          <Wallet className="w-3.5 h-3.5 text-blue-400" />
          <span className="text-blue-400 font-bold">סל אישי</span>
          <span className="text-white/40 mx-2">|</span>
          <span className="text-white/60">דמו אינטראקטיבי</span>
        </NavLink>
        <div className="flex items-center gap-0.5">
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
          {/* V1 comparison links */}
          <span className="text-white/20 mx-1.5">|</span>
          {V1_LINKS.map((link) => (
            <a
              key={link.href}
              href={link.href}
              target="_blank"
              rel="noopener noreferrer"
              className="px-2.5 py-1.5 rounded-md text-[11px] font-medium text-amber-400/70 hover:text-amber-300 hover:bg-white/5 transition-colors"
            >
              {link.label} ↗
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
