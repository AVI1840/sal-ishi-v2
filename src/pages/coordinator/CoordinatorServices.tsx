/**
 * CoordinatorServices — קטלוג שירותים מנותח
 * ללא אימוגי. מקצועי. ממשלתי.
 * ניווט: קטגוריות, שכונות, מגזרים, מימדים
 */
import { useState, useMemo } from "react";
import { Search, MapPin, Phone, Clock, ExternalLink, ChevronDown, ChevronUp, Users, Heart, Activity, Laptop, Wrench, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { serviceCatalog, catalogAnalytics, type CatalogService, type ServiceDimensions } from "@/data/serviceCatalog";

// ─── Category icons (lucide, not emoji) ─────────────────────────

const CATEGORY_META: Record<number, { label: string; icon: typeof Heart; color: string }> = {
  1: { label: "שייכות ומשמעות", icon: Heart, color: "#3b82f6" },
  2: { label: "בריאות ותפקוד", icon: Activity, color: "#22c55e" },
  3: { label: "חוסן אישי", icon: Users, color: "#8b5cf6" },
  4: { label: "נגישות דיגיטלית", icon: Laptop, color: "#0ea5e9" },
  5: { label: "מוצרים מסייעים", icon: Wrench, color: "#f59e0b" },
};

const NEIGHBORHOODS = ["הכל", "פסגת זאב", "תלפיות מזרח", "תלפיות", "בית חנינא", "ואדי ג'וז", "נווה יעקב", "עין כרם", "רמות", "גילה", "קטמון", "עירוני"];
const SECTORS = [
  { value: "all", label: "כל המגזרים" },
  { value: "secular", label: "חילוני" },
  { value: "arab", label: "ערבי" },
  { value: "haredi", label: "חרדי" },
  { value: "mixed", label: "מעורב" },
];
const COST_OPTIONS = [
  { value: "all", label: "כל העלויות" },
  { value: "free", label: "חינם" },
  { value: "subsidized", label: "מסובסד" },
  { value: "paid", label: "בתשלום" },
];

const DIM_LABELS: Record<keyof ServiceDimensions, string> = {
  functional_fit: "מניעת הידרדרות",
  emotional_fit: "רגשי/חברתי",
  social_fit: "קבוצתי",
  accessibility_fit: "נגישות",
  urgency_fit: "דחיפות",
};

function DimensionBar({ label, value }: { label: string; value: number }) {
  const colors = ["", "bg-red-400", "bg-orange-400", "bg-yellow-400", "bg-emerald-400", "bg-emerald-600"];
  return (
    <div className="flex items-center gap-2">
      <span className="text-[10px] text-gray-500 w-20 shrink-0 text-left">{label}</span>
      <div className="flex gap-0.5 flex-1">
        {[1, 2, 3, 4, 5].map((n) => (
          <div key={n} className={cn("h-2 flex-1 rounded-sm", n <= value ? colors[value] : "bg-gray-100")} />
        ))}
      </div>
      <span className="text-[10px] text-gray-400 w-4 text-center">{value}</span>
    </div>
  );
}

function ServiceRow({ service, isSelected, onSelect }: { service: CatalogService; isSelected: boolean; onSelect: () => void }) {
  const cat = CATEGORY_META[service.category];
  const Icon = cat?.icon ?? Heart;

  return (
    <div className={cn("border rounded-lg transition-all", isSelected ? "border-[#1B3A5C] bg-[#1B3A5C]/[0.02]" : "border-gray-100 bg-white hover:border-gray-300")}>
      <button onClick={onSelect} className="w-full text-right p-4">
        <div className="flex items-start gap-3">
          {/* Category icon */}
          <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${cat?.color}10` }}>
            <Icon className="w-4 h-4" style={{ color: cat?.color }} />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <span className="text-sm font-semibold text-gray-900 leading-tight line-clamp-1">{service.name}</span>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={cn("text-[10px] px-2 py-0.5 rounded border font-medium",
                  service.cost === "free" ? "bg-emerald-50 text-emerald-700 border-emerald-200" :
                  service.cost === "subsidized" ? "bg-blue-50 text-blue-700 border-blue-200" :
                  "bg-gray-50 text-gray-500 border-gray-200"
                )}>
                  {service.cost === "free" ? "חינם" : service.cost === "subsidized" ? "מסובסד" : "בתשלום"}
                </span>
              </div>
            </div>
            <p className="text-xs text-gray-500 mt-0.5">{service.provider}</p>
            <div className="flex items-center gap-3 mt-1.5">
              <span className="flex items-center gap-1 text-[11px] text-gray-400">
                <MapPin className="w-3 h-3" /> {service.neighborhood}
              </span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-gray-50 text-gray-500 border border-gray-100">
                {cat?.label}
              </span>
              {service.sector === "arab" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-50 text-purple-600 border border-purple-100">ערבי</span>}
              {service.sector === "haredi" && <span className="text-[10px] px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-600 border border-indigo-100">חרדי</span>}
            </div>
          </div>

          <ChevronDown className={cn("w-4 h-4 text-gray-400 shrink-0 mt-1 transition-transform", isSelected && "rotate-180")} />
        </div>
      </button>

      {/* Expanded */}
      {isSelected && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 space-y-4">
          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {service.address && (
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-xs">{service.address}</span>
              </div>
            )}
            {service.days && (
              <div className="flex items-start gap-2 text-gray-600">
                <Clock className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-xs">{service.days} {service.hours && `· ${service.hours}`}</span>
              </div>
            )}
            {service.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <a href={`tel:${service.phone}`} className="text-xs text-[#1B3A5C] hover:underline">{service.phone}</a>
              </div>
            )}
            {service.website && (
              <div className="flex items-center gap-2 text-gray-600">
                <ExternalLink className="w-3.5 h-3.5 text-gray-400 shrink-0" />
                <a href={`https://${service.website}`} target="_blank" rel="noopener noreferrer" className="text-xs text-[#1B3A5C] hover:underline truncate">{service.website}</a>
              </div>
            )}
          </div>

          {/* Dimensions */}
          <div>
            <p className="text-[10px] font-semibold text-gray-700 uppercase tracking-wider mb-2">מימדי התאמה</p>
            <div className="space-y-1.5">
              {(Object.keys(DIM_LABELS) as (keyof ServiceDimensions)[]).map((dim) => (
                <DimensionBar key={dim} label={DIM_LABELS[dim]} value={service.dimensions[dim]} />
              ))}
            </div>
          </div>

          {/* Tags */}
          <div className="flex items-center gap-2 flex-wrap">
            {service.languages.map((lang) => (
              <span key={lang} className="text-[10px] px-2 py-1 rounded bg-gray-50 border border-gray-200 text-gray-600">
                {lang === "hebrew" ? "עברית" : lang === "arabic" ? "ערבית" : lang === "russian" ? "רוסית" : lang === "english" ? "אנגלית" : lang === "yiddish" ? "יידיש" : lang}
              </span>
            ))}
            {service.accessibility.map((a) => (
              <span key={a} className="text-[10px] px-2 py-1 rounded bg-teal-50 border border-teal-200 text-teal-700">
                {a === "wheelchair" ? "נגיש כיסא" : a === "transport" ? "הסעות" : a === "home_visit" ? "ביקור בית" : a === "remote" ? "מרחוק" : a}
              </span>
            ))}
            {service.pilotGoalsServed.map((g) => (
              <span key={g} className="text-[10px] px-2 py-1 rounded bg-[#1B3A5C]/5 border border-[#1B3A5C]/10 text-[#1B3A5C]">
                G{g}
              </span>
            ))}
          </div>

          {/* Notes */}
          {service.notes && (
            <p className="text-xs text-gray-500 p-2 bg-gray-50 rounded border border-gray-100">{service.notes}</p>
          )}
          {service.cost_note && (
            <p className="text-xs text-gray-600"><span className="font-medium">עלות:</span> {service.cost_note}</p>
          )}
        </div>
      )}
    </div>
  );
}

