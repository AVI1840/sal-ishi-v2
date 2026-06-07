/**
 * CitizenServiceDetail — דף שירות בודד
 * שירות אמיתי מהקטלוג · דירוג · הזמנה
 * ללא אימוגי — מקצועי
 */
import { useParams, Link } from "react-router-dom";
import { ArrowRight, MapPin, Clock, Phone, Globe, AlertCircle, CheckCircle, Heart, Activity, Users, Laptop, Wrench } from "lucide-react";
import { cn } from "@/lib/utils";
import { realServices } from "@/data/realServices";
import { serviceCatalog } from "@/data/serviceCatalog";
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
  const certaintyInfo = CERTAINTY_MAP[service.certainty];
  const Icon = CATEGORY_ICON[service.category] ?? Heart;

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
        <span className={cn("text-[10px] px-2 py-0.5 rounded border font-medium shrink-0", costInfo.cls)}>
          {service.cost === "free" ? "חינם" : service.cost === "subsidized" ? "מסובסד" : "בתשלום"}
        </span>
      </header>

      <main className="px-5 pt-5 space-y-4 max-w-3xl mx-auto">

        {/* Hero - category icon + name */}
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

        {/* Match score + certainty */}
        <div className="bg-white rounded-xl p-5 border border-gray-100">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-gray-900">ציון התאמה</p>
            <span className={cn("text-[10px] px-2 py-0.5 rounded border font-medium", certaintyInfo.cls)}>{certaintyInfo.label}</span>
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-14 h-14 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={service.match_score >= 80 ? "#22c55e" : "#f59e0b"} strokeWidth="4" strokeDasharray={`${service.match_score}, 100`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold text-gray-900">{service.match_score}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm text-gray-700">{service.match_score >= 80 ? "התאמה גבוהה לפרופיל שלך" : "התאמה טובה"}</p>
              <p className="text-xs text-gray-400 mt-0.5">מבוסס על אלגוריתם 5 שכבות</p>
            </div>
          </div>

          {/* Dimensions */}
          {catalogEntry && (
            <div className="mt-4 pt-3 border-t border-gray-100 grid grid-cols-5 gap-2 text-center">
              {(["functional_fit","emotional_fit","social_fit","accessibility_fit","urgency_fit"] as const).map((dim) => {
                const labels: Record<string, string> = { functional_fit:"תפקודי", emotional_fit:"רגשי", social_fit:"חברתי", accessibility_fit:"נגישות", urgency_fit:"דחיפות" };
                const val = catalogEntry.dimensions[dim];
                return (
                  <div key={dim}>
                    <div className="text-base font-bold text-[#1B3A5C]">{val}</div>
                    <div className="text-[9px] text-gray-400">{labels[dim]}</div>
                  </div>
                );
              })}
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
