/** לוח התוצאות מהפוסטר: לפני ואחרי בפיילוט, והאטה בהידרדרות. משותף לתחנת התוצאות ולמסך הסיום. */
import { ArrowLeft } from "lucide-react";
import { BEFORE_AFTER, SLOWDOWN, SOURCE_LINE } from "./content";

export function ResultsBoard({ compact = false }: { compact?: boolean }) {
  return (
    <section className="space-y-4" aria-label="תוצאות הפיילוט">
      <h2 className="rounded-2xl bg-gradient-to-l from-[#1B3A5C] to-[#2d5a8c] px-5 py-3 shadow text-center text-xl sm:text-2xl font-extrabold text-white">
        אזרחים ותיקים בפיילוט: לפני ואחרי
      </h2>
      <div className="grid gap-4 sm:grid-cols-2">
        {BEFORE_AFTER.map((b) => (
          <div key={b.label} className="rounded-3xl bg-white border border-gray-200 shadow-sm p-4 text-center">
            <div className="text-xl font-bold text-[#1B3A5C]">{b.label}</div>
            <div className="mt-2 flex flex-wrap items-center justify-center gap-2">
              <span className="font-black text-gray-600 leading-none" style={{ fontSize: compact ? "clamp(1.6rem,4vw,3rem)" : "clamp(1.8rem,5vw,4rem)" }}>{b.from}</span>
              <ArrowLeft className="w-7 h-7 text-[#2d5a8c]" aria-hidden="true" />
              <span className="rounded-2xl bg-[#1B3A5C] px-3 font-black text-white leading-tight" style={{ fontSize: compact ? "clamp(1.8rem,5vw,3.6rem)" : "clamp(2rem,6.5vw,5rem)" }}>{b.to}</span>
            </div>
          </div>
        ))}
      </div>
      <div className="rounded-3xl bg-emerald-50 border border-emerald-200 p-4">
        <div className="text-center text-lg font-bold text-emerald-900">האטה בהידרדרות · נתוני גמלת סיעוד</div>
        <div className="mt-2 grid gap-3 sm:grid-cols-3 text-center">
          {SLOWDOWN.map((s) => (
            <div key={s.label}>
              <div className="font-black text-[#1B3A5C] leading-none" style={{ fontSize: compact ? "clamp(1.8rem,5vw,3.6rem)" : "clamp(2rem,6.5vw,5rem)" }}>{s.big}</div>
              <div className="text-lg font-bold">{s.label}</div>
              {s.note ? <div className="text-base text-[#4b5563]">{s.note}</div> : null}
            </div>
          ))}
        </div>
      </div>
      <p className="text-center text-base text-[#4b5563]">{SOURCE_LINE}</p>
    </section>
  );
}