export default function CoordinatorServices() {
  const [query, setQuery] = useState("");
  const [neighborhood, setNeighborhood] = useState("הכל");
  const [category, setCategory] = useState(0);
  const [sector, setSector] = useState("all");
  const [cost, setCost] = useState("all");
  const [selected, setSelected] = useState<string | null>(null);
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(() => {
    let list = serviceCatalog;
    if (neighborhood !== "הכל") list = list.filter(s => s.neighborhood === neighborhood);
    if (category !== 0) list = list.filter(s => s.category === category);
    if (sector !== "all") list = list.filter(s => s.sector === sector);
    if (cost !== "all") list = list.filter(s => s.cost === cost);
    if (query.trim()) {
      const q = query.trim().toLowerCase();
      list = list.filter(s => s.name.includes(q) || s.provider.includes(q) || s.subcategory.includes(q) || s.notes.includes(q));
    }
    return list;
  }, [query, neighborhood, category, sector, cost]);

  return (
    <div className="space-y-6" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-xl font-bold text-gray-900">קטלוג שירותים</h1>
        <p className="text-sm text-gray-500 mt-0.5">{catalogAnalytics.total} שירותים ממופים · 5 שכונות · ניתוח מימדי</p>
      </div>

      {/* Category navigation */}
      <div className="grid grid-cols-5 gap-2">
        {([1, 2, 3, 4, 5] as const).map((cat) => {
          const meta = CATEGORY_META[cat];
          const Icon = meta.icon;
          const count = serviceCatalog.filter(s => s.category === cat).length;
          const isActive = category === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategory(isActive ? 0 : cat)}
              className={cn(
                "flex flex-col items-center gap-2 p-4 rounded-xl border transition-all",
                isActive ? "border-[#1B3A5C] bg-[#1B3A5C]/5" : "border-gray-100 bg-white hover:border-gray-300"
              )}
            >
              <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: `${meta.color}15` }}>
                <Icon className="w-5 h-5" style={{ color: meta.color }} />
              </div>
              <span className="text-2xl font-bold text-gray-900">{count}</span>
              <span className="text-[10px] text-gray-500 text-center leading-tight">{meta.label}</span>
            </button>
          );
        })}
      </div>

      {/* Dimension averages */}
      <div className="bg-white border border-gray-100 rounded-xl p-4">
        <p className="text-xs font-semibold text-gray-700 mb-3">ממוצע מימדים — כלל הקטלוג</p>
        <div className="grid grid-cols-5 gap-4">
          {(Object.keys(DIM_LABELS) as (keyof ServiceDimensions)[]).map((dim) => (
            <div key={dim} className="text-center">
              <div className="text-lg font-bold text-[#1B3A5C]">{catalogAnalytics.avgDimensions[dim]}</div>
              <div className="text-[10px] text-gray-500 mt-0.5">{DIM_LABELS[dim]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Search + Filters */}
      <div className="space-y-3">
        <div className="flex gap-2">
          <div className="relative flex-1">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="חיפוש שם, ספק, שכונה..."
              className="w-full h-10 pr-10 pl-4 rounded-lg border border-gray-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20"
              dir="rtl"
            />
          </div>
          <button
            onClick={() => setShowFilters(!showFilters)}
            className={cn("h-10 px-4 rounded-lg border text-sm font-medium flex items-center gap-2 transition-colors",
              showFilters ? "bg-[#1B3A5C] text-white border-[#1B3A5C]" : "bg-white text-gray-600 border-gray-200 hover:border-gray-400"
            )}
          >
            <Filter className="w-4 h-4" />
            סינון
          </button>
        </div>

        {showFilters && (
          <div className="bg-white border border-gray-200 rounded-xl p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">שכונה</label>
              <select value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" dir="rtl">
                {NEIGHBORHOODS.map(n => <option key={n} value={n}>{n}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">מגזר</label>
              <select value={sector} onChange={(e) => setSector(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" dir="rtl">
                {SECTORS.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium text-gray-700 mb-1.5 block">עלות</label>
              <select value={cost} onChange={(e) => setCost(e.target.value)} className="w-full h-9 px-3 rounded-lg border border-gray-200 text-sm" dir="rtl">
                {COST_OPTIONS.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
              </select>
            </div>
          </div>
        )}

        <p className="text-xs text-gray-400">{results.length} תוצאות</p>
      </div>

      {/* Results */}
      <div className="space-y-2 max-h-[60vh] overflow-y-auto">
        {results.length === 0 ? (
          <div className="text-center py-12">
            <Search className="w-8 h-8 text-gray-300 mx-auto mb-3" />
            <p className="text-sm text-gray-500">לא נמצאו שירותים</p>
          </div>
        ) : (
          results.map((service) => (
            <ServiceRow
              key={service.id}
              service={service}
              isSelected={selected === service.id}
              onSelect={() => setSelected(selected === service.id ? null : service.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}
