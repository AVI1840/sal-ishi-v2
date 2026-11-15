import { useMemo, useState, type CSSProperties } from "react";
import { Link, useParams } from "react-router-dom";
import { Square, Volume2 } from "lucide-react";
import { catalogState } from "@/data/catalogSource";
import { configureMatching, getActiveWeights } from "@/domain/matchingEngine";
import { selectionRules, suggestByDomain } from "@/lib/suggestions";
import { Alert, useTitle } from "../components/Frame";
import { STRINGS } from "../i18n";
import { appSettings, isDemo } from "../settings";
import { book, updateInterests, usePilot } from "../store";
import { useReadAloud } from "../speech";
import { monthlyWalletShekel, priceOf, walletOf } from "../services";
import { amount } from "@/lib/wallet";
import { DEMO_ANSWERS, QUESTIONS, interestsFrom, profileFor } from "../questionnaire";
import { whySentence } from "../why";
import { useCaseload } from "./CompanionShell";

const he = STRINGS.he;
const LAYER_LABEL = { prevention: "מניעת הידרדרות", motivation: "רצון ומוטיבציה", profileFit: "התאמה ליכולות", proximity: "זמינות מעשית" } as const;

/** משקלות האלגוריתם, בהדגמה בלבד: שינוי משנה את ההמלצות מיד. הערכים הקבועים בהגדרות המטה. */
function WeightsPanel(props: { onChange: () => void }) {
  const [w, setW] = useState(() => ({ ...getActiveWeights() }));
  const total = Math.round((w.prevention + w.motivation + w.profileFit + w.proximity + w.socialProof) * 100);
  return (
    <details className="p-card">
      <summary style={{ fontWeight: 600, cursor: "pointer", minHeight: 44 }}>משקלות ההתאמה (הצעה, ממתין להכרעה)</summary>
      <p className="p-muted p-small">ועדת הסל קובעת. כאן אפשר לשנות במכשיר הזה ולראות שההמלצות מתעדכנות מיד. ניסיון והמלצות: 0, כי בשלב א' זה מגיע מספק העל.</p>
      <div className="p-stack">
        {(Object.keys(LAYER_LABEL) as (keyof typeof LAYER_LABEL)[]).map((k) => (
          <label key={k} className="p-row" style={{ justifyContent: "space-between" }}>
            <span>{LAYER_LABEL[k]}</span>
            <input
              type="number"
              className="p-input"
              style={{ width: "6em" }}
              min={0}
              max={100}
              step={5}
              value={Math.round(w[k] * 100)}
              onChange={(e) => {
                const next = { ...w, [k]: Math.max(0, Math.min(100, Number(e.target.value))) / 100 };
                setW(next);
                configureMatching({ weights: next });
                props.onChange();
              }}
            />
          </label>
        ))}
        <p className={total === 100 ? "p-muted p-small" : "p-small"} role="status">
          סך הכל {total}%{total === 100 ? "" : ". הסכום צריך להיות 100."}
        </p>
        <button
          type="button"
          className="p-btn p-btn--ghost"
          onClick={() => {
            const base = { ...catalogState.seed.settings.matching_weights } as typeof w;
            setW(base);
            configureMatching({ weights: base });
            props.onChange();
          }}
        >
          לחזור לערכים מההגדרות
        </button>
      </div>
    </details>
  );
}

