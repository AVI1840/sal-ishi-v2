/**
 * CitizenServices — רשימת שירותים מלאה
 * 102 שירותים אמיתיים · סינון + חיפוש · עיצוב מקצועי
 */
import { useState, useMemo } from "react";
import { Search, MapPin, Phone, Clock, Filter, ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  filterServices, NEIGHBORHOODS_LIST, CATEGORY_FILTERS, COST_FILTERS,
  type CostType, type RealService,
} from "@/data/realServices";
import { getServiceImageInfo } from "@/lib/serviceImages";

const COST_BADGE: Record<string, { label: string; cls: string }> = {
  free:       { label: "חינם",     cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  subsidized: { label: "מסובסד",   cls: "bg-blue-50 text-blue-700 border-blue-200" },
  paid:       { label: "בתשלום",   cls: "bg-gray-50 text-gray-500 border-gray-200" },
};

const MOBILITY_HE: Record<string, string> = {
  independent: "עצמאי", "frail-light": "תפקוד נמוך-קל",
  frail: "תפקוד נמוך", homebound: "מרותק בית", any: "כולם",
};

function ServiceRow({ service }: { service: RealService }) {
  const [expanded, setExpanded] = useState(false);
  const badge = COST_BADGE[service.cost];
  const { image, gradient } = getServiceImageInfo(service);
  const scoreBg = service.match_score >= 80 ? "#16a34a" : service.match_score >= 60 ? "#d97706" : "#6b7280";

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-[#1B3A5C]/20 transition-colors">
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Thumbnail 48×48 with score strip — image or gradient fallback */}
          <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden">
            {image ? (
              <img src={image} alt={service.categoryLabel} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className={cn("w-full h-full", gradient)} />
            )}
            <div
              className="absolute bottom-0 right-0 left-0 text-center py-0.5 text-[9px] font-bold text-white"
              style={{ backgroundColor: scoreBg }}
            >
              {service.match_score}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <Link
                to={`/citizen/services/${service.id}`}
                className="text-sm font-semibold text-gray-900 hover:text-[#1B3A5C] leading-tight line-clamp-1 transition-colors"
              >
                {service.name}
              </Link>
              <div className="flex items-center gap-1.5 shrink-0">
                <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", badge.cls)}>
                  {badge.label}
                </span>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{service.provider}</p>

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-gray-400">
                <MapPin className="w-3 h-3" /> {service.neighborhood}
              </span>
              {service.days && (
                <span className="flex items-center gap-1 text-xs text-gray-400">
                  <Clock className="w-3 h-3" /> {service.days}
                  {service.hours && ` · ${service.hours}`}
                </span>
              )}
              {service.phone && (
                <a href={`tel:${service.phone}`} className="flex items-center gap-1 text-xs text-[#1B3A5C] hover:underline">
                  <Phone className="w-3 h-3" /> {service.phone}
                </a>
              )}
            </div>
          </div>

          {/* Expand */}
          <button
            onClick={() => setExpanded(!expanded)}
            className="shrink-0 w-7 h-7 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label={expanded ? "כווץ" : "הרחב"}
          >
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
          </button>
        </div>
      </div>

      {/* Expanded details */}
      {expanded && (
        <div className="border-t border-gray-100 px-4 pb-4 pt-3 bg-gray-50/50 space-y-3">
          {service.cost_note && (
            <p className="text-xs text-gray-600"><span className="font-medium">עלות:</span> {service.cost_note}</p>
          )}
          {service.notes && (
            <p className="text-xs text-gray-600"><span className="font-medium">הערות:</span> {service.notes}</p>
          )}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-600">
              {service.categoryLabel}
            </span>
            {service.accessibility.map((a) => (
              <span key={a} className="text-xs px-2 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-700">
                {a === "wheelchair" ? "♿ נגיש" : a === "transport" ? "הסעות" : a === "home_visit" ? "ביקור בית" : a === "remote" ? "מרחוק" : a}
              </span>
            ))}
            {service.languages.filter(l => l !== "hebrew").map((lang) => (
              <span key={lang} className="text-xs px-2 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-700">
                {lang === "arabic" ? "ערבית" : lang === "russian" ? "רוסית" : lang === "english" ? "אנגלית" : lang === "yiddish" ? "יידיש" : lang}
              </span>
            ))}
            <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-500 mr-auto">
              {MOBILITY_HE[service.target_mobility] ?? service.target_mobility}
            </span>
          </div>
          <Link
            to={`/citizen/services/${service.id}`}
            className="inline-flex items-center gap-1 text-xs text-[#1B3A5C] font-semibold hover:underline"
          >
            פרטים מלאים ובקשת הצטרפות <ChevronLeft className="w-3 h-3" />
          </Link>
        </div>
      )}
    </div>
  );
}

