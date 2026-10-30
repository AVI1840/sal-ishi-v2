/**
 * CitizenNeeds: "מה חשוב לי". הפרופיל האישי שנאסף בקליטה עם המלווה, כבר
 * מסומן, והאזרח מעדכן אותו בעצמו: מה נותן משמעות, החלום, מה הוא אוהב לעשות,
 * יעדים, איך ומתי נוח לו, באיזו שפה ואיפה, מה יעזור לו לצאת, ומה הוא יכול
 * לתת. התפקוד (ניידות, טלפון) מוצג, ומתעדכן רק עם המלווה. בסוף ההמלצות
 * מתעדכנות מול העיניים. נשמר כאירוע ומגיע לתיק אצל המלווה.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Check, CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { matchServicesForCitizen } from "@/lib/matchingEngine";
import { personalRecommendations, withAnswers } from "@/lib/personalMatch";
import { ACTIVITIES, DAYS, FORMAT, GIVE, GOALS, HELP, HOURS, LANGUAGES, MEANING, WHERE, domainsFromGoals, intakeAnswers, parseList, type Option } from "@/lib/intakeProfile";
import { updateInterests, usePilot } from "@/pilot/store";
import { appSettings } from "@/pilot/settings";
import { useCitizen } from "@/pilot/citizen/common";

/** נטייה לפי מגדר בתוויות ("חושש/ת"). */
function gendered(label: string, male: boolean) {
  return label.replace(/(\S+)\/(\S+)/g, (_, m: string, f: string) => (male ? m : m + f));
}

function Chips(props: { id: string; title: string; hint?: string; options: Option[]; value: string[]; multi?: boolean; male: boolean; onChange: (v: string[]) => void }) {
  return (
    <section aria-labelledby={`${props.id}-h`} className="space-y-2">
      <h2 id={`${props.id}-h`} className="text-xl font-bold text-gray-900">{gendered(props.title, props.male)}</h2>
      {props.hint ? <p className="text-base text-gray-700">{props.hint}</p> : null}
      <div className="flex flex-wrap gap-2" role="group" aria-labelledby={`${props.id}-h`}>
        {props.options.map((o) => {
          const on = props.value.includes(o.id);
          return (
            <button
              key={o.id}
              type="button"
              aria-pressed={on}
              onClick={() => props.onChange(props.multi === false ? [o.id] : on ? props.value.filter((x) => x !== o.id) : [...props.value, o.id])}
              className={cn(
                "min-h-[48px] px-4 rounded-full text-base font-semibold border inline-flex items-center gap-1.5",
                on ? "bg-[#1B3A5C] text-white border-[#1B3A5C]" : "bg-white text-gray-800 border-gray-300",
              )}
            >
              {on ? <Check className="w-4 h-4" aria-hidden="true" /> : null}
              {gendered(o.label, props.male)}
            </button>
          );
        })}
      </div>
    </section>
  );
}

const MOBILITY_TEXT: Record<string, string> = { independent_walking: "הולכת לבד", walker_wheelchair: "עם הליכון או כיסא", home_remote: "בעיקר בבית" };
const DIGITAL_TEXT: Record<string, string> = { none: "בלי טלפון חכם", basic_phone: "טלפון רגיל", smartphone: "טלפון חכם" };

