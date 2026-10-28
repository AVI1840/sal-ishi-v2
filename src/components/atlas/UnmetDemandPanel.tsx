/**
 * "ביקשו ואין": המלווה מסמנת סוג שירות שאזרח ביקש ואין לו מענה בשכונה.
 * נשמר רק כספירה מצטברת לשכונה, סוג שירות וחודש, בלי שום פרט על מי ביקש,
 * ומיוצא כקובץ לאטלס, שם הוא מופיע כפער במבחן הכיסוי.
 */

import { useMemo, useState } from "react";
import { Download, PlusCircle } from "lucide-react";
import { FileSyncAdapter, createBrowserFileIO } from "@sal-ishi/core/citizen";
import { catalogState } from "@/data/catalogSource";
import { NEIGHBORHOODS_LIST } from "@/data/realServices";
import { loadJSON, saveJSON } from "@/lib/storage";

interface Row {
  neighborhoodName: string;
  serviceTypeId: string;
  month: string;
  requests: number;
}

const KEY = "unmet-demand";

export function UnmetDemandPanel() {
  const seed = catalogState.seed;
  const neighborhoods = NEIGHBORHOODS_LIST.filter((n) => n !== "הכל");
  const outside = new Set(seed.categories.filter((c) => c.layer === "בחוץ").map((c) => c.code));
  const types = seed.service_types.filter((t) => !outside.has(t.category) && !(t.note ?? "").startsWith("בחוץ"));
  const thisMonth = new Date().toISOString().slice(0, 7);

  const [rows, setRows] = useState<Row[]>(() => loadJSON<Row[]>(KEY, []));
  const [neighborhood, setNeighborhood] = useState(neighborhoods[0] ?? "");
  const [typeId, setTypeId] = useState(types[0]?.id ?? "");
  const [count, setCount] = useState(1);
  const [message, setMessage] = useState("");

  const typeName = useMemo(() => new Map(seed.service_types.map((t) => [t.id, t.name])), [seed]);

  const add = () => {
    if (!neighborhood || !typeId || count < 1) return;
    const next = [...rows];
    const existing = next.find((r) => r.neighborhoodName === neighborhood && r.serviceTypeId === typeId && r.month === thisMonth);
    if (existing) existing.requests += count;
    else next.push({ neighborhoodName: neighborhood, serviceTypeId: typeId, month: thisMonth, requests: count });
    setRows(next);
    saveJSON(KEY, next);
    setCount(1);
    setMessage(`נרשמו ${count} בקשות ל${typeName.get(typeId)} ב${neighborhood}`);
  };

  const exportFile = async () => {
    await new FileSyncAdapter(createBrowserFileIO()).sendUnmetDemand({ schema: "unmet_demand_v1", exportedAt: new Date().toISOString(), rows });
    setMessage("הקובץ ירד. שלחו אותו לרכזת הפיילוט, שתקלוט אותו במסך מבחן הכיסוי באטלס.");
  };

  return (
    <section aria-labelledby="unmet-h" className="bg-white border border-gray-200 rounded-xl p-4 space-y-3">
      <div>
        <h2 id="unmet-h" className="text-base font-bold text-gray-900">ביקשו ואין</h2>
        <p className="text-xs text-gray-700 mt-0.5">
          אזרח ביקש סוג שירות שאין לו מענה בשכונה? רשמו כאן. נשמרת רק ספירה לשכונה ולסוג שירות, בלי פרטים של מי ביקש,
          והיא מגיעה לאטלס כפער במבחן הכיסוי.
        </p>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 items-end">
        <label className="text-xs font-medium text-gray-800 flex flex-col gap-1">
          שכונה
          <select className="h-11 rounded-lg border border-gray-300 px-2 text-sm" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)}>
            {neighborhoods.map((n) => <option key={n} value={n}>{n}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-gray-800 flex flex-col gap-1 sm:col-span-2">
          סוג שירות שביקשו
          <select className="h-11 rounded-lg border border-gray-300 px-2 text-sm" value={typeId} onChange={(e) => setTypeId(e.target.value)}>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </label>
        <label className="text-xs font-medium text-gray-800 flex flex-col gap-1">
          כמה בקשות
          <input type="number" min={1} className="h-11 rounded-lg border border-gray-300 px-2 text-sm" value={count}
            onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))} />
        </label>
      </div>
      <div className="flex flex-wrap gap-2">
        <button type="button" onClick={add} className="inline-flex items-center gap-1.5 h-11 px-4 rounded-lg bg-[#0368b0] text-white text-sm font-medium hover:bg-[#025a8f]">
          <PlusCircle className="w-4 h-4" aria-hidden="true" /> רישום
        </button>
        <button type="button" onClick={exportFile} disabled={!rows.length}
          className="inline-flex items-center gap-1.5 h-11 px-4 rounded-lg border border-[#0368b0] text-[#0368b0] text-sm font-medium disabled:opacity-50">
          <Download className="w-4 h-4" aria-hidden="true" /> ייצוא לאטלס ({rows.reduce((n, r) => n + r.requests, 0)} בקשות)
        </button>
      </div>
      <p role="status" aria-live="polite" className="text-xs text-gray-800">{message}</p>
      {rows.length ? (
        <ul className="text-xs text-gray-800 space-y-1">
          {rows.map((r) => (
            <li key={`${r.neighborhoodName}|${r.serviceTypeId}|${r.month}`}>
              {r.neighborhoodName}: {typeName.get(r.serviceTypeId) ?? r.serviceTypeId}, {r.requests} בקשות ({r.month})
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
