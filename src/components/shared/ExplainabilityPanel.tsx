/**
 * ExplainabilityPanel — ויזואליזציית 5 שכבות ציון ההתאמה
 * מציג למה שירות הומלץ: progress bars צבעוניים + הסברים בעברית
 */
import { cn } from "@/lib/utils";
import type { LayerScores } from "@/lib/matchingEngine";
import { Shield, Heart, UserCheck, MapPin, Users } from "lucide-react";

interface ExplainabilityPanelProps {
  layers: LayerScores;
  totalScore: number;
  explanations: string[];
  compact?: boolean;
}

const LAYERS = [
  { key: "prevention",  label: "מניעת הידרדרות", weight: 30, icon: Shield,    color: "bg-rose-500",    bgSoft: "bg-rose-50 text-rose-700" },
  { key: "motivation",  label: "מוטיבציה אישית", weight: 25, icon: Heart,     color: "bg-purple-500",  bgSoft: "bg-purple-50 text-purple-700" },
  { key: "profileFit",  label: "התאמת פרופיל",   weight: 20, icon: UserCheck,  color: "bg-blue-500",    bgSoft: "bg-blue-50 text-blue-700" },
  { key: "socialProof", label: "הוכחה חברתית",   weight: 15, icon: Users,      color: "bg-amber-500",   bgSoft: "bg-amber-50 text-amber-700" },
  { key: "proximity",   label: "קרבה גיאוגרפית", weight: 10, icon: MapPin,     color: "bg-emerald-500", bgSoft: "bg-emerald-50 text-emerald-700" },
] as const;

export function ExplainabilityPanel({ layers, totalScore, explanations, compact = false }: ExplainabilityPanelProps) {
  const scoreColor = totalScore >= 80
    ? "text-emerald-700 border-emerald-300 bg-emerald-50"
    : totalScore >= 60
    ? "text-amber-700 border-amber-300 bg-amber-50"
    : "text-gray-600 border-gray-200 bg-gray-50";

  const scoreLabel = totalScore >= 80 ? "התאמה גבוהה" : totalScore >= 60 ? "התאמה טובה" : "התאמה חלקית";

  return (
    <div className={cn("border border-gray-200 rounded-xl", compact ? "p-4" : "p-5")} dir="rtl">
      {/* Header with total score */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-sm font-bold text-gray-900">למה מתאים לך</h3>
          <p className="text-[11px] text-gray-500 mt-0.5">ציון מבוסס אלגוריתם 5 שכבות</p>
        </div>
        <div className={cn("flex flex-col items-center px-3 py-1.5 rounded-xl border", scoreColor)}>
          <span className="text-xl font-bold leading-none">{totalScore}</span>
          <span className="text-[9px] font-medium mt-0.5">{scoreLabel}</span>
        </div>
      </div>

      {/* 5 Layer bars */}
      <div className={cn("space-y-3", compact && "space-y-2")}>
        {LAYERS.map(({ key, label, weight, icon: Icon, color, bgSoft }) => {
          const value = layers[key as keyof LayerScores];
          return (
            <div key={key} className="group">
              <div className="flex items-center justify-between mb-1">
                <div className="flex items-center gap-2">
                  <div className={cn("w-5 h-5 rounded flex items-center justify-center", bgSoft)}>
                    <Icon className="w-3 h-3" />
                  </div>
                  <span className="text-xs font-medium text-gray-800">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] text-gray-400">{weight}%</span>
                  <span className="text-xs font-bold text-gray-700 tabular-nums w-7 text-left">{value}</span>
                </div>
              </div>
              <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                <div
                  className={cn("h-full rounded-full transition-all duration-1000 ease-out", color)}
                  style={{ width: `${value}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Explanation text */}
      {explanations.length > 0 && (
        <div className="mt-4 pt-3 border-t border-gray-100">
          <div className="space-y-1.5">
            {explanations.slice(0, 3).map((exp, i) => (
              <p key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                <span className="text-[#1B3A5C] mt-0.5 shrink-0">•</span>
                {exp}
              </p>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
