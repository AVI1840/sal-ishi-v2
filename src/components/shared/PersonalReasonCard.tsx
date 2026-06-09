/**
 * PersonalReasonCard
 * ──────────────────
 * Renders a recommendation with a personal, accessible "why" section.
 *
 * Default (collapsed): one-sentence hook + "למה מומלץ לך?" toggle button.
 * Expanded: all reasons from the engine as first-person bullets
 *           + compact 5-layer breakdown (MatchExplainability compact mode).
 *
 * Designed for: CitizenHome (hero + list cards), CitizenServiceDetail, PatientDetail.
 */
import { useState } from "react";
import { ChevronDown, ChevronUp, CheckCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import type { MatchResult } from "@/lib/matchingEngine";
import { MatchExplainability } from "./MatchExplainability";

interface Props {
  result: MatchResult;
  /** citizen first name — used to personalise the hook */
  firstName?: string;
  /** show the full 5-layer breakdown when expanded (default true) */
  showLayers?: boolean;
  className?: string;
}

/** Make engine reasons read as personal, warm second-person sentences */
function personalise(reason: string, firstName?: string): string {
  const name = firstName ? firstName : "לך";
  // Engine reasons already contain short phrases; wrap them
  return reason
    .replace(/^מתאים ל/, `מתאים ל${firstName ?? ""}`)
    .replace(/^ממתן /, "עוזר: ")
    .replace(/^מונע /, "מונע: ")
    .replace(/^שירות ביתי/, "מגיע אלייך הביתה:")
    .replace(/^זמין מרחוק/, "זמין מרחוק:")
    .replace(/^בשכונה שלך/, "ממוקם בשכונה שלך")
    .replace(/^שכונה סמוכה$/, "בשכונה קרובה");
}

export function PersonalReasonCard({
  result,
  firstName,
  showLayers = true,
  className,
}: Props) {
  const [open, setOpen] = useState(false);

  const explanations = result.explanations.filter(Boolean);
  // First reason is the hook — shown collapsed
  const hookReason = explanations[0] ?? "מתאים לפרופיל שלך";
  // Rest shown on expand (may overlap with hook — dedupe)
  const extraReasons = explanations.slice(1);

  return (
    <div className={cn("rounded-xl border border-[#1B3A5C]/10 bg-[#1B3A5C]/[0.025]", className)}>
      {/* Hook — always visible */}
      <div className="px-4 py-3 flex items-start gap-2.5">
        <CheckCircle className="w-4 h-4 text-[#1B3A5C] mt-0.5 shrink-0" />
        <p className="text-sm text-[#1B3A5C] font-medium leading-snug flex-1">
          {personalise(hookReason, firstName)}
        </p>
        {/* Toggle button — only if there's more to show */}
        {(extraReasons.length > 0 || showLayers) && (
          <button
            onClick={() => setOpen((v) => !v)}
            className="shrink-0 flex items-center gap-1 text-xs text-[#1B3A5C]/70 hover:text-[#1B3A5C] transition-colors font-medium min-h-[28px] min-w-[80px] justify-end"
            aria-expanded={open}
            aria-label={open ? "הסתר סיבות" : "הצג סיבות"}
          >
            {open ? (
              <><ChevronUp className="w-3.5 h-3.5" /> פחות</>
            ) : (
              <><ChevronDown className="w-3.5 h-3.5" /> למה מומלץ?</>
            )}
          </button>
        )}
      </div>

      {/* Expanded content */}
      {open && (
        <div className="border-t border-[#1B3A5C]/10 px-4 pb-4 pt-3 space-y-3">
          {/* Extra reasons */}
          {extraReasons.length > 0 && (
            <ul className="space-y-1.5">
              {extraReasons.map((r, i) => (
                <li key={i} className="flex items-start gap-2">
                  <div className="w-1.5 h-1.5 rounded-full bg-[#1B3A5C]/40 mt-1.5 shrink-0" />
                  <span className="text-xs text-gray-700 leading-relaxed">
                    {personalise(r, firstName)}
                  </span>
                </li>
              ))}
            </ul>
          )}
          {/* 5-layer breakdown — compact */}
          {showLayers && (
            <div className="pt-1 border-t border-[#1B3A5C]/10">
              <p className="text-[10px] font-semibold uppercase tracking-widest text-[#1B3A5C]/50 mb-2">
                פירוט ציון ההתאמה
              </p>
              <MatchExplainability result={result} compact />
            </div>
          )}
        </div>
      )}
    </div>
  );
}
