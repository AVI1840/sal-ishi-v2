import { useState, useMemo } from "react";
import { Search, MapPin, Phone, Clock, Filter } from "lucide-react";
import { Link } from "react-router-dom";
import {
  realServices,
  NEIGHBORHOODS_LIST,
  CATEGORY_FILTERS,
  COST_FILTERS,
  filterServices,
  type CostType,
} from "@/data/realServices";

const MOBILITY_MAP: Record<string, string> = {
  independent: "עצמאי",
  "frail-light": "חלש-קל",
  frail: "חלש",
  homebound: "מרותק בית",
  any: "כולם",
};

const CERTAINTY_COLOR: Record<string, string> = {
  high: "bg-green-100 text-green-700",
  medium: "bg-yellow-100 text-yellow-700",
  low: "bg-gray-100 text-gray-500",
};

export default function CitizenServices() {
  const [query, setQuery] = useState("");
  const [neighborhood, setNeighborhood] = useState("הכל");
  const [category, setCategory] = useState(0);
  const [cost, setCost] = useState<CostType | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(
    () =>
      filterServices({ neighborhood, category, cost, query }),
    [query, neighborhood, category, cost]
  );

  return (
    <div className="px-4 pt-4 pb-24 space-y-4 animate-fade-in" dir="rtl">
      {/* Header */}
      <header>
        <h1 className="text-xl font-bold text-foreground">שירותים</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {results.length} שירותים זמינים{neighborhood !== "הכל" ? ` ב${neighborhood}` : ""}
        </p>
      </header>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש שירות..."
          className="w-full h-11 pr-10 pl-12 rounded-xl border border-border bg-card text-sm placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/30"
          dir="rtl"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={`absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-lg transition-colors ${showFilters ? "bg-primary text-white" : "bg-muted text-muted-foreground hover:bg-accent"}`}
        >
          <Filter className="w-4 h-4" />
        </button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1 -mx-1 px-1">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors ${
              category === cat.value
                ? "bg-primary text-white"
                : "bg-muted text-muted-foreground hover:bg-accent"
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Expanded filters */}
      {showFilters && (
        <div className="bg-card border border-border rounded-xl p-4 space-y-3">
          {/* Neighborhood */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">שכונה</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {NEIGHBORHOODS_LIST.map((n) => (
                <button
                  key={n}
                  onClick={() => setNeighborhood(n)}
                  className={`px-3 py-1 rounded-full text-xs whitespace-nowrap border transition-colors ${
                    neighborhood === n
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          {/* Cost */}
          <div>
            <p className="text-xs font-medium text-muted-foreground mb-2">עלות</p>
            <div className="flex gap-2 flex-wrap">
              {COST_FILTERS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCost(c.value)}
                  className={`px-3 py-1 rounded-full text-xs border transition-colors ${
                    cost === c.value
                      ? "border-primary bg-primary/10 text-primary font-medium"
                      : "border-border text-muted-foreground hover:border-primary/50"
                  }`}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Results */}
      {results.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground">
          <p className="text-3xl mb-2">🔍</p>
          <p className="text-sm">לא נמצאו שירותים</p>
          <button
            onClick={() => { setQuery(""); setNeighborhood("הכל"); setCategory(0); setCost("all"); }}
            className="mt-3 text-xs text-primary underline"
          >
            נקה סינון
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {results.map((service) => (
            <Link
              to={`/citizen/services/${service.id}`}
              key={service.id}
              className="block bg-card rounded-xl border border-border/60 p-4 hover:shadow-sm hover:border-primary/30 transition-all"
            >
              <div className="flex items-start gap-3">
                {/* Icon */}
                <div
                  className="w-11 h-11 rounded-xl flex items-center justify-center shrink-0 text-xl"
                  style={{ backgroundColor: "#1B3A5C15" }}
                >
                  {service.emoji}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-sm font-semibold text-foreground leading-tight">{service.name}</h4>
                    <span
                      className={`shrink-0 text-[10px] px-2 py-0.5 rounded-full font-medium ${
                        service.cost === "free"
                          ? "bg-green-100 text-green-700"
                          : service.cost === "subsidized"
                          ? "bg-blue-100 text-blue-700"
                          : "bg-gray-100 text-gray-600"
                      }`}
                    >
                      {service.costLabel}
                    </span>
                  </div>

                  <p className="text-xs text-muted-foreground mt-0.5">{service.provider}</p>

                  <div className="flex items-center gap-3 mt-1.5 flex-wrap">
                    {service.neighborhood && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <MapPin className="w-3 h-3" /> {service.neighborhood}
                      </span>
                    )}
                    {service.hours && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Clock className="w-3 h-3" /> {service.days}
                      </span>
                    )}
                    {service.phone && (
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                        <Phone className="w-3 h-3" /> {service.phone}
                      </span>
                    )}
                  </div>

                  {service.notes && (
                    <p className="text-[11px] text-muted-foreground mt-1 line-clamp-1 opacity-70">
                      {service.notes}
                    </p>
                  )}

                  {/* Tags */}
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-muted text-muted-foreground">
                      {service.categoryLabel}
                    </span>
                    {service.languages.includes("arabic") && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-purple-100 text-purple-700">ערבית</span>
                    )}
                    {service.languages.includes("russian") && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">רוסית</span>
                    )}
                    {service.accessibility.includes("wheelchair") && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-100 text-teal-700">♿ נגיש</span>
                    )}
                    {service.accessibility.includes("transport") && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-orange-100 text-orange-700">🚌 הסעה</span>
                    )}
                    {MOBILITY_MAP[service.target_mobility] && service.target_mobility !== "any" && (
                      <span className={`text-[10px] px-2 py-0.5 rounded-full ${CERTAINTY_COLOR[service.certainty]}`}>
                        ✓ {service.certainty === "high" ? "אומת" : "מאומת חלקית"}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
