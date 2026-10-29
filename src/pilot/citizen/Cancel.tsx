import { useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatSlot, useT } from "../i18n";
import { cancelBooking, usePilot } from "../store";
import { lateCancelCharged, serviceById } from "../services";
import { Alert } from "../components/Frame";
import { HelpButton, PageTitle } from "./common";

export default function CitizenCancel() {
  const { bookingId = "" } = useParams();
  const { t } = useT();
  const { derived } = usePilot();
  const [done, setDone] = useState<{ charged: boolean; amount: number } | null>(null);
  const b = derived.bookings.find((x) => x.id === bookingId);

  if (done) {
    return (
      <>
        <PageTitle>{t.cancelledTitle}</PageTitle>
        <Alert tone="success" live>
          <p>{done.charged ? t.cancelledNoRefund : t.cancelledRefund(done.amount)}</p>
        </Alert>
        <Link to="/citizen" className="p-btn p-btn--primary p-btn--block">{t.toHome}</Link>
        <Link to="/citizen/activities" className="p-btn p-btn--ghost p-btn--block">{t.toActivities}</Link>
      </>
    );
  }

  if (!b || b.status !== "booked") {
    return (
      <>
        <PageTitle>{t.activitiesTitle}</PageTitle>
        <Link to="/citizen/activities" className="p-btn p-btn--secondary p-btn--block">{t.toActivities}</Link>
      </>
    );
  }

  const charged = lateCancelCharged(b, serviceById(b.serviceId));
  return (
    <>
      <PageTitle>{t.cancelAsk(b.serviceName)}</PageTitle>
      <section className="p-card">
        <p>{b.slot ? formatSlot(t, b.slot) : t.coordinated}</p>
        <Alert tone={charged ? "warning" : "info"}>
          <p>{charged ? t.cancelLate : t.cancelFree}</p>
        </Alert>
      </section>
      <button
        type="button"
        className="p-btn p-btn--danger p-btn--block"
        onClick={() => {
          cancelBooking({ citizenId: b.citizenId, bookingId: b.id, charged, reason: charged ? "late" : "on_time", actor: "citizen" });
          setDone({ charged, amount: b.coveredShekel });
        }}
      >
        {t.cancelYes}
      </button>
      <Link to="/citizen/activities" className="p-btn p-btn--ghost p-btn--block">{t.cancelNo}</Link>
      <HelpButton />
    </>
  );
}
