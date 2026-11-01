/**
 * "שיחזרו אליי": הדרך החוצה מהדיגיטל, בכל מסך של האזרח (MobileShell).
 * בקשה אחת פתוחה בכל פעם. כשהמלווה לא זמינה, הבקשה עוברת למחליפה.
 */
import { Phone, PhoneCall } from "lucide-react";
import { appSettings, callCenterNumber } from "@/pilot/settings";
import { createRequest, usePilot } from "@/pilot/store";
import { he } from "@/pilot/i18n/he";
import { useCitizen } from "@/pilot/citizen/common";

export function CallbackCard() {
  const { state, derived } = usePilot();
  const { profile } = useCitizen();
  const { name, cover_name } = appSettings.companion;
  const away = state.simulation.companionAway;
  const open = derived.requests.some((r) => r.citizenId === profile.id && r.kind === "callback" && r.status === "open");

  return (
    <section id="help" className="bg-[#1B3A5C] rounded-xl p-5 text-white scroll-mt-16" aria-labelledby="help-title" data-no-read>
      <h2 id="help-title" className="text-xl font-bold">{profile.gender === "male" ? "צריך עזרה?" : "צריכה עזרה?"}</h2>
      <p className="text-base text-white/90 mt-1" role={open ? "status" : undefined}>
        {open ? he.callbackSent(away ? cover_name : name) : away ? he.companionAway(name, cover_name) : `${name}, המלווה שלך, תתקשר בקרוב.`}
      </p>
      {!open ? (
        <button
          type="button"
          className="mt-3 w-full min-h-[52px] bg-white text-[#1B3A5C] rounded-xl text-lg font-bold flex items-center justify-center gap-2"
          onClick={() => createRequest({ citizenId: profile.id, kind: "callback", actor: "citizen", note: away ? `הועבר ל${cover_name}` : undefined })}
        >
          <PhoneCall className="w-5 h-5" aria-hidden="true" /> {he.callMeBack}
        </button>
      ) : null}
      <a href={`tel:${callCenterNumber()}`} className="mt-2 w-full min-h-[48px] rounded-xl border border-white/40 text-base font-semibold flex items-center justify-center gap-2">
        <Phone className="w-4 h-4" aria-hidden="true" /> {he.callCenter} <span dir="ltr">{callCenterNumber()}</span>
      </a>
    </section>
  );
}