export default function CompanionSession() {
  const { id = "" } = useParams();
  const { derived } = usePilot();
  const people = useCaseload();
  const person = people.find((p) => p.id === id);
  const saved = derived.answers.get(id);
  const [answers, setAnswers] = useState<Record<string, string>>(saved ?? {});
  const [step, setStep] = useState<number | "recs" | "done">(saved ? "recs" : 0);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [version, setVersion] = useState(0);
  const reader = useReadAloud("he-IL");
  useTitle(`פגישה משותפת: ${person?.name ?? ""}`);

  const profile = profileFor(id, Object.keys(answers).length ? answers : undefined);
  const active = derived.bookings.filter((b) => b.citizenId === id && b.status !== "cancelled");
  const total = monthlyWalletShekel();
  // אותו ארנק כמו אצל האזרח: מהאירועים בלבד.
  const w = walletOf(derived.bookings, derived.incentives, id);
  const spent = w.reserved + w.used - w.bonus;
  const left = Math.max(0, total - spent);
  const rules = selectionRules();

  const domains = useMemo(
    () => (profile && step === "recs" ? suggestByDomain(profile, profile.neighborhood, { walletLeft: left * (catalogState.seed.settings.points_per_shekel || 1) }) : []),
    [profile?.id, JSON.stringify(answers), step, version, left],
  );

  if (!person || !profile) {
    return (
      <>
        <h1>פגישה משותפת</h1>
        <Alert tone="info">
          <p>לאדם הזה אין עדיין פרופיל בהדגמה. בהדגמה יש פגישה משותפת לשרה, לאהרון וליוסף.</p>
        </Alert>
        <Link to={`/companion/person/${id}`} className="p-btn p-btn--secondary">לחזור לתיק</Link>
      </>
    );
  }

  const byId = new Map(domains.flatMap((d) => d.items.map((x) => [x.service.id, x] as const)));
  const pickedItems = [...picked].map((sid) => byId.get(sid)).filter((x): x is NonNullable<typeof x> => Boolean(x));
  const pickedCost = pickedItems.reduce((sum, x) => sum + priceOf(x.service).covered, 0);
  const over = pickedCost > left;
  const tooMany = active.length + picked.size > rules.maxActive;
  const missingDomains = domains.filter((d) => !d.items.some((x) => picked.has(x.service.id)) && !active.some((b) => d.items.some((x) => x.service.id === b.serviceId)));

  // ── שאלון ──
  if (typeof step === "number") {
    const q = QUESTIONS[step]!;
    return (
      <div className="pilot--citizen" style={{ "--p-scale": 1.1 } as CSSProperties}>
        <div className="p-stack" data-read>
          <h1 style={{ fontSize: "1.2em" }}>פגישה משותפת עם {person.name}</h1>
          <p className="p-steps">
            שאלה {step + 1} מתוך {QUESTIONS.length}
          </p>
          <fieldset className="p-choices" key={q.id}>
            <legend>{q.text}</legend>
            {q.options.map((o) => (
              <label key={o.value} className="p-choice">
                <input type="radio" name={q.id} checked={answers[q.id] === o.value} onChange={() => setAnswers({ ...answers, [q.id]: o.value })} />
                {o.label}
              </label>
            ))}
          </fieldset>
        </div>
        <div className="p-stack" style={{ marginTop: "1em" }}>
          {reader.supported ? (
            <button type="button" className="p-btn p-btn--ghost" aria-pressed={reader.speaking} onClick={reader.speaking ? reader.stop : reader.read}>
              {reader.speaking ? <Square aria-hidden="true" size={18} /> : <Volume2 aria-hidden="true" size={20} />}
              {reader.speaking ? "לעצור" : "להקריא את השאלה"}
            </button>
          ) : null}
          <button type="button" className="p-btn p-btn--primary" disabled={!answers[q.id]} onClick={() => setStep(step + 1 < QUESTIONS.length ? step + 1 : "recs")}>
            {step + 1 < QUESTIONS.length ? "לשאלה הבאה" : "לראות המלצות"}
          </button>
          {step > 0 ? (
            <button type="button" className="p-btn p-btn--ghost" onClick={() => setStep(step - 1)}>
              לחזור
            </button>
          ) : null}
          {isDemo() && DEMO_ANSWERS[id] ? (
            <button type="button" className="p-btn p-btn--ghost" onClick={() => (setAnswers(DEMO_ANSWERS[id]!), setStep("recs"))}>
              למלא תשובות לדוגמה (הדגמה)
            </button>
          ) : null}
        </div>
      </div>
    );
  }

  // ── סיום ──
  if (step === "done") {
    return (
      <>
        <h1>הסל נבחר</h1>
        <Alert tone="success" live>
          <p>
            {pickedItems.length === 1 ? "נרשם שירות אחד" : `נרשמו ${pickedItems.length} שירותים`} בשביל {person.name}. נשאר בארנק החודש {amount(Math.max(0, left - pickedCost))}.
          </p>
        </Alert>
        <ul className="p-list">
          {pickedItems.map((x) => (
            <li key={x.service.id} className="p-card">
              <p style={{ fontWeight: 600 }}>{x.service.name}</p>
              <p className="p-muted">{whySentence(x.result, x.service.coreCategoryId)}</p>
            </li>
          ))}
        </ul>
        <p className="p-muted">במעקב החודשי בודקים יחד מה עבד ומה להחליף. שינוי אחד בחודש, בליווי המלווה.</p>
        <Link to={`/companion/review/${id}`} className="p-btn p-btn--secondary">למעקב החודשי</Link>
        <Link to={`/companion/person/${id}`} className="p-btn p-btn--ghost">לחזור לתיק</Link>
      </>
    );
  }

  // ── המלצות ובחירה משותפת ──
  return (
    <>
      <div className="p-stack" style={{ gap: "0.25em" }}>
        <h1>מה מתאים ל{person.name.split(" ")[0]}</h1>
        <p className="p-muted">2 עד 3 שירותים בכל תחום, לפי התשובות. בוחרים יחד. הבחירה של {person.name.split(" ")[0]}.</p>
      </div>

      <section className="p-wallet" aria-label="בדיקת תקציב" style={{ position: "sticky", top: 0, zIndex: 5 }}>
        <p>
          נבחר החודש {amount(pickedCost)} מתוך {amount(left)} שנשארו (ארנק של {amount(total)}).
        </p>
        <div className="p-progress" role="img" aria-label={`נבחר ${amount(pickedCost)} מתוך ${amount(left)}`}>
          <span style={{ width: `${left ? Math.min(100, Math.round((pickedCost / left) * 100)) : 100}%` }} />
        </div>
        <p className="p-small" role="status">
          {over ? `מעבר לארנק של החודש ב-${amount(pickedCost - left)}. כדאי להוריד שירות.` : `נשאר אחרי הבחירה: ${amount(left - pickedCost)}`}
        </p>
      </section>

      {isDemo() ? <WeightsPanel onChange={() => setVersion((v) => v + 1)} /> : null}

      {domains.map((d) => (
        <section key={d.domainId} className="p-card" aria-labelledby={`dom-${d.domainId}`}>
          <h2 id={`dom-${d.domainId}`}>{d.domainName}</h2>
          <ul className="p-list">
            {d.items.map(({ service: s, result }) => {
              const price = priceOf(s);
              const already = active.some((b) => b.serviceId === s.id);
              const checked = picked.has(s.id);
              return (
                <li key={s.id}>
                  <label className="p-choice" style={{ alignItems: "flex-start" }}>
                    <input
                      type="checkbox"
                      checked={checked || already}
                      disabled={already || s.gatedByCompanion === true || price.state === "full" || (!checked && tooMany)}
                      onChange={(e) => {
                        const next = new Set(picked);
                        if (e.target.checked) next.add(s.id);
                        else next.delete(s.id);
                        setPicked(next);
                      }}
                    />
                    <span className="p-stack" style={{ gap: "0.2em" }}>
                      <strong>{s.name}</strong>
                      <span>
                        <strong>למה זה מתאים: </strong>
                        {whySentence(result, d.domainId)}
                      </span>
                      <span className="p-muted">
                        {price.state === "full"
                          ? `${price.funder ?? "מממן אחר"} מממן את זה. הפניה בלבד.`
                          : price.unknown
                            ? he.costUnknown(price.total)
                            : he.costLine(price.covered, price.copay)}
                        {already ? " כבר בסל." : ""}
                        {s.gatedByCompanion ? " נפתח באישור המלווה, מהתיק." : ""}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
        </section>
      ))}

      {missingDomains.length ? (
        <Alert tone="info">
          <p>
            מומלץ לבחור לפחות שירות אחד מכל תחום. עוד לא נבחר: {missingDomains.map((d) => d.domainName).join(", ")}. זו המלצה, והבחירה של{" "}
            {person.name.split(" ")[0]}.
          </p>
        </Alert>
      ) : null}
      {tooMany ? (
        <Alert tone="warning">
          <p>עד {rules.maxActive} שירותים פעילים (הצעה, ממתין להכרעה).</p>
        </Alert>
      ) : null}

      <button
        type="button"
        className="p-btn p-btn--primary"
        disabled={picked.size === 0 || over}
        onClick={() => {
          updateInterests(id, interestsFrom(answers), "companion", answers);
          for (const x of pickedItems) {
            const price = priceOf(x.service);
            book({ citizenId: id, serviceId: x.service.id, serviceName: x.service.name, slot: null, coveredShekel: price.covered, copayShekel: price.copay, actor: "citizen" });
          }
          setStep("done");
        }}
      >
        לאשר את הבחירה ({picked.size})
      </button>
      <button type="button" className="p-btn p-btn--ghost" onClick={() => setStep(0)}>
        לחזור לשאלון
      </button>
      <p className="p-muted p-small">
        המחירים מחירי דמה. סכום הארנק ({amount(total)}) וההשתתפות מההגדרות.
      </p>
    </>
  );
}
