import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { CheckCircle2 } from "lucide-react";
import { formatSlot, useT } from "../i18n";
import { book } from "../store";
import { isCoordinated, isProduct, priceOf, serviceById, slotsFor } from "../services";
import { Alert, useOnline } from "../components/Frame";
import { HelpButton, PageTitle, useCitizen } from "./common";
import { ruleText, whereText } from "./Service";

/** הזמנה בשלושה צעדים: מועד, בדיקה ואישור, סיום. */
export default function CitizenBook() {
  const { id = "" } = useParams();
  const { t } = useT();
  const online = useOnline();
  const { profile } = useCitizen();
  const s = serviceById(decodeURIComponent(id));
  const slots = s ? slotsFor(s) : [];
  const needsSlot = slots.length > 0;
  const [slot, setSlot] = useState<string | null>(null);
  const [step, setStep] = useState<"time" | "confirm" | "done">(needsSlot ? "time" : "confirm");

  if (!s) return <PageTitle>{t.findTitle}</PageTitle>;
  const price = priceOf(s);

  if (step === "done") {
    return (
      <>
        <PageTitle>{t.bookedTitle}</PageTitle>
        <Alert tone="success" live>
          <p style={{ display: "flex", gap: "0.4em", alignItems: "center" }}>
            <CheckCircle2 aria-hidden="true" size={22} />
            {t.bookedText(s.name)}
          </p>
          <p>{slot ? formatSlot(t, slot) : isProduct(s) ? t.delivered : t.coordinated}</p>
          {!online ? <p>{t.bookedOffline}</p> : null}
        </Alert>
        {!isProduct(s) ? (
          <section className="p-card">
            <h2>{t.cancelTitle}</h2>
            {ruleText(t, s).map((line) => (
              <p key={line}>{line}</p>
            ))}
          </section>
        ) : null}
        <Link to="/citizen/activities" className="p-btn p-btn--primary p-btn--block">{t.toActivities}</Link>
        <Link to="/citizen" className="p-btn p-btn--ghost p-btn--block">{t.toHome}</Link>
      </>
    );
  }

  if (step === "time") {
    return (
      <>
        <PageTitle sub={s.name}>{t.chooseTime}</PageTitle>
        <fieldset className="p-choices">
          <legend className="p-visually-hidden">{t.chooseTime}</legend>
          {slots.map((iso) => (
            <label key={iso} className="p-choice">
              <input type="radio" name="slot" value={iso} checked={slot === iso} onChange={() => setSlot(iso)} />
              {formatSlot(t, iso)}
            </label>
          ))}
        </fieldset>
        <p className="p-muted">{t.chooseTimeHint}</p>
        <button type="button" className="p-btn p-btn--primary p-btn--block" disabled={!slot} onClick={() => setStep("confirm")}>
          {t.confirmTitle}
        </button>
        <Link to={`/citizen/service/${encodeURIComponent(s.id)}`} className="p-btn p-btn--ghost p-btn--block">{t.back}</Link>
        <HelpButton />
      </>
    );
  }

  return (
    <>
      <PageTitle>{t.confirmTitle}</PageTitle>
      <section className="p-card p-card--accent">
        <h2>{s.name}</h2>
        <dl className="p-dl">
          <div>
            <dt>{t.when}</dt>
            <dd>{slot ? formatSlot(t, slot) : isProduct(s) ? t.delivered : isCoordinated(s) ? t.coordinated : "-"}</dd>
          </div>
          <div>
            <dt>{t.where}</dt>
            <dd>{whereText(t, s)}</dd>
          </div>
          <div>
            <dt>{t.cost}</dt>
            <dd>{price.unknown ? t.costUnknown(price.total) : t.costLine(price.covered, price.copay)}</dd>
          </div>
          {!isProduct(s) ? (
            <div>
              <dt>{t.cancelTitle}</dt>
              <dd>{ruleText(t, s)[0]}</dd>
            </div>
          ) : null}
        </dl>
      </section>
      <button
        type="button"
        className="p-btn p-btn--primary p-btn--block"
        onClick={() => {
          book({ citizenId: profile.id, serviceId: s.id, serviceName: s.name, slot, coveredShekel: price.covered, copayShekel: price.copay, actor: "citizen" });
          setStep("done");
        }}
      >
        {t.confirm}
      </button>
      {needsSlot ? (
        <button type="button" className="p-btn p-btn--ghost p-btn--block" onClick={() => setStep("time")}>
          {t.back}
        </button>
      ) : (
        <Link to={`/citizen/service/${encodeURIComponent(s.id)}`} className="p-btn p-btn--ghost p-btn--block">{t.back}</Link>
      )}
      <HelpButton />
    </>
  );
}
