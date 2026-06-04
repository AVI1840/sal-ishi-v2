import { useState, useMemo } from "react";
import { Search, MapPin, Phone, Clock, ExternalLink, BarChart2 } from "lucide-react";
import {
  realServices,
  catalogStats,
  filterServices,
  NEIGHBORHOODS_LIST,
  CATEGORY_FILTERS,
  COST_FILTERS,
  type CostType,
} from "@/data/realServices";

const SCORE_COLOR = (score: number) =>
  score >= 80 ? "text-green-600" : score >= 60 ? "text-yellow-600" : "text-gray-400";

export default function CoordinatorServices() {
  const [query, setQuery] = useState("");
  const [neighborhood, setNeighborhood] = useState("הכל");
  const [category, setCategory] = useState(0);
  const [cost, setCost] = useState<CostType | "all">("all");
  const [selected, setSelected] = useState<string | null>(null);

  const results = useMemo(
    () => filterServices({ neighborhood, category, cost, query }),
    [query, neighborhood, category, cost]
  );

  const selectedService = selected ? realServices.find((s) => s.id === selected) : null;

  return (
    <div className="space-y-6" dir="rtl">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          🔍 מיפוי שירותים
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {catalogStats.total} שירותים ממופים ב-6 שכונות
        </p>
      </div>

      {/* Stats row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(catalogStats.byCategory).map(([label, count]) => (
          <div key={label} className="libi-card p-3 text-center">
            <div className="text-2xl font-bold text-primary">{count}</div>
            <div className="text-xs text-muted-foreground mt-0.5">{label}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left — list */}
        <div className="lg:col-span-2 space-y-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש לפי שם, ספק, הערות..."
              className="w-full h-10 pr-10 pl-4 rounded-xl border border-border bg-card text-sm focus:outline-none focus:ring-2 focus:ring-primary/30"
              dir="rtl"
            />
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2 items-center">
            {/* Neighborhood */}
            <select
              value={neighborhood}
              onChange={(e) => setNeighborhood(e.target.value)}
              className="h-9 px-3 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none"
              dir="rtl"
            >
              {NEIGHBORHOODS_LIST.map((n) => (
                <option key={n} value={n}>{n}</option>
              ))}
            </select>

            {/* Category */}
            <select
              value={category}
              onChange={(e) => setCategory(Number(e.target.value))}
              className="h-9 px-3 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none"
              dir="rtl"
            >
              {CATEGORY_FILTERS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            {/* Cost */}
            <select
              value={cost}
              onChange={(e) => setCost(e.target.value as CostType | "all")}
              className="h-9 px-3 rounded-lg border border-border bg-card text-sm text-foreground focus:outline-none"
              dir="rtl"
            >
              {COST_FILTERS.map((c) => (
                <option key={c.value} value={c.value}>{c.label}</option>
              ))}
            </select>

            <span className="text-sm text-muted-foreground mr-auto">
              {results.length} תוצאות
            </span>
          </div>

          {/* List */}
          <div className="space-y-2 max-h-[60vh] overflow-y-auto pl-1">
            {results.length === 0 ? (
              <div className="text-center py-12 text-muted-foreground">
                <p className="text-3xl mb-2">🔍</p>
                <p className="text-sm">לא נמצאו שירותים</p>
              </div>
            ) : (
              results.map((service) => (
                <button
                  key={service.id}
                  onClick={() => setSelected(service.id === selected ? null : service.id)}
                  className={`w-full text-right rounded-xl border p-3 transition-all hover:shadow-sm ${
                    selected === service.id
                      ? "border-primary bg-primary/5"
                      : "border-border bg-card hover:border-primary/30"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl shrink-0 mt-0.5">{service.emoji}</span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-semibold text-foreground truncate">{service.name}</span>
                        <span className={`text-xs font-bold shrink-0 ${SCORE_COLOR(service.match_score)}`}>
                          {service.match_score}%
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">{service.provider}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1 text-[11px] text-muted-foreground">
                          <MapPin className="w-3 h-3" /> {service.neighborhood}
                        </span>
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                            service.cost === "free"
                              ? "bg-green-100 text-green-700"
                              : service.cost === "subsidized"
                              ? "bg-blue-100 text-blue-700"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {service.costLabel}
                        </span>
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground">
                          {service.categoryLabel}
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Right — detail panel */}
        <div className="libi-card p-5 space-y-4 h-fit sticky top-4">
          {selectedService ? (
            <>
              <div className="flex items-start gap-3">
                <span className="text-3xl">{selectedService.emoji}</span>
                <div>
                  <h3 className="text-base font-bold text-foreground">{selectedService.name}</h3>
                  <p className="text-sm text-muted-foreground">{selectedService.provider}</p>
                </div>
              </div>

              <div className="space-y-2 text-sm">
                <Row icon={<MapPin className="w-4 h-4" />} label="כתובת" value={selectedService.address} />
                <Row icon={<Clock className="w-4 h-4" />} label="ימים" value={`${selectedService.days}  ${selectedService.hours}`} />
                <Row icon={<Phone className="w-4 h-4" />} label="טלפון" value={selectedService.phone} />
              </div>

              <div className="flex flex-wrap gap-2">
                {selectedService.languages.map((lang) => (
                  <span key={lang} className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground">
                    {lang === "hebrew" ? "עברית" : lang === "arabic" ? "ערבית" : lang === "russian" ? "רוסית" : lang === "english" ? "אנגלית" : lang}
                  </span>
                ))}
                {selectedService.accessibility.map((a) => (
                  <span key={a} className="text-xs px-2 py-1 rounded-full bg-teal-100 text-teal-700">
                    {a === "wheelchair" ? "♿" : a === "transport" ? "🚌" : a === "home_visit" ? "🏠" : a === "remote" ? "💻" : a}
                  </span>
                ))}
              </div>

              {selectedService.cost_note && (
                <p className="text-xs text-muted-foreground bg-muted/50 rounded-lg p-2">
                  💰 {selectedService.cost_note}
                </p>
              )}

              {selectedService.notes && (
                <p className="text-xs text-muted-foreground bg-blue-50 rounded-lg p-2 border border-blue-100">
                  💡 {selectedService.notes}
                </p>
              )}

              <div className="flex items-center gap-2 pt-2 border-t border-border">
                <BarChart2 className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium text-foreground">ציון התאמה:</span>
                <span className={`text-sm font-bold ${SCORE_COLOR(selectedService.match_score)}`}>
                  {selectedService.match_score}%
                </span>
                <span className={`text-xs px-1.5 py-0.5 rounded-full mr-auto ${
                  selectedService.certainty === "high"
                    ? "bg-green-100 text-green-700"
                    : "bg-yellow-100 text-yellow-700"
                }`}>
                  {selectedService.certainty === "high" ? "✓ מאומת" : "~ חלקי"}
                </span>
              </div>

              {selectedService.website && (
                <a
                  href={`https://${selectedService.website}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-2 text-xs text-primary hover:underline"
                >
                  <ExternalLink className="w-3 h-3" /> {selectedService.website}
                </a>
              )}
            </>
          ) : (
            <div className="text-center py-8 text-muted-foreground">
              <p className="text-3xl mb-3">📋</p>
              <p className="text-sm">לחץ על שירות לפרטים</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function Row({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  if (!value || value === " ") return null;
  return (
    <div className="flex items-center gap-2 text-sm">
      <span className="text-muted-foreground shrink-0">{icon}</span>
      <span className="text-muted-foreground shrink-0">{label}:</span>
      <span className="text-foreground truncate">{value}</span>
    </div>
  );
}
