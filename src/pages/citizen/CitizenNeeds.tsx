/**
 * CitizenNeeds: "לספר מה חשוב לי". ארבע שאלות סגורות, שלוש תשובות בכל אחת,
 * עם הקראה (כפתור "להקריא" בפינה). בסוף ההמלצות מתעדכנות מול העיניים, עם
 * "סיפרת ש...". התשובות נשמרות כאירוע ומגיעות גם לתיק אצל המלווה.
 */
import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { CheckCircle2, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";
import { matchServicesForCitizen } from "@/lib/matchingEngine";
import { personalRecommendations, withAnswers } from "@/lib/personalMatch";
import { updateInterests, usePilot } from "@/pilot/store";
import { useCitizen } from "@/pilot/citizen/common";

interface Question {
  id: string;
  text: string;
  options: { value: string; label: string }[];
}

const QUESTIONS: Question[] = [
  { id: "loved", text: "מה אהבת לעשות פעם?", options: [{ value: "שירה", label: "לשיר ולשמוע מוזיקה" }, { value: "בישול", label: "לבשל ולארח" }, { value: "ללמוד ולקרוא", label: "ללמוד ולקרוא" }] },
  { id: "with", text: "עם מי טוב לך?", options: [{ value: "small_group", label: "בקבוצה קטנה" }, { value: "flexible", label: "עם עוד אדם אחד" }, { value: "alone", label: "לבד, בקצב שלי" }] },
  { id: "hours", text: "מתי נוח לך?", options: [{ value: "בוקר", label: "בבוקר" }, { value: "צהריים", label: "בצהריים" }, { value: "ערב", label: "אחר הצהריים" }] },
  { id: "hard", text: "מה קשה לך היום?", options: [{ value: "going_out", label: "לצאת מהבית" }, { value: "lonely", label: "להיות לבד" }, { value: "none", label: "שום דבר מיוחד" }] },
];

/** תחומי העניין (לפגישה המשותפת ולמיון אצל המלווה), מהתשובות. */
function interestsFrom(a: Record<string, string>): string[] {
  const out: string[] = [];
  if (a.hard === "lonely" || a.loved === "שירה") out.push("belonging");
  if (a.loved === "בישול") out.push("health_function");
  if (a.loved === "ללמוד ולקרוא") out.push("digital");
  return [...new Set(out)];
}

export default function CitizenNeeds() {
  const { derived } = usePilot();
  const { profile } = useCitizen();
  const saved = derived.answers.get(profile.id);
  const [answers, setAnswers] = useState<Record<string, string>>(() => ({ ...(saved ?? {}) }));
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const picks = useMemo(() => {
    if (!done) return [];
    const p = withAnswers(profile, answers);
    return personalRecommendations(p, matchServicesForCitizen(p, { topN: 500, minScore: 0 }), 3);
  }, [done, profile, answers]);

  if (done) {
    return (
      <div className="min-h-screen bg-white" dir="rtl">
        <div className="bg-[#1B3A5C] text-white px-6 pt-16 pb-6">
          <h1 className="text-3xl font-bold flex items-center gap-2">
            <CheckCircle2 className="w-7 h-7" aria-hidden="true" /> תודה
          </h1>
          <p className="text-lg text-white/90 mt-1" role="status">ההמלצות עודכנו לפי מה שסיפרת.</p>
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
          <Link to="/citizen" className="flex items-center justify-center min-h-[52px] bg-[#1B3A5C] text-white rounded-xl text-lg font-bold">
            לחזור לבית
          </Link>
        </main>
      </div>
    );
  }

  const q = QUESTIONS[step];
  const chosen = answers[q.id];
  const last = step === QUESTIONS.length - 1;

  return (
    <div className="min-h-screen bg-white" dir="rtl">
      <div className="bg-[#1B3A5C] text-white px-6 pt-16 pb-6">
        <p className="text-base text-white/85">
          שאלה {step + 1} מתוך {QUESTIONS.length}
        </p>
        <h1 id="q-title" className="text-3xl font-bold mt-1">{q.text}</h1>
      </div>
      <main id="main" tabIndex={-1} className="px-6 pt-5 pb-6 space-y-4" data-read>
        <fieldset className="space-y-3" aria-labelledby="q-title">
          {q.options.map((o) => (
            <label
              key={o.value}
              className={cn(
                "flex items-center gap-3 min-h-[60px] px-4 rounded-xl border-2 text-lg cursor-pointer",
                chosen === o.value ? "border-[#1B3A5C] bg-[#1B3A5C]/5 font-bold" : "border-gray-200",
              )}
            >
              <input type="radio" name={q.id} value={o.value} checked={chosen === o.value} onChange={() => setAnswers({ ...answers, [q.id]: o.value })} className="w-6 h-6 accent-[#1B3A5C]" />
              {o.label}
            </label>
          ))}
        </fieldset>
        <button
          type="button"
          disabled={!chosen}
          className="w-full min-h-[52px] bg-[#1B3A5C] text-white rounded-xl text-lg font-bold disabled:opacity-50"
          onClick={() => {
            if (!last) return setStep(step + 1);
            updateInterests(profile.id, interestsFrom(answers), "citizen", answers);
            setDone(true);
          }}
        >
          {last ? "לשמור ולראות המלצות" : "להמשיך"}
        </button>
        {step > 0 ? (
          <button type="button" className="w-full min-h-[48px] border border-[#1B3A5C] text-[#1B3A5C] rounded-xl text-base font-semibold" onClick={() => setStep(step - 1)}>
            לחזור
          </button>
        ) : null}
      </main>
    </div>
  );
}