export default function CitizenNeeds() {
  const { derived } = usePilot();
  const { profile } = useCitizen();
  const male = profile.gender === "male";
  const saved = derived.answers.get(profile.id);
  const base = useMemo(() => intakeAnswers(profile), [profile]);
  const [a, setA] = useState<Record<string, string>>(() => (saved && "activities" in saved ? { ...base, ...saved } : base));
  const [done, setDone] = useState(false);
  const get = (k: string) => parseList(a[k]);
  const set = (k: string) => (v: string[]) => setA({ ...a, [k]: v.join(",") });
  const changed = Object.keys(a).filter((k) => (a[k] ?? "") !== (base[k] ?? ""));

  const picks = useMemo(() => {
    if (!done) return [];
    const p = withAnswers(profile, a);
    return personalRecommendations(p, matchServicesForCitizen(p, { topN: 500, minScore: 0 }), 3);
  }, [done, profile, a]);

  if (done) {
    return (
      <div className="min-h-screen bg-white" dir="rtl">
        <div className="bg-[#1B3A5C] text-white px-6 pt-16 pb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-7 h-7" aria-hidden="true" /> תודה
          </h1>
          <p className="text-lg text-white/90 mt-1" role="status">ההמלצות עודכנו לפי מה שסיפרת, ו{appSettings.companion.name} רואה את העדכון בתיק.</p>
        </div>
        <main id="main" tabIndex={-1} className="px-6 pt-5 pb-6 space-y-3" data-read>
          <h2 className="text-xl font-bold text-gray-900">מומלץ עבורך עכשיו</h2>
          <ul className="space-y-3">
            {picks.map((p) => (
              <li key={p.result.service.id}>
                <Link to={`/citizen/services/${p.result.service.id}`} className="block bg-white border border-gray-200 rounded-xl p-4 hover:border-[#1B3A5C]/30">
                  <p className="text-lg font-bold text-gray-900">{p.result.service.name}</p>
                  <p className="text-base text-[#1B3A5C] mt-1 flex items-start gap-1">
                    <Sparkles className="w-4 h-4 mt-1 shrink-0" aria-hidden="true" /> {p.reason}
                  </p>
                </Link>
              </li>
            ))}
          </ul>
          <Link to="/citizen/services" className="flex items-center justify-center min-h-[52px] bg-[#1B3A5C] text-white rounded-xl text-lg font-bold">
            לכל השירותים, לפי ההתאמה אלי{male ? "ך" : "יך"}
          </Link>
          <button type="button" className="w-full min-h-[48px] border border-[#1B3A5C] text-[#1B3A5C] rounded-xl text-base font-semibold" onClick={() => setDone(false)}>
            לחזור ולעדכן
          </button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="bg-[#1B3A5C] text-white px-6 pt-16 pb-6">
        <h1 id="q-title" className="text-3xl font-bold">מה חשוב לי</h1>
        <p className="text-lg text-white/90 mt-1">
          מה שסיפרת ל{appSettings.companion.name} בקליטה כבר מסומן. אפשר להוסיף, להוריד ולעדכן, וההמלצות ישתנו בהתאם.
        </p>
      </div>
      <main id="main" tabIndex={-1} className="px-6 pt-5 pb-28 space-y-7" data-read>
        <Chips id="meaning" title="מה נותן לי משמעות" options={MEANING} value={get("motivations")} male={male} onChange={set("motivations")} />

        <section aria-labelledby="dream-h" className="space-y-2">
          <h2 id="dream-h" className="text-xl font-bold text-gray-900">החלום שלי</h2>
          <p className="text-base text-gray-700">משהו שהיית רוצה לעשות, או לחזור לעשות.</p>
          <textarea
            aria-labelledby="dream-h"
            value={a.dream ?? ""}
            onChange={(e) => setA({ ...a, dream: e.target.value })}
            rows={2}
            className="w-full rounded-xl border border-gray-300 p-3 text-lg focus:outline-none focus:ring-2 focus:ring-[#1B3A5C]/30"
          />
        </section>

        <Chips id="loved" title="מה אני אוהב/ת לעשות" options={ACTIVITIES} value={get("activities")} male={male} onChange={set("activities")} />
        <Chips id="goals" title="מה הייתי רוצה בחצי השנה הקרובה" hint={`היעדים נקבעו יחד עם ${appSettings.companion.name}, ונבדקים בפגישה הבאה.`} options={GOALS} value={get("goals")} male={male} onChange={set("goals")} />
        <Chips id="format" title="עם מי טוב לי" options={FORMAT} value={get("format")} multi={false} male={male} onChange={set("format")} />
        <Chips id="hours" title="מתי נוח לי" options={HOURS} value={get("hours")} male={male} onChange={set("hours")} />
        <Chips id="days" title="כמה פעמים בשבוע" options={DAYS} value={get("days")} multi={false} male={male} onChange={set("days")} />
        <Chips id="lang" title="באיזו שפה" options={LANGUAGES} value={get("languages")} male={male} onChange={set("languages")} />
        <Chips id="where" title="איפה נוח לי" options={WHERE} value={get("where")} multi={false} male={male} onChange={set("where")} />
        <Chips id="help" title="מה יעזור לי לצאת" hint={`${appSettings.companion.name} תעזור במה שתסמנ${male ? "" : "י"}. לא חייבים לסמן כלום.`} options={HELP} value={get("help")} male={male} onChange={set("help")} />
        <Chips id="give" title="מה אני יכול/ה לתת" options={GIVE} value={get("give")} male={male} onChange={set("give")} />

        <section aria-labelledby="func-h" className="rounded-xl border border-gray-200 bg-gray-50 p-4 space-y-1">
          <h2 id="func-h" className="text-lg font-bold text-gray-900">מה נרשם בקליטה עם {appSettings.companion.name}</h2>
          <p className="text-base text-gray-800">
            {profile.city}, {profile.neighborhood} · {profile.familyStatus}
            {profile.hasCloseFamily ? " · משפחה קרובה" : ""}
          </p>
          <p className="text-base text-gray-800">
            {[profile.mobilityLevel ? MOBILITY_TEXT[profile.mobilityLevel] : null, profile.digitalLevel ? DIGITAL_TEXT[profile.digitalLevel] : null].filter(Boolean).join(" · ") || "הולכת לבד"}
          </p>
          <p className="text-sm text-gray-600">לשינוי בפרטים האלה: לדבר עם {appSettings.companion.name}.</p>
        </section>
      </main>

      <div className="fixed bottom-20 inset-x-0 z-30 pr-6 pl-24 pb-2">
        <button
          type="button"
          className="w-full min-h-[56px] bg-[#1B3A5C] text-white rounded-xl text-lg font-bold shadow-lg"
          onClick={() => {
            updateInterests(profile.id, domainsFromGoals(get("goals")), "citizen", a);
            setDone(true);
          }}
        >
          {changed.length ? `לשמור ${changed.length === 1 ? "שינוי אחד" : `${changed.length} שינויים`} ולראות המלצות` : "הכל נכון. לראות המלצות"}
        </button>
      </div>
    </div>
  );
}
