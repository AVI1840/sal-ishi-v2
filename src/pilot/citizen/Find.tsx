import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { ChevronLeft } from "lucide-react";
import { useT } from "../i18n";
import { appSettings } from "../settings";
import { usePilot } from "../store";
import { priceOf, recommend, servicesFor } from "../services";
import { Alert } from "../components/Frame";
import { HelpButton, PageTitle, reasonKey, useCitizen } from "./common";

export default function CitizenFind() {
  const { t } = useT();
  const { state, derived } = usePilot();
  const { profile, interests } = useCitizen();
  const [page, setPage] = useState(0);
  const per = appSettings.citizen.max_choices_per_step;

  const list = useMemo(() => {
    if (state.simulation.noServices || servicesFor(profile.neighborhood).length === 0) return [];
    const booked = new Set(derived.bookings.filter((b) => b.citizenId === profile.id && b.status !== "cancelled").map((b) => b.serviceId));
    return recommend(profile, interests, booked);
  }, [profile, interests, derived.bookings, state.simulation.noServices]);

  const pages = Math.max(1, Math.ceil(list.length / per));
  const shown = list.slice(page * per, page * per + per);

  if (list.length === 0) {
    return (
      <>
        <PageTitle>{t.findTitle}</PageTitle>
        <Alert tone="info">
          <h2>{t.noServicesTitle}</h2>
          <p>{t.noServicesText}</p>
        </Alert>
        <HelpButton />
      </>
    );
  }

  return (
    <>
      <PageTitle sub={t.findIntro}>{t.findTitle}</PageTitle>
      <ul className="p-list">
        {shown.map((s) => {
          const price = priceOf(s);
          return (
            <li key={s.id} className="p-card">
              <h2>{s.name}</h2>
              <p>
                <strong>{t.reasonTitle}: </strong>
                {t.reason[reasonKey(s)]}
              </p>
              <p>{price.unknown ? t.costUnknown(price.total) : t.costLine(price.covered, price.copay)}</p>
              <Link to={`/citizen/service/${encodeURIComponent(s.id)}`} className="p-btn p-btn--secondary p-btn--block" aria-label={`${t.details}: ${s.name}`}>
                {t.details}
                <ChevronLeft aria-hidden="true" size={20} />
              </Link>
            </li>
          );
        })}
      </ul>
      {pages > 1 ? (
        <button type="button" className="p-btn p-btn--ghost p-btn--block" onClick={() => setPage((page + 1) % pages)}>
          {page + 1 < pages ? t.showMore : t.backToStart}
        </button>
      ) : null}
      <HelpButton />
    </>
  );
}
