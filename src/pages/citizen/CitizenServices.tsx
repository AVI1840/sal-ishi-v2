/**
 * CitizenServices: הקטלוג המאושר לשכונה (מהאטלס), עם חיפוש חכם והצעות לפי תחום.
 */
import { useState, useMemo } from "react";
import { Search, MapPin, Phone, Clock, Filter, ChevronLeft, ChevronDown, ChevronUp, Sparkles, TrendingUp, Award, Globe2, UserCheck } from "lucide-react";
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  filterServices, NEIGHBORHOODS_LIST, CATEGORY_FILTERS, COST_FILTERS,
  type CostType, type RealService,
} from "@/data/realServices";
import { getServiceImageInfo } from "@/lib/serviceImages";
import { useShowImages } from "@/hooks/use-visual-mode";
import { SubsidyBadge } from "@/components/shared/SubsidyBadge";
import { CITIZENS } from "@/data/mockData";
import { catalogState } from "@/data/catalogSource";
import { DEMAND_LABEL, REACH_LABEL, selectionRules, suggestByDomain } from "@/lib/suggestions";
import { needsCompanion, termLines } from "@/lib/serviceTerms";
import { usePilot } from "@/pilot/store";
import { he } from "@/pilot/i18n/he";

// Cost badge is now rendered by SubsidyBadge component

const MOBILITY_HE: Record<string, string> = {
  independent: "עצמאי", "frail-light": "תפקוד נמוך-קל",
  frail: "תפקוד נמוך", homebound: "מרותק בית", any: "כולם",
};

