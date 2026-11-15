import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { selectionRules, suggestByDomain } from "@/lib/suggestions";
import { realServices } from "@/data/realServices";
import { Alert, useTitle } from "../components/Frame";
import { book, cancelBooking, logReview, usePilot } from "../store";
import { priceOf } from "../services";
import { profileFor } from "../questionnaire";
import { whySentence } from "../why";
import { useCaseload } from "./CompanionShell";

const VERDICTS = [
  { id: "worked", label: "עבד" },
  { id: "partly", label: "עבד חלקית" },
  { id: "replace", label: "להחליף" },
] as const;

/** מעקב חודשי: מה עבד ומה להחליף. שינוי אחד בחודש, בליווי המלווה (selection_change_months). */
export default function CompanionReview() {
  const { id = "" } = useParams();
  const { derived } = usePilot();
  const person = useCaseload().find((p) => p.id === id);
  const [verdicts, setVerdicts] = useState<Record<string, (typeof VERDICTS)[number]["id"]>>({});
  const [swap, setSwap] = useState<Record<string, string>>({});
  const [msg, setMsg] = useState<string | null>(null);
  useTitle(`מעקב חודשי: ${person?.name ?? ""}`);

  const profile = profileFor(id, derived.answers.get(id));
  const active = derived.bookings.filter((b) => b.citizenId === id && b.status === "booked");
  const month = new Date().toISOString().slice(0, 7);
  const changedThisMonth = derived.reviews.some((r) => r.citizenId === id && r.verdict === "replace" && r.at.slice(0, 7) === month);
  const rules = selectionRules();
  const domains = useMemo(() => (profile ? suggestByDomain(profile, profile.neighborhood) : []), [profile]);

  if (!person) return <h1>לא נמצא בתיק</h1>;

  const alternativesFor = (serviceId: string) => {
    const core = realServices.find((s) => s.id === serviceId)?.coreCategoryId;
    const booked = new Set(active.map((b) => b.serviceId));
    return (domains.find((d) => d.domainId === core)?.items ?? []).filter((x) => !booked.has(x.service.id) && !x.service.gatedByCompanion).slice(0, 2);
  };

  return (
    <>
      <div className="p-stack" style={{ gap: "0.25em" }}>
        <h1>מעקב חודשי: {person.name}</h1>
        <p className="p-muted">
          מה עבד ומה להחליף. שינוי אחד ב-{rules.changeMonths === 1 ? "חודש" : `${rules.changeMonths} חודשים`}, בליווי המלווה (הצעה, ממתין להכרעה).
        </p>
      </div>
      {msg ? (
        <Alert tone="success" live>
          <p>{msg}</p>
        </Alert>
      ) : null}
      {active.length === 0 ? <p>אין שירותים פעילים. אפשר להתחיל בפגישה משותפת.</p> : null}
      <ul className="p-list">
        {active.map((b) => {
          const v = verdicts[b.id];
          const alts = v === "replace" ? alternativesFor(b.serviceId) : [];
          return (
            <li key={b.id} className="p-card">
              <h2>{b.serviceName}</h2>
              <div className="p-tabs" role="group" aria-label={`איך היה: ${b.serviceName}`}>
                {VERDICTS.map((x) => (
                  <button key={x.id} type="button" aria-pressed={v === x.id} onClick={() => setVerdicts({ ...verdicts, [b.id]: x.id })} disabled={x.id === "replace" && changedThisMonth}>
                    {x.label}
                  </button>
                ))}
              </div>
              {v === "replace" ? (
                alts.length ? (
                  <fieldset className="p-choices">
                    <legend style={{ fontSize: "1em" }}>במה להחליף?</legend>
                    {alts.map(({ service: s, result }) => (
                      <label key={s.id} className="p-choice" style={{ alignItems: "flex-start" }}>
                        <input type="radio" name={`swap-${b.id}`} checked={swap[b.id] === s.id} onChange={() => setSwap({ ...swap, [b.id]: s.id })} />
                        <span>
                          <strong>{s.name}</strong>
                          <br />
                          <span className="p-muted">{whySentence(result, s.coreCategoryId)}</span>
                        </span>
                      </label>
                    ))}
                  </fieldset>
                ) : (
                  <p className="p-muted">אין כרגע חלופה באותו תחום. אפשר לבטל ולבחור בפגישה משותפת.</p>
                )
              ) : null}
              {v ? (
                <button
                  type="button"
                  className="p-btn p-btn--primary"
                  disabled={v === "replace" && !swap[b.id]}
                  onClick={() => {
                    logReview(id, b.serviceId, v);
                    if (v === "replace") {
                      const next = alts.find((x) => x.service.id === swap[b.id])?.service;
                      if (next) {
                        cancelBooking({ citizenId: id, bookingId: b.id, charged: false, reason: "monthly_review_swap", actor: "companion" });
                        const p = priceOf(next);
                        book({ citizenId: id, serviceId: next.id, serviceName: next.name, slot: null, coveredShekel: p.covered, copayShekel: p.copay, actor: "citizen" });
                        setMsg(`${b.serviceName} הוחלף ב${next.name}.`);
                      }
                    } else setMsg("המעקב נשמר ביומן.");
                    const { [b.id]: _done, ...rest } = verdicts;
                    setVerdicts(rest);
                  }}
                >
                  {v === "replace" ? "להחליף ולתעד" : "לשמור ביומן"}
                </button>
              ) : null}
            </li>
          );
        })}
      </ul>
      {changedThisMonth ? <p className="p-muted">כבר הוחלף שירות החודש. את ההחלפה הבאה עושים בחודש הבא.</p> : null}
      <Link to={`/companion/person/${id}`} className="p-btn p-btn--ghost">לחזור לתיק</Link>
    </>
  );
}
