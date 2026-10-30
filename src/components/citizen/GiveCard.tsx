/**
 * "לתת לקהילה": מופיע רק למי שהמלווה סימנה שזה מתאים לו. ההצעה אישית, ממה שסיפר
 * (למשל: מי שאוהבת לשיר יכולה להוביל שירה במועדון), עם הנקודות שמקבלים. "רוצה
 * לשמוע עוד" שולח בקשה למלווה. לא חובה ולא לכולם.
 */
import { useState } from "react";
import { HandHeart } from "lucide-react";
import { giveOffers, incentivesOn } from "@/lib/incentives";
import { createRequest, usePilot } from "@/pilot/store";
import { usePersonalProfile } from "@/pilot/citizen/common";

export function GiveCard() {
  const { derived } = usePilot();
  const profile = usePersonalProfile();
  const roles = derived.eligibility.get(profile.id) ?? [];
  const asked = derived.requests.some((r) => r.citizenId === profile.id && r.kind === "callback" && r.status === "open" && r.note?.startsWith("רוצה לתת"));
  const [sent, setSent] = useState(false);
  if (!incentivesOn() || roles.length === 0) return null;
  const offers = giveOffers(profile, roles);

  return (
    <section className="bg-amber-50 border border-amber-200 rounded-xl p-5 space-y-3" aria-labelledby="give-title">
      <h2 id="give-title" className="text-xl font-bold text-gray-900 flex items-center gap-2">
        <HandHeart className="w-6 h-6 text-amber-800" aria-hidden="true" /> לתת לקהילה
      </h2>
      <p className="text-base text-gray-800">יש לך מה לתת. מי שנותן לקהילה מקבל נקודות לארנק.</p>
      <ul className="space-y-2">
        {offers.map((o) => (
          <li key={o.title} className="bg-white rounded-lg border border-amber-200 p-3">
            <p className="text-base font-bold text-gray-900">{o.title}</p>
            <p className="text-sm text-gray-700">{o.detail}</p>
          </li>
        ))}
      </ul>
      {sent || asked ? (
        <p role="status" className="text-base text-emerald-900">המלווה קיבלה ותחזור בקרוב עם הפרטים.</p>
      ) : (
        <button
          type="button"
          className="w-full min-h-[52px] bg-amber-800 text-white rounded-xl text-lg font-bold"
          onClick={() => {
            createRequest({ citizenId: profile.id, kind: "callback", actor: "citizen", note: `רוצה לתת לקהילה: ${offers.map((o) => o.title).join("; ")}` });
            setSent(true);
          }}
        >
          רוצה לשמוע עוד
        </button>
      )}
    </section>
  );
}
