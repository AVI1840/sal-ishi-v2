/**
 * הארנק של האזרחית, אותו דבר בבית ובפרופיל: כמה נשאר, כמה שמור (הוזמן, עוד לא
 * השתתפה) וכמה נוצל (השתתפה, לפי דיווח הספק). הכל מהאירועים. תמריצים מתווספים.
 */
import { Link } from "react-router-dom";
import { cn } from "@/lib/utils";
import { amount, walletFootnote } from "@/lib/wallet";
import { he } from "@/pilot/i18n/he";
import { useWallet } from "@/pilot/citizen/common";

export function WalletSummary({ tone }: { tone: "dark" | "light" }) {
  const w = useWallet();
  const of = w.total + w.bonus;
  const pct = (n: number) => (of ? Math.round((n / of) * 100) : 0);
  const dark = tone === "dark";
  const muted = dark ? "text-white/85" : "text-gray-700";
  return (
    <div>
      <p className={cn("text-4xl font-bold", dark ? "text-white" : "text-[#1B3A5C]")}>
        נשארו {amount(w.left)} <span className={cn("text-lg font-normal", muted)}>מתוך {of}</span>
      </p>
      <div
        className={cn("mt-3 h-3 rounded-full overflow-hidden flex", dark ? "bg-white/25" : "bg-gray-200")}
        role="img"
        aria-label={`נוצל ${amount(w.used)}, שמור ${amount(w.reserved)}, נשארו ${amount(w.left)}`}
      >
        <div className={dark ? "bg-white" : "bg-[#1B3A5C]"} style={{ width: `${pct(w.used)}%` }} />
        <div className={dark ? "bg-white/55" : "bg-[#1B3A5C]/45"} style={{ width: `${pct(w.reserved)}%` }} />
      </div>
      <p className={cn("text-sm mt-2", muted)}>
        שמור {amount(w.reserved)}: הוזמן, עוד לא השתתפת. נוצל {amount(w.used)}: השתתפת.
      </p>
      {w.bonus > 0 ? <p className={cn("text-sm font-semibold mt-1", dark ? "text-white" : "text-emerald-800")}>כולל {amount(w.bonus)} שקיבלת על מה שנתת לקהילה.</p> : null}
      {w.left === 0 ? <p className={cn("text-base font-semibold mt-2", dark ? "text-white" : "text-gray-900")} role="status">{he.walletEmpty}</p> : null}
      <p className={cn("text-sm mt-2", muted)}>
        {he.walletRenews}{" "}
        <Link to="/citizen/activities" className="underline underline-offset-2">מה הוזמן ומה נוצל</Link>
      </p>
      <p className={cn("text-xs mt-1", dark ? "text-white/80" : "text-gray-600")}>{walletFootnote()}</p>
    </div>
  );
}
