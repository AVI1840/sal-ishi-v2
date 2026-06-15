/**
 * CitizenServiceDetail — דף שירות בודד
 * שירות אמיתי מהקטלוג · דירוג · הזמנה
 * ללא אימוגי — מקצועי
 */
import { useParams, Link } from "react-router-dom";
import { useMemo } from "react";
import { getServiceImageInfo } from "@/lib/serviceImages";
import { useShowImages } from "@/hooks/use-visual-mode";
import { ArrowRight, MapPin, Clock, Phone, Globe, AlertCircle, CheckCircle, Heart, Activity, Users, Laptop, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { realServices } from "@/data/realServices";
import { serviceCatalog } from "@/data/serviceCatalog";
import { matchServicesForCitizen } from "@/lib/matchingEngine";
import { CITIZENS } from "@/data/mockData";
import { MatchExplainability } from "@/components/shared/MatchExplainability";
import { SubsidyBadge } from "@/components/shared/SubsidyBadge";
import ServiceRating from "@/components/shared/ServiceRating";
import { toast } from "sonner";

const COST_MAP: Record<string, { label: string; cls: string }> = {
  free:       { label: "חינם — סבסוד מלא",   cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  subsidized: { label: "מסובסד (גמלת סיעוד)", cls: "bg-blue-50 text-blue-700 border-blue-200" },
  paid:       { label: "בתשלום",               cls: "bg-gray-50 text-gray-600 border-gray-200" },
};

const LANG_MAP: Record<string, string> = {
  hebrew: "עברית", arabic: "ערבית", russian: "רוסית", english: "אנגלית",
  yiddish: "יידיש", amharic: "אמהרית", french: "צרפתית", bukharian: "בוכרית",
};

const ACCESS_MAP: Record<string, string> = {
  wheelchair: "נגיש לכיסא גלגלים", transport: "הסעות", home_visit: "ביקורי בית",
  remote: "מרחוק / דיגיטלי", elevator: "מעלית", parking: "חניה", emergency_button: "כפתור חירום",
};

const CERTAINTY_MAP: Record<string, { label: string; cls: string }> = {
  high:   { label: "מאומת",        cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  medium: { label: "מאומת חלקית",  cls: "bg-amber-50 text-amber-700 border-amber-200" },
  low:    { label: "דורש אימות",   cls: "bg-gray-50 text-gray-500 border-gray-200" },
};

const CATEGORY_ICON: Record<number, typeof Heart> = {
  1: Heart, 2: Activity, 3: Users, 4: Laptop, 5: Wrench,
};

export default function CitizenServiceDetail() {
  const { id } = useParams();
  const service = realServices.find((s) => s.id === id) ?? realServices[0];
  const catalogEntry = serviceCatalog.find((s) => s.id === id);
  const costInfo = COST_MAP[service.cost];

  // Personalized match result for שרה כהן (citizen[0])
  const citizen = CITIZENS[0];
  const matchResult = useMemo(() => {
    const all = matchServicesForCitizen(citizen, { topN: 102, minScore: 0 });
    return all.find((r) => r.service.id === id) ?? null;
  }, [id, citizen]);
  const certaintyInfo = CERTAINTY_MAP[service.certainty];
  const Icon = CATEGORY_ICON[service.category] ?? Heart;
  const imgInfo = getServiceImageInfo(service);
  const showImages = useShowImages();

  const handleBook = () => {
    toast.success(`${service.name} — הבקשה נשלחה`, {
      description: "המלווה שלך תיצור קשר לתיאום",
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-28" dir="rtl">

      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-200 px-5 h-14 flex items-center gap-3">
        <Link to="/citizen/services" className="w-8 h-8 rounded-lg bg-gray-50 border border-gray-200 flex items-center justify-center" aria-label="חזרה">
          <ArrowRight className="w-4 h-4 text-gray-500" />
        </Link>
        <h1 className="text-sm font-bold text-gray-900 flex-1 line-clamp-1">{service.name}</h1>
        <SubsidyBadge cost={service.cost} />
      </header>

      <main className="px-5 pt-5 space-y-4 max-w-3xl mx-auto">

        {/* Hero — image mode: h-48 photo / clean mode: original blue card */}
        {showImages ? (
          <div className="relative h-48 rounded-xl overflow-hidden">
            {imgInfo.image ? (
              <img src={imgInfo.image} alt={service.name} className="w-full h-full object-cover" loading="lazy" />
            ) : (
              <div className={cn("w-full h-full", imgInfo.gradientDark)} />
            )}
            <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
            <div className="absolute bottom-0 right-0 left-0 p-5 flex items-end justify-between gap-3">
              <div>
                <h2 className="text-xl font-bold text-white drop-shadow leading-tight">{service.name}</h2>
                <p className="text-sm text-white/75 mt-1">{service.provider}</p>
              </div>
              <div className="w-11 h-11 rounded-xl bg-white/15 backdrop-blur border border-white/20 flex items-center justify-center shrink-0">
                <Icon className="w-5 h-5 text-white" />
              </div>
            </div>
            <div className="absolute top-3 right-3">
              <span className="text-[10px] px-2 py-1 rounded-lg bg-black/30 backdrop-blur text-white/80 font-medium">
                {service.categoryLabel}
              </span>
            </div>
          </div>
        ) : (
          /* Original clean hero card */
          <div className="bg-[#1B3A5C] rounded-xl p-6 text-white">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                <Icon className="w-6 h-6" />
              </div>
              <div>
                <h2 className="text-lg font-bold">{service.name}</h2>
                <p className="text-sm text-white/70 mt-0.5">{service.provider}</p>
                <p className="text-xs text-white/40 mt-1">{service.categoryLabel}</p>
              </div>
            </div>
          </div>
        )}

        {/* Cost */}
        <div className={cn("p-4 rounded-xl border", costInfo.cls)}>
          <p className="text-sm font-semibold">{costInfo.label}</p>
          {service.cost_note && <p className="text-xs mt-0.5 opacity-70">{service.cost_note}</p>}
        </div>

        {/* Details */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 space-y-3">
          {service.address && (
            <div className="flex items-start gap-2.5">
              <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div><p className="text-xs text-gray-400">כתובת</p><p className="text-sm text-gray-800">{service.address}</p></div>
            </div>
          )}
          {service.days && (
            <div className="flex items-start gap-2.5">
              <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div><p className="text-xs text-gray-400">ימים ושעות</p><p className="text-sm text-gray-800">{service.days}{service.hours && ` · ${service.hours}`}</p></div>
            </div>
          )}
          {service.phone && (
            <div className="flex items-start gap-2.5">
              <Phone className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div><p className="text-xs text-gray-400">טלפון</p><a href={`tel:${service.phone}`} className="text-sm text-[#1B3A5C] hover:underline">{service.phone}</a></div>
            </div>
          )}
          {service.website && (
            <div className="flex items-start gap-2.5">
              <Globe className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
              <div><p className="text-xs text-gray-400">אתר</p><a href={`https://${service.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#1B3A5C] hover:underline">{service.website}</a></div>
            </div>
          )}
        </div>

        {/* Personal match — hook + expandable "למה?" with 5 layers */}
        <div className="bg-white rounded-xl p-5 border border-gray-100 space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-sm font-semibold text-gray-900">למה זה מומלץ עבורך</p>
            <span className={cn("text-xs px-2 py-0.5 rounded border font-medium", certaintyInfo.cls)}>{certaintyInfo.label}</span>
          </div>
          {matchResult ? (
            <MatchExplainability result={matchResult} />
          ) : (
            <div className="space-y-3">
              <div className="flex items-center gap-3 p-3 rounded-lg bg-[#1B3A5C]/5 border border-[#1B3A5C]/10">
                <div className="text-2xl font-bold text-[#1B3A5C]">{service.match_score}</div>
                <div>
                  <p className="text-sm text-gray-700">{service.match_score >= 80 ? "התאמה גבוהה לפרופיל שלך" : "התאמה טובה"}</p>
                  <p className="text-xs text-gray-400 mt-0.5">מבוסס על אלגוריתם 5 שכבות</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
                  <span>מאושר על ידי מלווה</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Clock className="w-3.5 h-3.5 text-gray-400" />
                  <span>עודכן לפני 7 ימים</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Globe className="w-3.5 h-3.5 text-blue-400" />
                  <span>מאומת מול עיריית ירושלים</span>
                </div>
                <div className="flex items-center gap-1.5 text-xs text-gray-500">
                  <Activity className="w-3.5 h-3.5 text-[#1B3A5C]" />
                  <span>רמת ביטחון: {service.match_score}%</span>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Languages */}
        {service.languages.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">שפות השירות</p>
            <div className="flex flex-wrap gap-2">
              {service.languages.map((lang) => (
                <span key={lang} className="text-xs px-2.5 py-1 rounded-md bg-gray-50 border border-gray-200 text-gray-700">
                  {LANG_MAP[lang] ?? lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Accessibility */}
        {service.accessibility.length > 0 && (
          <div className="bg-white rounded-xl p-4 border border-gray-100">
            <p className="text-xs font-semibold text-gray-700 mb-2">נגישות</p>
            <div className="flex flex-wrap gap-2">
              {service.accessibility.map((a) => (
                <span key={a} className="text-xs px-2.5 py-1 rounded-md bg-teal-50 border border-teal-200 text-teal-700">
                  {ACCESS_MAP[a] ?? a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Notes */}
        {service.notes && (
          <div className="flex items-start gap-2.5 p-4 bg-white rounded-xl border border-gray-100">
            <AlertCircle className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
            <p className="text-xs text-gray-600">{service.notes}</p>
          </div>
        )}

        {/* Rating */}
        <ServiceRating serviceId={service.id} serviceName={service.name} />

        {/* Action buttons */}
        <div className="space-y-2 pt-2">
          <button
            onClick={handleBook}
            className="w-full h-12 bg-[#1B3A5C] text-white rounded-xl text-sm font-bold hover:bg-[#15304d] transition-colors flex items-center justify-center gap-2"
          >
            <CheckCircle className="w-4 h-4" />
            שלח בקשת הצטרפות
          </button>
          {service.phone && (
            <a
              href={`tel:${service.phone}`}
              className="w-full h-11 bg-white border border-[#1B3A5C] text-[#1B3A5C] rounded-xl text-sm font-semibold hover:bg-[#1B3A5C]/5 transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              התקשר — {service.phone}
            </a>
          )}
        </div>
      </main>
    </div>
  );
}
