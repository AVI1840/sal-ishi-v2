import { useState } from "react";
import { Phone, PhoneCall } from "lucide-react";
import { useT } from "../i18n";
import { appSettings, callCenterNumber } from "../settings";
import { createRequest, usePilot } from "../store";
import { Alert } from "../components/Frame";
import { PageTitle, useCitizen } from "./common";

export default function CitizenHelp() {
  const { t } = useT();
  const { state, derived } = usePilot();
  const { profile } = useCitizen();
  const [sent, setSent] = useState(false);
  const pending = derived.requests.some((r) => r.citizenId === profile.id && r.kind === "callback" && r.status === "open");
  const { name, cover_name } = appSettings.companion;

  return (
    <>
      <PageTitle>{t.helpTitle}</PageTitle>
      <section className="p-card p-card--accent" aria-labelledby="callback-title">
        <h2 id="callback-title">{t.talkToCompanion}</h2>
        {sent || pending ? (
          <Alert tone="success" live>
            <p>{sent ? (state.simulation.companionAway ? t.companionAway(name, cover_name) : t.callbackSent(name)) : t.callbackPending}</p>
          </Alert>
        ) : (
          <>
            <p>{state.simulation.companionAway ? t.companionAway(name, cover_name) : t.callMeBackHint}</p>
            <button
              type="button"
              className="p-btn p-btn--primary p-btn--block"
              onClick={() => {
                createRequest({ citizenId: profile.id, kind: "callback", actor: "citizen", note: state.simulation.companionAway ? `הועבר ל${cover_name}` : undefined });
                setSent(true);
              }}
            >
              <PhoneCall aria-hidden="true" size={22} />
              {t.callMeBack}
            </button>
          </>
        )}
        <a href={`tel:${callCenterNumber()}`} className="p-btn p-btn--secondary p-btn--block">
          <Phone aria-hidden="true" size={22} />
          {t.callCenter} <span dir="ltr">{callCenterNumber()}</span>
        </a>
      </section>
      <section className="p-card" aria-labelledby="howto-title">
        <h2 id="howto-title">{t.howToTitle}</h2>
        <ul className="p-stack" style={{ paddingInlineStart: "1.2em", margin: 0 }}>
          {t.howTo.map((line) => (
            <li key={line}>{line}</li>
          ))}
        </ul>
      </section>
    </>
  );
}
