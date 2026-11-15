/**
 * "מה הכלי כן ולא עושה", בתוך הכלי הקיים. במקום הסתייגויות על כל כרטיס,
 * עמוד אחד שמסביר את הגבול בין הכלי לפלטפורמת הספק. התוכן משותף עם 0.5
 * (pilot/Scope), כדי שלא ייפרד.
 */
import { useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, Check, X } from "lucide-react";
import { DOES, DOES_NOT, WHO } from "@/pilot/Scope";

export default function ScopePage() {
  useEffect(() => {
    document.title = "מה הכלי כן ולא עושה | סל אישי";
  }, []);
  return (
    <div className="min-h-screen bg-[#f8fafc]" dir="rtl">
      <div className="bg-[#1B3A5C] text-white px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <Link to="/" className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-semibold text-white/85 hover:text-white">
            <ArrowRight className="w-4 h-4" aria-hidden="true" /> לדף הבית
          </Link>
          <h1 className="text-3xl font-bold mt-2">מה הכלי כן ולא עושה</h1>
          <p className="text-lg text-white/85 mt-2">הגבול בין הכלי הזה לפלטפורמת הספק בפיילוט.</p>
        </div>
      </div>

      <main id="main" tabIndex={-1} className="max-w-3xl mx-auto px-6 py-8 space-y-5">
        <section className="bg-white rounded-xl border border-gray-200 p-6" aria-labelledby="does-h">
          <h2 id="does-h" className="text-xl font-bold text-gray-900 mb-4">הכלי כן</h2>
          <ul className="space-y-3">
            {DOES.map((x) => (
              <li key={x} className="flex items-start gap-3 text-base text-gray-800">
                <Check className="w-5 h-5 text-emerald-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6" aria-labelledby="not-h">
          <h2 id="not-h" className="text-xl font-bold text-gray-900 mb-4">הכלי לא</h2>
          <ul className="space-y-3">
            {DOES_NOT.map((x) => (
              <li key={x} className="flex items-start gap-3 text-base text-gray-800">
                <X className="w-5 h-5 text-red-700 shrink-0 mt-0.5" aria-hidden="true" />
                <span>{x}</span>
              </li>
            ))}
          </ul>
        </section>

        <section className="bg-white rounded-xl border border-gray-200 p-6" aria-labelledby="who-h">
          <h2 id="who-h" className="text-xl font-bold text-gray-900 mb-4">מי עושה מה בפיילוט</h2>
          <table className="w-full text-base">
            <thead>
              <tr className="border-b border-gray-200 text-right">
                <th scope="col" className="py-2 font-semibold text-gray-700">מה</th>
                <th scope="col" className="py-2 font-semibold text-gray-700">איפה</th>
              </tr>
            </thead>
            <tbody>
              {WHO.map(([what, where]) => (
                <tr key={what} className="border-b border-gray-100 last:border-0">
                  <td className="py-2.5 pl-4 text-gray-900">{what}</td>
                  <td className="py-2.5 text-gray-700">{where}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </main>
    </div>
  );
}
