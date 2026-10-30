import { Link } from "react-router-dom";
import { CheckCircle2, Clock, PauseCircle, XCircle } from "lucide-react";
import { formatSlot, useT } from "../i18n";
import { usePilot } from "../store";
import { HelpButton, PageTitle, useCitizen } from "./common";

const BADGE = {
  booked: { tone: "ok", Icon: CheckCircle2 },
  paused: { tone: "wait", Icon: PauseCircle },
  cancelled: { tone: "neutral", Icon: XCircle },
  open: { tone: "wait", Icon: Clock },
  approved: { tone: "ok", Icon: CheckCircle2 },
  rejected: { tone: "bad", Icon: XCircle },
  done: { tone: "neutral", Icon: CheckCircle2 },
} as const;

function StatusBadge(props: { status: keyof typeof BADGE; text: string }) {
  const { tone, Icon } = BADGE[props.status];
  return (
    <span className={`p-badge p-badge--${tone}`}>
      <Icon aria-hidden="true" size={16} />
      {props.text}
    </span>
  );
}

export default function CitizenActivities() {
  const { t } = useT();
  const { derived } = usePilot();
  const { profile } = useCitizen();
  const bookings = derived.bookings
    .filter((b) => b.citizenId === profile.id)
    .sort((a, b) => Number(a.status === "cancelled") - Number(b.status === "cancelled") || (a.slot ?? a.createdAt).localeCompare(b.slot ?? b.createdAt));
  const requests = derived.requests.filter((r) => r.citizenId === profile.id).reverse();

  return (
    <>
      <PageTitle>{t.activitiesTitle}</PageTitle>
      <section className="p-stack" aria-labelledby="upcoming-title">
        <h2 id="upcoming-title">{t.upcoming}</h2>
        {bookings.length === 0 ? (
          <p>{t.noActivities}</p>
        ) : (
          <ul className="p-list">
            {bookings.map((b) => (
              <li key={b.id} className="p-card">
                <h3>{b.serviceName}</h3>
                <p>{b.slot ? formatSlot(t, b.slot) : t.coordinated}</p>
                <p>
                  <StatusBadge status={b.status} text={t.status[b.status]} />
                </p>
                {b.status === "booked" ? (
                  <Link to={`/citizen/cancel/${b.id}`} className="p-btn p-btn--secondary p-btn--block" aria-label={`${t.cancel}: ${b.serviceName}`}>
                    {t.cancel}
                  </Link>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      {requests.length ? (
        <section className="p-stack" aria-labelledby="requests-title">
          <h2 id="requests-title">{t.requestsTitle}</h2>
          <ul className="p-list">
            {requests.map((r) => (
              <li key={r.id} className="p-card">
                <h3>{r.kind === "callback" ? t.callbackRequest : t.gatedRequest(r.serviceName ?? "")}</h3>
                <p>
                  <StatusBadge status={r.status} text={t.status[r.status]} />
                </p>
                {r.status === "rejected" ? (
                  <>
                    {r.reason ? <p>{t.rejectedWhy(r.reason)}</p> : null}
                    <p>{t.rejectedNext}</p>
                  </>
                ) : null}
                {r.status === "approved" && r.kind === "gated_service" && r.serviceId ? (
                  <>
                    <p>{t.approvedNext}</p>
                    <Link to={`/citizen/book/${encodeURIComponent(r.serviceId)}`} className="p-btn p-btn--primary p-btn--block" aria-label={`${t.book}: ${r.serviceName}`}>
                      {t.book}
                    </Link>
                  </>
                ) : null}
              </li>
            ))}
          </ul>
        </section>
      ) : null}
      <HelpButton />
    </>
  );
}
