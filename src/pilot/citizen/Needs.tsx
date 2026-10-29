import { useState } from "react";
import { Link } from "react-router-dom";
import { useT } from "../i18n";
import { updateInterests } from "../store";
import { Alert } from "../components/Frame";
import { HelpButton, PageTitle, useCitizen } from "./common";

/** הבנת הצורך: שתי שאלות, שלוש תשובות בכל אחת. התשובות מסדרות את ההמלצות. */
const STEP1 = ["belonging", "health_function", "prevention_products"];
const STEP2 = ["resilience", "digital", "enough"];

export default function CitizenNeeds() {
  const { t } = useT();
  const { profile } = useCitizen();
  const [step, setStep] = useState(1);
  const [first, setFirst] = useState<string | null>(null);
  const [second, setSecond] = useState<string | null>(null);
  const options = step === 1 ? STEP1 : STEP2;
  const value = step === 1 ? first : second;

  if (step === 3) {
    return (
      <>
        <PageTitle>{t.needsTitle}</PageTitle>
        <Alert tone="success" live>
          <p>{t.needsSaved}</p>
        </Alert>
        <Link to="/citizen/find" className="p-btn p-btn--primary p-btn--block">{t.findService}</Link>
        <Link to="/citizen" className="p-btn p-btn--ghost p-btn--block">{t.toHome}</Link>
      </>
    );
  }

  return (
    <>
      <PageTitle sub={`${step} / 2`}>{t.needsTitle}</PageTitle>
      <fieldset className="p-choices" key={step}>
        <legend>{step === 1 ? t.needsStep1 : t.needsStep2}</legend>
        {options.map((o) => (
          <label key={o} className="p-choice">
            <input type="radio" name={`need-${step}`} value={o} checked={value === o} onChange={() => (step === 1 ? setFirst(o) : setSecond(o))} />
            {t.needsOption[o]}
          </label>
        ))}
      </fieldset>
      <button
        type="button"
        className="p-btn p-btn--primary p-btn--block"
        disabled={!value}
        onClick={() => {
          if (step === 1) return setStep(2);
          updateInterests(profile.id, [first, second].filter((x): x is string => Boolean(x) && x !== "enough"), "citizen");
          setStep(3);
        }}
      >
        {step === 1 ? t.next : t.save}
      </button>
      <HelpButton />
    </>
  );
}
