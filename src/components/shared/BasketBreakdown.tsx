/** הרכב הסל לאזרח בחודש, אותו פירוט אצל המלווה ובמטה (מפגש 2). */
import { Wallet } from "lucide-react";
import { basket, basketLines } from "@/lib/basket";

export function BasketBreakdown({ headingId }: { headingId: string }) {
  const b = basket();
  return (
    <section className="libi-card p-5" aria-labelledby={headingId}>
      <h2 id={headingId} className="text-base font-semibold text-foreground flex items-center gap-2 mb-3">
        <Wallet className="w-5 h-5 text-primary" aria-hidden="true" /> הסל לאזרח בחודש
      </h2>
      <p className="text-3xl font-bold text-foreground">₪{b.total}</p>
      <ul className="mt-3 space-y-1.5 text-sm">
        {basketLines().map((l) => (
          <li key={l.label} className="flex items-center justify-between gap-3">
            <span className="text-foreground">{l.label}</span>
            <span className="font-semibold text-foreground shrink-0">{l.value}</span>
          </li>
        ))}
      </ul>
      <p className="text-xs text-muted-foreground mt-3">
        רק הארנק האישי בנקודות (נקודה = ₪1). מההחלטות במפגש 2. הארנק בכלי מדומה: הנקודות החיות וספר החשבונות אצל ספק העל.
      </p>
    </section>
  );
}
