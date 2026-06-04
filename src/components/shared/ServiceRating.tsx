/**
 * ServiceRating — קומפוננטת דירוג לשירות
 * כוכבים 1-5 + "היית ממליץ?" + טקסט חופשי
 * שומר ב-localStorage לפי serviceId
 */
import { useState, useEffect } from "react";
import { Star, ThumbsUp, ThumbsDown, Send } from "lucide-react";

interface ServiceRatingProps {
  serviceId: string;
  serviceName: string;
  onSubmit?: (rating: RatingEntry) => void;
}

export interface RatingEntry {
  serviceId: string;
  stars: number;
  recommend: boolean | null;
  text: string;
  timestamp: string;
}

const STORAGE_KEY = "sal-ishi-ratings";

function loadRatings(): Record<string, RatingEntry> {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || "{}");
  } catch {
    return {};
  }
}

function saveRating(entry: RatingEntry) {
  const all = loadRatings();
  all[entry.serviceId] = entry;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export default function ServiceRating({ serviceId, serviceName, onSubmit }: ServiceRatingProps) {
  const [existing, setExisting] = useState<RatingEntry | null>(null);
  const [stars, setStars] = useState(0);
  const [hover, setHover] = useState(0);
  const [recommend, setRecommend] = useState<boolean | null>(null);
  const [text, setText] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    const all = loadRatings();
    if (all[serviceId]) {
      setExisting(all[serviceId]);
      setSubmitted(true);
    }
  }, [serviceId]);

  const handleSubmit = () => {
    if (stars === 0) return;
    const entry: RatingEntry = {
      serviceId,
      stars,
      recommend,
      text: text.trim(),
      timestamp: new Date().toISOString(),
    };
    saveRating(entry);
    setExisting(entry);
    setSubmitted(true);
    onSubmit?.(entry);
  };

  const handleEdit = () => {
    if (!existing) return;
    setStars(existing.stars);
    setRecommend(existing.recommend);
    setText(existing.text);
    setSubmitted(false);
  };

  if (submitted && existing) {
    return (
      <div className="bg-green-50 border border-green-100 rounded-2xl p-4" dir="rtl">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm font-semibold text-green-700">✅ הדירוג שלך נשמר</span>
          <button onClick={handleEdit} className="text-xs text-green-600 underline">ערוך</button>
        </div>
        <div className="flex gap-0.5 mb-2">
          {[1, 2, 3, 4, 5].map((s) => (
            <Star
              key={s}
              className={`w-5 h-5 ${s <= existing.stars ? "text-amber-400 fill-amber-400" : "text-gray-200"}`}
            />
          ))}
        </div>
        {existing.recommend !== null && (
          <p className="text-xs text-green-600">
            {existing.recommend ? "👍 ממליץ/ה לאחרים" : "👎 לא ממליץ/ה"}
          </p>
        )}
        {existing.text && (
          <p className="text-xs text-gray-600 mt-1 italic">"{existing.text}"</p>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white border border-gray-100 rounded-2xl p-5 space-y-4" dir="rtl">
      <h4 className="text-sm font-bold text-gray-800 flex items-center gap-2">
        <Star className="w-4 h-4 text-amber-400" />
        דרג את {serviceName}
      </h4>

      {/* Stars */}
      <div>
        <p className="text-xs text-gray-500 mb-2">כמה כוכבים היית נותן/ת?</p>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((s) => (
            <button
              key={s}
              onMouseEnter={() => setHover(s)}
              onMouseLeave={() => setHover(0)}
              onClick={() => setStars(s)}
              aria-label={`${s} כוכבים`}
              className="transition-transform hover:scale-110 active:scale-95"
            >
              <Star
                className={`w-8 h-8 transition-colors ${
                  s <= (hover || stars)
                    ? "text-amber-400 fill-amber-400"
                    : "text-gray-200"
                }`}
              />
            </button>
          ))}
          {stars > 0 && (
            <span className="mr-2 self-center text-xs text-gray-500">
              {["", "חלש", "בסדר", "טוב", "מצוין", "מושלם"][stars]}
            </span>
          )}
        </div>
      </div>

      {/* Recommend */}
      <div>
        <p className="text-xs text-gray-500 mb-2">היית ממליץ/ה לחבר?</p>
        <div className="flex gap-3">
          <button
            onClick={() => setRecommend(true)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              recommend === true
                ? "bg-green-50 border-green-300 text-green-700"
                : "border-gray-200 text-gray-600 hover:border-green-200"
            }`}
          >
            <ThumbsUp className="w-4 h-4" /> כן, ממליץ/ה
          </button>
          <button
            onClick={() => setRecommend(false)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-medium border transition-colors ${
              recommend === false
                ? "bg-red-50 border-red-300 text-red-600"
                : "border-gray-200 text-gray-600 hover:border-red-200"
            }`}
          >
            <ThumbsDown className="w-4 h-4" /> לא ממש
          </button>
        </div>
      </div>

      {/* Free text */}
      <div>
        <p className="text-xs text-gray-500 mb-2">רוצה להוסיף משהו? (אופציונלי)</p>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="שתף את חוויתך..."
          className="w-full text-sm border border-gray-200 rounded-xl p-3 resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 text-right"
          rows={2}
          dir="rtl"
          maxLength={200}
        />
      </div>

      <button
        onClick={handleSubmit}
        disabled={stars === 0}
        className="w-full h-11 bg-[#1B3A5C] text-white rounded-xl text-sm font-semibold flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-[#15304d] transition-colors"
      >
        <Send className="w-4 h-4" />
        שלח דירוג
      </button>
    </div>
  );
}
