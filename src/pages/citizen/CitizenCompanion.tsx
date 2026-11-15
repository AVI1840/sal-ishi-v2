/**
 * CitizenCompanion: "המלווה שלי". מי המלווה, במה היא עוזרת, איך מבקשים שתחזור,
 * ומה מצב הבקשות אליה. הבקשות מהאירועים, כמו בתיק אצל המלווה.
 */
import { Link } from "react-router-dom";
import { ChevronLeft, Compass, HandCoins, Heart, KeyRound } from "lucide-react";
import { appSettings } from "@/pilot/settings";
import { he } from "@/pilot/i18n/he";
import { usePilot } from "@/pilot/store";
import { useCitizen } from "@/pilot/citizen/common";
import { CallbackCard } from "@/components/citizen/CallbackCard";

const HELPS = [
  { icon: Compass, title: "לבחור שירות", text: "לחשוב יחד מה יתאים לך, ולהירשם." },
  { icon: KeyRound, title: "לפתוח שירות שדורש אישור", text: "חלק מהשירותים נפתחים יחד עם המלווה." },
  { icon: HandCoins, title: "לממש מממן אחר", text: "כשקופת החולים או גוף אחר משלם, היא עוזרת לממש קודם שם." },
  { icon: Heart, title: "לעדכן מה חשוב לך", text: "בפגישה משותפת, או לבד בפרופיל." },
];

export default function CitizenCompanion() {
  const { state, derived } = usePilot();
  const { profile } = useCitizen();
  const { name, cover_name } = appSettings.companion;
  const away = state.simulation.companionAway;
  const open = derived.requests.filter((r) => r.citizenId === profile.id && r.status === "open");

  return (
    <div className="min-h-screen bg-gray-50" dir="rtl">
      <div className="bg-[#1B3A5C] text-white px-6 pt-6 pb-6">
        <div className="flex items-center gap-4">
          <span className="w-16 h-16 rounded-full bg-white text-[#1B3A5C] text-2xl font-bold flex items-center justify-center shrink-0" aria-hidden="true">
            {name.charAt(0)}
          </span>
          <div>
            <h1 className="text-3xl font-bold">המלווה שלי</h1>
            <p className="text-lg text-white/90">
              {name}, המלווה החברתית שלך ב{appSettings.companion.neighborhood}
            </p>
          </div>
        </div>
        {away ? <p className="mt-3 text-base bg-white/10 rounded-xl p-3">{he.companionAway(name, cover_name)}</p> : null}
      </div>

      <main id="main" tabIndex={-1} className="px-4 sm:px-6 pt-5 pb-6 space-y-6" data-read>
        <CallbackCard />

        <section aria-labelledby="open-h" className="space-y-2">
          <h2 id="open-h" className="text-2xl font-bold text-gray-900">הבקשות שלי אליה</h2>
          {open.length ? (
            <ul className="space-y-2">
              {open.map((r) => (
                <li key={r.id} className="bg-white border border-gray-200 rounded-xl p-4">
                  <p className="text-base font-bold text-gray-900">
                    {r.kind === "callback" ? he.callbackRequest : r.kind === "claim_help" ? `${he.claimHelp}: ${r.serviceName ?? ""}` : he.gatedRequest(r.serviceName ?? "")}
                  </p>
                  <p className="text-base text-amber-900">{he.status.open}</p>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-base text-gray-700">אין בקשות פתוחות.</p>
          )}
          <Link to="/citizen/activities" className="min-h-[44px] inline-flex items-center gap-1 text-base font-semibold text-[#1B3A5C]">
            כל הבקשות וההרשמות בהשירותים שלי <ChevronLeft className="w-4 h-4" aria-hidden="true" />
          </Link>
        </section>

        <section aria-labelledby="helps-h">
          <h2 id="helps-h" className="text-2xl font-bold text-gray-900 mb-3">במה {name} עוזרת</h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {HELPS.map((h) => (
              <li key={h.title} className="bg-white border border-gray-200 rounded-2xl p-4 flex items-start gap-3">
                <span className="w-11 h-11 rounded-full bg-violet-50 text-violet-800 flex items-center justify-center shrink-0">
                  <h.icon className="w-6 h-6" aria-hidden="true" />
                </span>
                <span>
                  <span className="block text-lg font-bold text-gray-900">{h.title}</span>
                  <span className="block text-base text-gray-800">{h.text}</span>
                </span>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </div>
  );
}
