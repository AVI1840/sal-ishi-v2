import { Search, Filter } from "lucide-react";
import { useState } from "react";
import { SERVICES } from "@/data/mockData";

const CATEGORIES = [
  { key: "all", label: "הכל" },
  { key: "health_function", label: "בריאות" },
  { key: "belonging_meaning", label: "שייכות" },
  { key: "leisure_culture", label: "פנאי" },
  { key: "home_services", label: "ביתי" },
  { key: "assistive_tech", label: "טכנולוגיה" },
];

export default function ServicesList() {
  const [activeCategory, setActiveCategory] = useState("all");
  const [search, setSearch] = useState("");

  const filtered = SERVICES.filter((s) => {
    if (activeCategory !== "all" && s.category !== activeCategory) return false;
    if (search && !s.name.includes(search) && !s.description.includes(search)) return false;
    return true;
  });

  return (
    <div className="px-5 pt-4 pb-6 space-y-5 animate-fade-in">
      <header>
        <h1 className="text-xl font-bold text-foreground">שירותים</h1>
        <p className="text-sm text-muted-foreground mt-1">כל השירותים הזמינים עבורך</p>
      </header>

      {/* Search */}
      <div className="flex items-center gap-2 bg-muted rounded-xl px-4 py-3">
        <Search className="w-4 h-4 text-muted-foreground shrink-0" />
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="חיפוש שירות..."
          className="bg-transparent text-sm text-foreground placeholder:text-muted-foreground outline-none flex-1"
          dir="rtl"
        />
        <Filter className="w-4 h-4 text-muted-foreground" />
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-thin">
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            onClick={() => setActiveCategory(cat.key)}
            className={`px-4 py-2 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              activeCategory === cat.key
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Services grid */}
      <div className="grid grid-cols-1 gap-3">
        {filtered.map((service) => (
          <div key={service.id} className="sal-card flex items-center gap-4">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: service.color + "15" }}
            >
              <span className="text-lg">🏃</span>
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-foreground">{service.name}</h4>
              <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{service.description}</p>
              <div className="flex items-center gap-2 mt-1.5">
                {service.cost === 0 ? (
                  <span className="text-[10px] font-medium text-green-600 bg-success-soft px-2 py-0.5 rounded-full">חינם ✨</span>
                ) : (
                  <span className="text-[10px] font-medium text-blue-600 bg-info-soft px-2 py-0.5 rounded-full">{service.cost} יחידות</span>
                )}
                <span className="text-[10px] text-muted-foreground">📊 {service.engagementRate}% התמדה</span>
              </div>
            </div>
            <button className="h-9 px-4 bg-primary text-white text-xs font-medium rounded-lg hover:bg-primary/90 transition-colors shrink-0">
              הזמנה
            </button>
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <Search className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
          <p className="text-sm text-muted-foreground">לא נמצאו שירותים מתאימים</p>
        </div>
      )}
    </div>
  );
}
