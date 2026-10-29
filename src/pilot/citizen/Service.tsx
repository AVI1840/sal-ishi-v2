import { Link, useNavigate, useParams } from "react-router-dom";
import type { RealService } from "@/data/realServices";
import type { Strings } from "../i18n/he";
import { formatSlot, useT } from "../i18n";
import { createRequest, usePilot } from "../store";
import { cancelRuleOf, isCoordinated, isProduct, priceOf, serviceById, slotsFor } from "../services";
import { Alert } from "../components/Frame";
import { HelpButton, PageTitle, reasonKey, useCitizen, useWallet } from "./common";

export function whereText(t: Strings, s: RealService): string {
  if (isProduct(s)) return t.delivered;
  if (s.serviceMode === "home" || s.deliveryMode === "home") return t.atHome;
  if (s.serviceMode === "remote" || s.deliveryMode === "remote") return t.remote;
  if (s.reach === "national") return t.nationwide;
  return t.inNeighborhood(s.neighborhood);
}

export function ruleText(t: Strings, s: RealService): string[] {
  const rule = cancelRuleOf(s);
  const lines = [rule.noticeHours === null ? (rule.charged ? t.rule.unknown : t.rule.free) : rule.charged ? t.rule.notice(rule.noticeHours) : t.rule.noticeNoCharge(rule.noticeHours)];
  if (rule.proposal && (rule.noticeHours !== null || rule.charged)) lines.push(t.rule.notFinal);
  return lines;
}

export default function CitizenService() {
  const { id = "" } = useParams();
  const { t } = useT();
  const navigate = useNavigate();
  const { derived } = usePilot();
  const { profile } = useCitizen();
  const wallet = useWallet();
  const s = serviceById(decodeURIComponent(id));

  if (!s) {
    return (
      <>
        <PageTitle>{t.findTitle}</PageTitle>
        <Link to="/citizen/find" className="p-btn p-btn--secondary p-btn--block">{t.back}</Link>
      </>
    );
  }

  const price = priceOf(s);
  const slots = slotsFor(s);
  const hospitalized = derived.hospitalized.has(profile.id);
  const tooExpensive = !price.unknown && price.covered > wallet.left;
  const openRequest = derived.requests.find((r) => r.citizenId === profile.id && r.serviceId === s.id && r.kind === "gated_service" && (r.status === "open" || r.status === "approved"));
  const gated = s.gatedByCompanion === true && openRequest?.status !== "approved";

  return (
    <>
      <PageTitle>{s.name}</PageTitle>
      <section className="p-card">
        <dl className="p-dl">
          <div>
            <dt>{t.reasonTitle}</dt>
            <dd>{t.reason[reasonKey(s)]}</dd>
          </div>
          <div>
            <dt>{t.where}</dt>
            <dd>{whereText(t, s)}</dd>
          </div>
          {!isProduct(s) ? (
            <div>
              <dt>{t.when}</dt>
              <dd>{isCoordinated(s) || slots.length === 0 ? t.coordinated : t.slotsSummary(formatSlot(t, slots[0]))}</dd>
            </div>
          ) : null}
          <div>
            <dt>{t.cost}</dt>
            <dd>
              {price.unknown ? t.costUnknown(price.total) : t.costLine(price.covered, price.copay)}
              {s.unit ? <span className="p-muted"> ({t.perUnit(s.unit)})</span> : null}
            </dd>
          </div>
          {!isProduct(s) ? (
            <div>
              <dt>{t.cancelTitle}</dt>
              <dd className="p-stack" style={{ gap: "0.25em" }}>
                {ruleText(t, s).map((line) => (
                  <span key={line}>{line}</span>
                ))}
              </dd>
            </div>
          ) : null}
          <div>
            <dt>{t.who}</dt>
            <dd>{t.whoApproved}</dd>
          </div>
        </dl>
      </section>

      {hospitalized ? (
        <Alert tone="info">
          <p>{t.hospitalBlock}</p>
        </Alert>
      ) : gated ? (
        <>
          <Alert tone="info">
            <p>{t.gatedExplain}</p>
            {openRequest ? <p><strong>{t.status.open}</strong></p> : null}
          </Alert>
          {!openRequest ? (
            <button
              type="button"
              className="p-btn p-btn--primary p-btn--block"
              onClick={() => {
                createRequest({ citizenId: profile.id, kind: "gated_service", serviceId: s.id, serviceName: s.name, actor: "citizen" });
                navigate("/citizen/activities");
              }}
            >
              {t.askCompanion}
            </button>
          ) : null}
        </>
      ) : tooExpensive ? (
        <Alert tone="warning">
          <p>{t.notEnough}</p>
        </Alert>
      ) : (
        <Link to={`/citizen/book/${encodeURIComponent(s.id)}`} className="p-btn p-btn--primary p-btn--block">
          {t.book}
        </Link>
      )}
      <button type="button" className="p-btn p-btn--ghost p-btn--block" onClick={() => navigate(-1)}>
        {t.back}
      </button>
      <HelpButton />
    </>
  );
}
