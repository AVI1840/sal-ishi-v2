import { Link } from "react-router-dom";
import { CalendarCheck, Search } from "lucide-react";
import { formatSlot, useT } from "../i18n";
import { isDemo } from "../settings";
import { usePilot } from "../store";
import { HelpButton, PageTitle, useCitizen, useWallet } from "./common";

export default function CitizenHome() {
  const { t } = useT();
  const { derived } = usePilot();
  const { profile, firstName } = useCitizen();
  const wallet = useWallet();
  const month = t.monthNames[new Date().getMonth()];
  const next = derived.bookings
    .filter((b) => b.citizenId === profile.id && b.status !== "cancelled")
    .sort((a, b) => (a.slot ?? a.createdAt).localeCompare(b.slot ?? b.createdAt))[0];
  const usedPct = wallet.total ? Math.round((wallet.used / wallet.total) * 100) : 0;

  return (
    <>
      <PageTitle>{t.hello(firstName)}</PageTitle>

      <section className="p-wallet" aria-labelledby="wallet-title">
        <h2 id="wallet-title" style={{ color: "#fff", fontSize: "1.05em" }}>
          {t.walletTitle(month)}
        </h2>
        <p>{t.walletLeft}</p>
        <p className="p-wallet__amount">₪{wallet.left}</p>
        <p>{t.walletOf(wallet.total)}</p>
        <div className="p-progress" role="img" aria-label={t.walletUsedBar(wallet.used, wallet.total)}>
          <span style={{ width: `${usedPct}%` }} />
        </div>
        <p className="p-small">{wallet.left === 0 ? t.walletEmpty : t.walletRenews}</p>
        {isDemo() ? <p className="p-small" data-no-read>{t.walletDemoNote}</p> : null}
      </section>

      <section className="p-card p-card--accent" aria-labelledby="next-title">
        <h2 id="next-title">{t.nextActivity}</h2>
        {next ? (
          <>
            <p style={{ fontWeight: 600 }}>{next.serviceName}</p>
            <p>{next.slot ? formatSlot(t, next.slot) : t.coordinated}</p>
            {next.status === "paused" ? <p className="p-badge p-badge--wait">{t.status.paused}</p> : null}
            <Link to="/citizen/activities" className="p-btn p-btn--secondary p-btn--block">
              <CalendarCheck aria-hidden="true" size={20} />
              {t.toActivity}
            </Link>
          </>
        ) : (
          <p>{t.noActivities}</p>
        )}
      </section>

      <Link to="/citizen/find" className="p-btn p-btn--primary p-btn--block">
        <Search aria-hidden="true" size={22} />
        {t.findService}
      </Link>
      <Link to="/citizen/needs" className="p-btn p-btn--ghost p-btn--block">
        {t.whatMatters}
      </Link>
      <HelpButton />
    </>
  );
}
