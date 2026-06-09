/**
 * SubsidyBadge — displays funding level per service cost type.
 * Single source of truth for subsidy display across all service cards.
 */
import { cn } from "@/lib/utils";

type CostType = "free" | "subsidized" | "paid";

const CONFIG: Record<CostType, { label: string; detail: string; cls: string }> = {
  free:       { label: "חינם",    detail: "100% ממומן",    cls: "bg-emerald-50 text-emerald-700 border-emerald-200" },
  subsidized: { label: "מסובסד",  detail: "50% מסובסד",   cls: "bg-blue-50 text-blue-700 border-blue-200" },
  paid:       { label: "השתתפות", detail: "עלות חלקית",   cls: "bg-amber-50 text-amber-700 border-amber-200" },
};

interface Props {
  cost: CostType;
  /** show detail line (e.g. "100% ממומן") in addition to the main label */
  showDetail?: boolean;
  className?: string;
}

export function SubsidyBadge({ cost, showDetail = false, className }: Props) {
  const c = CONFIG[cost];

  if (showDetail) {
    return (
      <div className={cn("inline-flex flex-col items-start px-2.5 py-1.5 rounded-lg border", c.cls, className)}>
        <span className="text-xs font-bold leading-snug">{c.label}</span>
        <span className="text-[10px] leading-snug opacity-75">{c.detail}</span>
      </div>
    );
  }

  return (
    <span className={cn("inline-flex items-center text-xs px-2 py-0.5 rounded border font-medium shrink-0", c.cls, className)}>
      {c.label}
    </span>
  );
}
