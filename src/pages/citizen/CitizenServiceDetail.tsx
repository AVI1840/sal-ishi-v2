/**
 * דף שירות בודד — Marketplace
 * מידע מלא + התאמה אישית + הזמנה
 */
import { useParams, Link } from "react-router-dom";
import { ArrowRight, MapPin, Clock, Users, Star, Heart, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { SERVICES, CITIZENS } from "@/data/mockData";
import { MOTIVATION_LABELS } from "@/data/types";
import { toast } from "sonner";

const citizen = CITIZENS[0];

const REVIEWS = [
  { name: "יוסף כ.", text: "פעילות מצוינת, מרגיש חי אחרי כל מפגש!", rating: 5 },
  { name: "נעמי ש.", text: "האווירה חמה ומקבלת. ממליצה בחום.", rating: 5 },
  { name: "משה ד.", text: "טוב מאוד, המדריכה סבלנית ומקצועית.", rating: 4 },
];

export default function CitizenServiceDetail() {
  const { id } = useParams();
  const service = SERVICES.find((s) => s.id === id) || SERVICES[0];

  const motivationMatch = service.motivationsServed.filter((m) => citizen.motivations.includes(m));
  const matchScore = Math.round((motivationMatch.length / service.motivationsServed.length) * 100);

  const handleBook = () => {
    toast.success(`${service.name} — ההזמנה נשלחה! ✨`, { description: "נעדכן אותך כשתאושר" });
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] pb-4" dir="rtl">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white border-b border-gray-100 px-5 py-3">
        <div className="flex items-center gap-3 max-w-6xl mx-auto">
          <Link to="/citizen/services" className="w-9 h-9 rounded-lg bg-gray-100 flex items-center justify-center" aria-label="חזרה">
            <ArrowRight className="w-4 h-4" />
          </Link>
          <h1 className="text-base font-bold text-[#1B3A5C]">{service.name}</h1>
        </div>
      </header>

      <main className="px-5 lg:px-8 pt-5 space-y-5 max-w-4xl mx-auto">
        {/* Hero */}
        <div className="rounded-2xl overflow-hidden">
          <div className="h-40 flex items-center justify-center" style={{ backgroundColor: `${service.color}15` }}>
            <span className="text-7xl">{service.emoji}</span>
          </div>
        </div>

        {/* Info */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h2 className="text-xl font-bold text-gray-900">{service.name}</h2>
          <p className="text-sm text-gray-600 mt-2">{service.description}</p>

          <div className="grid grid-cols-2 gap-3 mt-4">
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Clock className="w-4 h-4 text-gray-400" /> {service.duration}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <MapPin className="w-4 h-4 text-gray-400" /> {service.location}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Users className="w-4 h-4 text-gray-400" /> {service.format === "small_group" ? "קבוצה קטנה" : service.format === "large_group" ? "קבוצה גדולה" : "אישי"}
            </div>
            <div className="flex items-center gap-2 text-sm text-gray-600">
              <Star className="w-4 h-4 text-amber-400" /> {service.engagementRate}% התמדה
            </div>
          </div>

          {/* Price */}
          <div className="mt-4 p-3 rounded-xl bg-green-50 border border-green-100">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-green-700">
                {service.cost === 0 ? "חינם ✨ — שירות מניעה" : `${service.cost} יחידות`}
              </span>
              {service.subsidyTier === "full" && <span className="text-xs text-green-600">סבסוד מלא</span>}
            </div>
          </div>
        </div>

        {/* Personal Match */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Heart className="w-4 h-4 text-pink-500" /> התאמה אישית
          </h3>
          <div className="mt-3 flex items-center gap-4">
            <div className="relative w-16 h-16">
              <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="#e5e7eb" strokeWidth="3" />
                <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke={matchScore >= 70 ? "#22c55e" : "#f59e0b"} strokeWidth="3" strokeDasharray={`${matchScore}, 100`} />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                <span className="text-sm font-bold">{matchScore}%</span>
              </div>
            </div>
            <div>
              <p className="text-sm font-medium text-gray-800">התאמה {matchScore >= 70 ? "גבוהה" : "בינונית"} למוטיבציות שלך</p>
              <div className="flex flex-wrap gap-1 mt-1.5">
                {motivationMatch.map((m) => (
                  <span key={m} className="text-[11px] px-2 py-0.5 rounded-full bg-pink-50 text-pink-600 border border-pink-100">{MOTIVATION_LABELS[m]}</span>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="bg-white rounded-2xl p-5 border border-gray-100">
          <h3 className="text-base font-bold text-gray-900 flex items-center gap-2">
            <Star className="w-4 h-4 text-amber-400" /> ביקורות משתתפים
          </h3>
          <div className="space-y-3 mt-3">
            {REVIEWS.map((review, i) => (
              <div key={i} className="p-3 bg-gray-50 rounded-xl">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-gray-800">{review.name}</span>
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map((s) => (
                      <Star key={s} className={cn("w-3 h-3", s <= review.rating ? "text-amber-400 fill-amber-400" : "text-gray-200")} />
                    ))}
                  </div>
                </div>
                <p className="text-xs text-gray-600">{review.text}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Book Button */}
        <button
          onClick={handleBook}
          className="w-full h-14 bg-[#1B3A5C] text-white rounded-2xl text-base font-bold hover:bg-[#15304d] transition-colors flex items-center justify-center gap-2 shadow-lg"
        >
          <CheckCircle2 className="w-5 h-5" />
          הזמנה
        </button>
      </main>
    </div>
  );
}