function ServiceRow({ service }: { service: RealService }) {
  const [expanded, setExpanded] = useState(false);
  const showImages = useShowImages();
  const { image, gradient } = showImages
    ? getServiceImageInfo(service)
    : { image: undefined, gradient: "" };
  // גוונים כהים מספיק לטקסט לבן (ניגודיות 4.5:1 לפחות).
  const scoreBg = service.match_score >= 80 ? "#15803d" : service.match_score >= 60 ? "#b45309" : "#4b5563";

  return (
    <div className="bg-white border border-gray-100 rounded-xl overflow-hidden hover:border-[#1B3A5C]/20 transition-colors">
      {/* Main row */}
      <div className="p-4">
        <div className="flex items-start gap-3">
          {/* Thumbnail (images mode) or score circle (clean mode) */}
          {showImages ? (
            <div className="relative shrink-0 w-12 h-12 rounded-lg overflow-hidden">
              {image ? (
                <img src={image} alt={service.categoryLabel} className="w-full h-full object-cover" loading="lazy" />
              ) : (
                <div className={cn("w-full h-full", gradient)} />
              )}
              <div
                className="absolute bottom-0 right-0 left-0 text-center py-0.5 text-[10px] font-bold text-white"
                style={{ backgroundColor: scoreBg }}
              >
                {service.match_score}
              </div>
            </div>
          ) : (
            /* Original score circle */
            <div className="shrink-0 w-10 h-10 rounded-full border-2 flex items-center justify-center text-xs font-bold"
              style={{ borderColor: scoreBg, color: scoreBg }}>
              {service.match_score}
            </div>
          )}

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
                <SubsidyBadge cost={service.cost} />
              </div>
            </div>

            <p className="text-xs text-gray-600 mt-0.5 line-clamp-1">{service.provider}</p>
            <AtlasBadges service={service} />

            <div className="flex items-center gap-3 mt-2 flex-wrap">
              <span className="flex items-center gap-1 text-xs text-gray-600">
                <MapPin className="w-3 h-3" aria-hidden="true" /> {service.neighborhood}
              </span>
              {service.days && (
                <span className="flex items-center gap-1 text-xs text-gray-600">
                  <Clock className="w-3 h-3" aria-hidden="true" /> {service.days}
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
            className="shrink-0 w-11 h-11 rounded-lg bg-gray-50 flex items-center justify-center hover:bg-gray-100 transition-colors"
            aria-label={expanded ? `כיווץ הפרטים של ${service.name}` : `הרחבת הפרטים של ${service.name}`}
            aria-expanded={expanded}
          >
            {expanded ? <ChevronUp className="w-4 h-4 text-gray-600" aria-hidden="true" /> : <ChevronDown className="w-4 h-4 text-gray-600" aria-hidden="true" />}
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
          {termLines(service).map((t) => (
            <p key={t.term} className="text-xs text-gray-600"><span className="font-medium">{t.term}:</span> {t.text}</p>
          ))}
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs px-2 py-1 rounded-md bg-white border border-gray-200 text-gray-600">
              {service.categoryLabel}
            </span>
            {service.accessibility.map((a) => (
              <span key={a} className="text-xs px-2 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-700">
                {a === "wheelchair" ? "נגיש" : a === "transport" ? "הסעות" : a === "home_visit" ? "ביקור בית" : a === "remote" ? "מרחוק" : a}
              </span>
            ))}
            {service.languages.filter(l => l !== "hebrew").map((lang) => (
              <span key={lang} className="text-xs px-2 py-1 rounded-md bg-purple-50 border border-purple-200 text-purple-700">
                {lang === "arabic" ? "ערבית" : lang === "russian" ? "רוסית" : lang === "english" ? "אנגלית" : lang === "yiddish" ? "יידיש" : lang}
              </span>
            ))}
            <span className="text-xs px-2 py-1 rounded-md bg-gray-100 text-gray-700 mr-auto">
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

/** היקף, ביקוש ודירוג ספק, מהאטלס. טקסט וסמל, לא רק צבע. */
function AtlasBadges({ service }: { service: RealService }) {
  const reach = service.reach && service.reach !== "neighborhood" ? REACH_LABEL[service.reach] : null;
  const demand = service.demand ? DEMAND_LABEL[service.demand] : null;
  const gated = needsCompanion(service);
  if (!reach && !demand && !service.supplierScore && !gated) return null;
  return (
    <div className="flex flex-wrap gap-1.5 mt-1.5">
      {reach && (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-sky-50 border border-sky-300 text-sky-900">
          <Globe2 className="w-3 h-3" aria-hidden="true" /> {reach}
        </span>
      )}
      {gated && (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-violet-50 border border-violet-300 text-violet-900">
          <UserCheck className="w-3 h-3" aria-hidden="true" /> דרך המלווה
        </span>
      )}
      {demand && (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 border border-emerald-300 text-emerald-900">
          <TrendingUp className="w-3 h-3" aria-hidden="true" /> {demand}
        </span>
      )}
      {service.supplierScore ? (
        <span className="inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full bg-amber-50 border border-amber-300 text-amber-900">
          <Award className="w-3 h-3" aria-hidden="true" /> דירוג ספק {service.supplierScore.toFixed(1)} מתוך 5
        </span>
      ) : null}
    </div>
  );
}

// ההסברים של מנוע ההתאמה כתובים עם קו מפריד ארוך. בתצוגה מחליפים אותו בנקודתיים.
const LONG_DASH = String.fromCharCode(0x2014);
const plainDash = (text: string) => text.split(LONG_DASH).map((t) => t.trim()).join(": ");

/** הצעות לפי תחום, מתוך מנוע ההתאמה הקיים. */
function DomainSuggestions({ neighborhood }: { neighborhood: string }) {
  const citizen = CITIZENS[0];
  const rules = selectionRules();
  // בלי בחירת שכונה, ההצעות הן לשכונה של האזרח (אם היא בקטלוג).
  const home = NEIGHBORHOODS_LIST.includes(citizen.neighborhood) ? citizen.neighborhood : undefined;
  const target = neighborhood === "הכל" ? home : neighborhood;
  const domains = useMemo(() => suggestByDomain(citizen, target), [citizen, target]);
  if (!domains.length) return null;
  return (
    <section aria-labelledby="sugg-h" className="space-y-3">
      <div>
        <h2 id="sugg-h" className="text-base font-bold text-gray-900 flex items-center gap-1.5">
          <Sparkles className="w-4 h-4 text-[#1B3A5C]" aria-hidden="true" /> הצעות בשבילך לפי תחום{target ? `, ${target}` : ""}
        </h2>
        <p className="text-xs text-gray-600 mt-0.5">
          לפי מנוע ההתאמה, עם הסבר קצר. מומלץ לבחור לפחות {rules.minPerDomain} מכל תחום ועד {rules.maxActive} שירותים במקביל, עם אפשרות החלפה כל {rules.changeMonths === 1 ? "חודש" : `${rules.changeMonths} חודשים`}
          {rules.isProposal ? " (הצעה, ממתין להכרעה)" : ""}.
        </p>
      </div>
      {domains.map((d) => (
        <div key={d.domainId} className="bg-white border border-gray-200 rounded-xl p-3">
          <h3 className="text-sm font-semibold text-gray-900 mb-2">{d.domainName}</h3>
          <ul className="space-y-2">
            {d.items.map(({ service, result }) => (
              <li key={service.id} className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <Link to={`/citizen/services/${service.id}`} className="text-sm font-medium text-[#1B3A5C] hover:underline">
                    {service.name}
                  </Link>
                  <p className="text-xs text-gray-600">{plainDash(result.explanations[0] ?? service.subcategory)}</p>
                  {needsCompanion(service) && <p className="text-xs text-violet-900">נפתח באישור המלווה</p>}
                </div>
                <span className="shrink-0 text-xs font-bold text-gray-700" aria-label={`התאמה ${Math.round(result.totalScore)} מתוך 100`}>
                  {Math.round(result.totalScore)}
                </span>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </section>
  );
}

export default function CitizenServices() {
  const [query, setQuery] = useState("");
  const [neighborhood, setNeighborhood] = useState("הכל");
  const [category, setCategory] = useState(0);
  const [cost, setCost] = useState<CostType | "all">("all");
  const [showFilters, setShowFilters] = useState(false);
  const showImages = useShowImages();
  const { simulation } = usePilot().state;

  const results = useMemo(
    () => filterServices({ neighborhood, category, cost, query }),
    [query, neighborhood, category, cost]
  );

  const freeCount = results.filter(s => s.cost === "free").length;

  if (simulation.noServices) {
    return (
      <div className="px-6 pt-16 pb-6 space-y-3" dir="rtl">
        <h1 className="text-2xl font-bold text-gray-900">{he.noServicesTitle}</h1>
        <p className="text-base text-gray-800">{he.noServicesText}</p>
      </div>
    );
  }

  return (
    <div className="px-4 pt-5 pb-6 space-y-4" dir="rtl">

      {/* Header */}
      <div>
        <h1 className="text-lg font-bold text-gray-900">שירותים זמינים</h1>
        <p className="text-xs text-gray-600 mt-0.5" role="status" aria-live="polite">
          {results.length} שירותים · {freeCount} בלי השתתפות עצמית
          {neighborhood !== "הכל" && ` · ${neighborhood}`}
        </p>
        <p className="text-[11px] text-gray-600 mt-0.5">
          {catalogState.origin === "published" ? "מהקטלוג המאושר של הרשות" : "קטלוג הדגמה סינתטי מהאטלס"}
        </p>
      </div>

      {/* Search */}
      <div className="relative">
        <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" aria-hidden="true" />
        <input
          type="search"
          aria-label="חיפוש שירות"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="למשל: ספורט, זיכרון, סמארטפון, מועדון"
          className="w-full h-11 pr-10 pl-12 rounded-xl border border-gray-300 bg-white text-sm placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/20 focus:border-[#1B3A5C]/40"
          dir="rtl"
        />
        <button
          onClick={() => setShowFilters(!showFilters)}
          aria-expanded={showFilters}
          className={cn(
            "absolute left-2 top-1/2 -translate-y-1/2 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-colors",
            showFilters ? "bg-[#1B3A5C] text-white" : "bg-gray-100 text-gray-700 hover:bg-gray-200"
          )}
        >
          <Filter className="w-3.5 h-3.5" />
          {showFilters ? "סגור" : "סינון"}
        </button>
      </div>

      {!query.trim() && category === 0 && cost === "all" && <DomainSuggestions neighborhood={neighborhood} />}

      {/* Category chips */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {CATEGORY_FILTERS.map((cat) => (
          <button
            key={cat.value}
            onClick={() => setCategory(cat.value)}
            aria-pressed={category === cat.value}
            className={cn(
              "px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all border shrink-0",
              category === cat.value
                ? "bg-[#1B3A5C] text-white border-[#1B3A5C]"
                : "bg-white text-gray-700 border-gray-300 hover:border-[#1B3A5C]/30"
            )}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Category banner - only in image mode */}
      {showImages && category !== 0 && (() => {
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
                      : "bg-white text-gray-700 border-gray-300 hover:border-[#1B3A5C]/30"
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
                      : "bg-white text-gray-700 border-gray-300 hover:border-[#1B3A5C]/30"
                  )}
                >
                  {c.label}
                </button>
              ))}
            </div>
          </div>
          <button
            onClick={() => { setQuery(""); setNeighborhood("הכל"); setCategory(0); setCost("all"); }}
            className="text-xs text-gray-700 hover:text-gray-900 underline min-h-11"
          >
            נקה סינון
          </button>
        </div>
      )}

      {/* Results */}
      {results.length === 0 ? (
        <div className="text-center py-16">
          <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mx-auto mb-3">
            <Search className="w-5 h-5 text-gray-600" aria-hidden="true" />
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