export default function CitizenServices() {
  const [query, setQuery] = useState("");
  const [neighborhood, setNeighborhood] = useState("הכל");
  const [category, setCategory] = useState(0);
  const [cost, setCost] = useState<CostType | "all">("all");
  const [showFilters, setShowFilters] = useState(false);

  const results = useMemo(
    () => filterServices({ neighborhood, category, cost, query }),
    [query, neighborhood, category, cost]
  );

  const freeCount = results.filter(s => s.cost === "free").length;

  return (
    <div className="px-4 pt-5 pb-24 space-y-4" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">שירותים זמינים</h1>
        <p className="text-xs text-gray-500 mt-0.5">
          {results.length} שירותים · {freeCount} חינם
          {neighborhood !== "הכל" && ` · ${neighborhood}`}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="חיפוש שם שירות, ספק, שכונה..."
          className="w-full h-11 pr-10 pl-12 rounded-xl border border-gray-200 bg-white text-sm placeholder:text-gray-400 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C]/40"
          dir="rtl"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
            showFilters ? "bg-[#1B3A5C] text-white" : "bg-gray-100 text-gray-500 hover:bg-gray-200"
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          {showFilters ? "סגור" : "סינון"}
        </button>
      </div>

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border shrink-0",
              category === cat.value
                ? "bg-[#1B3A5C] text-white border-[#1B3A5C]"
                : "bg-white text-gray-600 border-gray-200 hover:border-[#1B3A5C]/30"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Category banner — image or gradient, shown when category selected */}
      {category !== 0 && (() => {
        const { image, gradientDark } = getServiceImageInfo({ category, name: "" });
        const catLabel = CATEGORY_FILTERS.find(c => c.value === category)?.label ?? "";
        return (
          <div className="relative rounded-xl overflow-hidden h-28">
            {image ? (
              <img src={image} alt={catLabel} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className={cn("w-full h-full", gradientDark)} />
            )}
            <div className="absolute inset-0 bg-gradient-to-l from-[#1B3A5C]/80 via-[#1B3A5C]/30 to-transparent" />
            <div className="absolute inset-0 flex items-center justify-end pr-5">
              <div>
                <p className="text-white font-bold text-base">{catLabel}</p>
                <p className="text-white/60 text-xs mt-0.5">
                  {results.length} שירותים · {results.filter(s => s.cost === "free").length} חינם
                </p>
              </div>
            </div>
          </div>
        );
      })()}

      {/* Filters panel */}
      {showFilters && (
        <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-4">
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">שכונה</p>
            <div className="flex gap-1.5 overflow-x-auto pb-1">
              {NEIGHBORHOODS_LIST.map((n) => (
                <button
                  key={n}
                  onClick={() => setNeighborhood(n)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-xs whitespace-nowrap border transition-colors shrink-0",
                    neighborhood === n
                      ? "bg-[#1B3A5C] text-white border-[#1B3A5C]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#1B3A5C]/30"
                  )}
                >
                  {n}
                </button>
              ))}
            </div>
          </div>
          <div>
            <p className="text-xs font-semibold text-gray-700 mb-2">עלות</p>
            <div className="flex gap-2 flex-wrap">
              {COST_FILTERS.map((c) => (
                <button
                  key={c.value}
                  onClick={() => setCost(c.value)}
                  className={cn(
                    "px-3 py-1.5 rounded-lg text-xs border transition-colors",
                    cost === c.value
                      ? "bg-[#1B3A5C] text-white border-[#1B3A5C]"
                      : "bg-white text-gray-600 border-gray-200 hover:border-[#1B3A5C]/30"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => { setQuery(""); setNeighborhood("הכל"); setCategory(0); setCost("all"); }}
            className="text-xs text-gray-400 hover:text-gray-600 underline"
          >
            נקה סינון
          </button>
        </div>
      )}

      {/* Results */}
      {results.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <p className="text-sm font-medium text-gray-600">לא נמצאו שירותים</p>
          <button
            onClick={() => { setQuery(""); setNeighborhood("הכל"); setCategory(0); setCost("all"); }}
            className="mt-2 text-xs text-[#1B3A5C] underline"
          >
            נקה חיפוש
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          {results.map((service) => (
            <ServiceRow key={service.id} service={service} />
          ))}
        </div>
      )}
    </div>
  );
}
