/**
 * CitizenServiceDetail — דף שירות בודד
 * טוען שירות אמיתי מהקטלוג + דירוג + הזמנה
 */
import { useParams, Link } from "react-router-dom";
import {
  ArrowRight, MapPin, Clock, Users, Star, Heart, CheckCircle2,
  Phone, Globe, AlertCircle, Accessibility, Bus, Laptop,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { realServices } from "@/data/realServices";
import ServiceRating from "@/components/shared/ServiceRating";
import { toast } from "sonner";

const COST_LABEL: Record<string, string> = {
  free: "חינם ✨",
  subsidized: "מסובסד (גמלת סיעוד / רווחה)",
  paid: "בתשלום",
};
const COST_BG: Record<string, string> = {
  free: "bg-green-50 border-green-100 text-green-700",
  subsidized: "bg-blue-50 border-blue-100 text-blue-700",
  paid: "bg-gray-50 border-gray-100 text-gray-600",
};

const LANG_LABEL: Record<string, string> = {
  hebrew: "עברית",
  arabic: "ערבית",
  russian: "רוסית",
  english: "אנגלית",
  yiddish: "יידיש",
  amharic: "אמהרית",
  french: "צרפתית",
  bukharian: "בוכרית",
};

const ACCESS_LABEL: Record<string, { label: string; icon: string }> = {
  wheelchair: { label: "נגיש לכיסא גלגלים", icon: "♿" },
  transport: { label: "הסעות", icon: "🚌" },
  home_visit: { label: "ביקורי בית", icon: "🏠" },
  remote: { label: "מרחוק / דיגיטלי", icon: "💻" },
  elevator: { label: "מעלית", icon: "🛗" },
  parking: { label: "חניה", icon: "🅿️" },
  emergency_button: { label: "כפתור חירום", icon: "🆘" },
};

const CERTAINTY_LABEL: Record<string, string> = {
  high: "✅ מאומת במלואו",
  medium: "⚠️ מאומת חלקית",
  low: "❓ דורש אימות",
};

export default function CitizenServiceDetail() {
  const { id } = useParams();

  // מנסה למצוא בקטלוג האמיתי
  const service = realServices.find((s) => s.id === id) ?? realServices[0];

  const handleBook = () => {
    toast.success(`${service.name} — הבקשה נשלחה! ✨`, {
      description: "המתאמת שלך תיצור איתך קשר לתיאום",
    });
  };

  const handleCall = () => {
    if (service.phone) {
      window.location.href = `tel:${service.phone}`;
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-6" dir="rtl">
      {/* ── Header ── */}
      <header className="sticky top-0 z-40 bg-white/90 backdrop-blur border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-3 max-w-4xl mx-auto">
          <Link
            to="/citizen/services"
            className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center"
            aria-label="חזרה"
          >
            <ArrowRight className="w-4 h-4" />
          </Link>
          <h1 className="text-base font-bold text-[#1B3A5C] line-clamp-1 flex-1">{service.name}</h1>
          <span className={cn("text-[10px] px-2.5 py-1 rounded-full font-semibold border", COST_BG[service.cost])}>
            {service.cost === "free" ? "חינם" : service.costLabel}
          </span>
        </div>
      </header>

      <main className="px-5 lg:px-8 pt-5 space-y-5 max-w-4xl mx-auto">

        {/* ── Hero ── */}
        <div className="rounded-2xl overflow-hidden bg-gradient-to-br from-[#1B3A5C]/5 to-[#1B3A5C]/10 h-40 flex flex-col items-center justify-center">
          <span className="text-6xl mb-2">{service.emoji}</span>
          <span className="text-xs text-[#1B3A5C]/60 font-medium">{service.categoryLabel}</span>
        </div>

        {/* ── Info ── */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100 space-y-4">
          <div>
            <h2 className="text-xl font-bold text-gray-900">{service.name}</h2>
            <p className="text-sm text-[#1B3A5C] mt-0.5 font-medium">{service.provider}</p>
          </div>

          {/* Cost */}
          <div className={cn("p-3 rounded-xl border", COST_BG[service.cost])}>
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold">{COST_LABEL[service.cost]}</span>
              {service.cost_note && (
                <span className="text-xs opacity-70">{service.cost_note}</span>
              )}
            </div>
          </div>

          {/* Grid details */}
          <div className="grid grid-cols-2 gap-3 text-sm">
            {service.address && (
              <div className="flex items-start gap-2 text-gray-600">
                <MapPin className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <span className="text-sm">{service.address}</span>
              </div>
            )}
            {service.days && (
              <div className="flex items-start gap-2 text-gray-600">
                <Clock className="w-4 h-4 text-gray-400 mt-0.5 shrink-0" />
                <div>
                  <div className="text-sm">{service.days}</div>
                  {service.hours && <div className="text-xs text-gray-400">{service.hours}</div>}
                </div>
              </div>
            )}
            {service.phone && (
              <div className="flex items-center gap-2 text-gray-600">
                <Phone className="w-4 h-4 text-gray-400 shrink-0" />
                <a href={`tel:${service.phone}`} className="text-sm text-[#1B3A5C] hover:underline">{service.phone}</a>
              </div>
            )}
            {service.website && (
              <div className="flex items-center gap-2 text-gray-600">
                <Globe className="w-4 h-4 text-gray-400 shrink-0" />
                <a href={`https://${service.website}`} target="_blank" rel="noopener noreferrer" className="text-sm text-[#1B3A5C] hover:underline truncate">{service.website}</a>
              </div>
            )}
          </div>

          {/* Match score */}
          <div className="flex items-center gap-3 p-3 bg-[#1B3A5C]/5 rounded-xl">
            <div className="relative w-12 h-12 shrink-0">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="4" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={service.match_score >= 80 ? "#22c55e" : "#f59e0b"} strokeWidth="4" strokeDasharray={`${service.match_score}, 100`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-xs font-bold text-[#1B3A5C]">{service.match_score}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-semibold text-[#1B3A5C]">
                {service.match_score >= 80 ? "התאמה גבוהה" : "התאמה טובה"} לפרופיל שלך
              </p>
              <p className="text-xs text-gray-500">{CERTAINTY_LABEL[service.certainty]}</p>
            </div>
          </div>

          {/* Notes */}
          {service.notes && (
            <div className="flex items-start gap-2 p-3 bg-blue-50 border border-blue-100 rounded-xl">
              <AlertCircle className="w-4 h-4 text-blue-400 shrink-0 mt-0.5" />
              <p className="text-xs text-blue-700">{service.notes}</p>
            </div>
          )}
        </div>

        {/* ── Languages ── */}
        {service.languages.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Users className="w-4 h-4 text-gray-400" /> שפות השירות
            </h3>
            <div className="flex flex-wrap gap-2">
              {service.languages.map((lang) => (
                <span key={lang} className="px-3 py-1.5 bg-purple-50 border border-purple-100 text-purple-700 text-xs font-medium rounded-full">
                  {LANG_LABEL[lang] ?? lang}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Accessibility ── */}
        {service.accessibility.length > 0 && (
          <div className="bg-white rounded-2xl p-5 border border-gray-100">
            <h3 className="text-sm font-bold text-gray-800 mb-3 flex items-center gap-2">
              <Heart className="w-4 h-4 text-gray-400" /> נגישות ושירותי תמיכה
            </h3>
            <div className="flex flex-wrap gap-2">
              {service.accessibility.map((a) => (
                <span key={a} className="px-3 py-1.5 bg-teal-50 border border-teal-100 text-teal-700 text-xs font-medium rounded-full flex items-center gap-1">
                  {ACCESS_LABEL[a]?.icon ?? "✓"} {ACCESS_LABEL[a]?.label ?? a}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* ── Rating component ── */}
        <ServiceRating serviceId={service.id} serviceName={service.name} />

        {/* ── Action Buttons ── */}
        <div className="space-y-3">
          <button
            onClick={handleBook}
            className="w-full h-14 bg-[#1B3A5C] text-white rounded-2xl text-base font-bold hover:bg-[#15304d] transition-colors flex items-center justify-center gap-2 shadow-lg"
          >
            <CheckCircle2 className="w-5 h-5" />
            שלח בקשת הצטרפות
          </button>
          {service.phone && (
            <button
              onClick={handleCall}
              className="w-full h-12 bg-white border-2 border-[#1B3A5C] text-[#1B3A5C] rounded-2xl text-sm font-bold hover:bg-[#1B3A5C]/5 transition-colors flex items-center justify-center gap-2"
            >
              <Phone className="w-4 h-4" />
              התקשר — {service.phone}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
