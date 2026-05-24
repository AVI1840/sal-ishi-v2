import { Heart, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { SERVICES } from "@/data/mockData";
import { useState } from "react";

const CATEGORIES = ["הכל", "בריאות", "חברתי", "פנאי", "טכנולוגיה", "בית"];

export default function CitizenServices() {
  const [active, setActive] = useState("הכל");

  return (
    <div className="px-5 pt-4 space-y-5 animate-fade-in">
      <header>
        <h1 className="text-xl font-bold text-foreground">שירותים</h1>
        <p className="text-sm text-muted-foreground mt-0.5">כל השירותים הזמינים עבורך</p>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          placeholder="חיפוש שירות..."
          className="w-full h-11 pr-10 pl-4 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          dir="rtl"
        />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setActive(cat)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              active === cat
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Services Grid */}
      <div className="grid grid-cols-1 gap-3">
        {SERVICES.map((service) => (
          <Link to={`/citizen/services/${service.id}`} key={service.id} className="flex items-center gap-3 bg-card rounded-xl border border-border/50 p-4 hover:shadow-sm transition-shadow">
            <div className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0" style={{ backgroundColor: `${service.color}15` }}>
              <Heart className="w-5 h-5" style={{ color: service.color }} />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-semibold text-foreground">{service.name}</h4>
              <p className="text-xs text-muted-foreground mt-0.5 line-clamp-1">{service.description}</p>
              <div className="flex items-center gap-2 mt-1.5">
                <span className="text-[11px] text-muted-foreground">{service.duration}</span>
                <span className="text-[11px] text-muted-foreground">•</span>
                <span className="text-[11px] text-muted-foreground">{service.location}</span>
              </div>
            </div>
            <div className="text-left shrink-0">
              {service.cost === 0 ? (
                <span className="text-xs font-medium text-success">חינם</span>
              ) : (
                <span className="text-xs font-medium text-info">{service.cost} יח׳</span>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
