import { cn } from "@/lib/utils";
import type { MatchResult } from "@/lib/matchingEngine";

interface Props {
  result: MatchResult;
  compact?: boolean;
}

const LAYERS: { key: keyof MatchResult["layers"]; label: string; weight: number; color: string; bg: string }[] = [
  { key: "prevention",  label: "מניעת הידרדרות", weight: 40, color: "bg-[#1B3A5C]",   bg: "bg-blue-50"   },
  { key: "motivation",  label: "מוטיבציות",       weight: 25, color: "bg-purple-500",  bg: "bg-purple-50" },
  { key: "profileFit",  label: "התאמת פרופיל",    weight: 20, color: "bg-emerald-500", bg: "bg-emerald-50"},
  { key: "proximity",   label: "קרבה גיאוגרפית",  weight: 10, color: "bg-amber-500",   bg: "bg-amber-50"  },
  { key: "socialProof", label: "הוכחה חברתית",    weight:  5, color: "bg-pink-400",    bg: "bg-pink-50"   },
];

function ScoreRing({ score, size = 56 }: { score: number; size?: number }) {
  const stroke = score >= 80 ? "#22c55e" : score >= 60 ? "#f59e0b" : "#ef4444";
  return (
    <div className="relative shrink-0" style={{ width: size, height: size }}>
      <svg viewBox="0 0 36 36" className="w-full h-full -rotate-90">
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke="#e5e7eb" strokeWidth="3.5" />
        <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
          fill="none" stroke={stroke} strokeWidth="3.5"
          strokeDasharray={`${score}, 100`} strokeLinecap="round" />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-xs font-bold text-gray-900">{score}</span>
      </div>
    </div>
  );
}

export function MatchExplainability({ result, compact = false }: Props) {
  return (
    <div className="space-y-4">
      {/* Score header */}
      <div className="flex items-center gap-4">
        <ScoreRing score={result.totalScore} size={compact ? 48 : 60} />
        <div>
          <p className="text-sm font-semibold text-gray-900">
            ציון התאמה האישי שלך
          </p>
          <p className="text-xs text-gray-400 mt-0.5">
            מחושב ב-5 שכבות לפי פרופילך האישי
          </p>
          {result.isTopMatch && (
            <span className="mt-1.5 inline-flex items-center text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
              התאמה מובילה
            </span>
          )}
        </div>
      </div>

      {/* Layer breakdown */}
      <div className={cn("space-y-2.5", compact && "space-y-2")}>
        <p className="text-[10px] font-semibold uppercase tracking-wider text-gray-400">
          פירוק לפי שכבה
        </p>
        {LAYERS.map((layer) => {
          const score = result.layers[layer.key];
          const contribution = Math.round((score * layer.weight) / 100);
          return (
            <div key={layer.key} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <span className={cn("inline-block w-1.5 h-1.5 rounded-full shrink-0", layer.color)} />
                  <span className="text-xs text-gray-700">{layer.label}</span>
                  <span className="text-[10px] text-gray-400">({layer.weight}%)</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">
                    {contribution} נק'
                  </span>
                  <span className="text-xs font-semibold text-gray-800 w-6 text-center">{score}</span>
                </div>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-700 ease-out", layer.color)}
                  style={{ width: `${score}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanations */}
      {result.explanations.length > 0 && (
        <div className={cn("rounded-xl border border-[#1B3A5C]/10 bg-[#1B3A5C]/[0.03] p-3.5 space-y-2", compact && "p-3 space-y-1.5")}>
          <p className="text-[10px] font-semibold uppercase tracking-wider text-[#1B3A5C]/60 mb-1.5">
            למה מומלץ עבורך
          </p>
          {result.explanations.map((exp, i) => (
            <div key={i} className="flex items-start gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-[#1B3A5C] mt-1.5 shrink-0" />
              <p className="text-xs text-gray-700 leading-relaxed">{exp}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
