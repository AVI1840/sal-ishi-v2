// תנאי השירות לפי מודל התשלום של החשכ"ל: ביטול, אי-הגעה, אשפוז, מחיר לשעה
// וחלוקת הנקודות. תצוגה בלבד, כל ערך נקרא מההגדרות. משותף לשטח ולמטה.

import {
  HOSPITALIZATION_TEXT,
  SERVICE_MODE_LABELS,
  hourlyPrice,
  isProduct,
  isProposal,
  pointsSplit,
  productsQuarterlyCapPoints,
  qolMode,
  serviceTerms,
  statusNote,
  type Seed,
  type Service,
} from "@sal-ishi/core";
import type { ReactNode } from "react";
import { Badge, ProposalBadge } from "./controls";

const points = (n: number | null) => (n === null ? "טרם נקבע" : `${n.toLocaleString("he-IL", { maximumFractionDigits: 2 })} נקודות`);

function Proposal(props: { seed: Seed; keys: string[] }) {
  const key = props.keys.find((k) => isProposal(props.seed.settings, k));
  return key ? <> <ProposalBadge note={statusNote(props.seed.settings, key)} /></> : null;
}

function Row(props: { term: string; children: ReactNode }) {
  return (
    <div className="terms__row">
      <dt>{props.term}</dt>
      <dd>{props.children}</dd>
    </div>
  );
}

/** תנאי השירות לשירות אחד. מחיר בשקלים מוצג רק כש-showShekel (שטח ומטה, לא לאזרח). */
export function ServiceTermsPanel(props: { service: Service; seed: Seed; showShekel?: boolean; title?: string }) {
  const { service: s, seed } = props;
  const { settings } = seed;
  const product = isProduct(seed, s.categoryCode);
  const terms = serviceTerms(s, seed);
  const price = s.pricePoints ?? (s.unitPrice !== undefined ? s.unitPrice * settings.points_per_shekel : undefined);
  const split = price !== undefined && s.categoryCode ? pointsSplit(s, price, seed) : null;
  const hourly = hourlyPrice(s);

  return (
    <section className="terms" aria-label={props.title ?? "תנאי השירות לפי מודל התשלום"}>
      <h3 className="terms__title">{props.title ?? "תנאי השירות לפי מודל התשלום"}</h3>
      <dl className="terms__list">
        {product ? (
          <>
            <Row term="תקרה רבעונית למוצרים">
              {productsQuarterlyCapPoints(settings)} נקודות ברבעון
              <Proposal seed={seed} keys={["products_quarterly_cap_share"]} />
            </Row>
            <Row term="רצפת המגוון">{settings.products_count_in_floor ? "נספר ברצפה" : "לא נספר ברצפה"}</Row>
          </>
        ) : terms ? (
          <>
            <Row term="אופן מתן">
              {SERVICE_MODE_LABELS[terms.mode]}
              {s.capacityLimited ? <> <Badge tone="info">מוגבל מקום, רשימת המתנה</Badge></> : null}
            </Row>
            <Row term="הודעה מראש לביטול">
              {terms.cancellationNoticeHours === null ? "טרם נקבע" : `${terms.cancellationNoticeHours} שעות`}
              <Proposal seed={seed} keys={["cancellation_notice_hours"]} />
            </Row>
            <Row term="אי-הגעה">
              <Badge tone={terms.noShowCharged ? "warning" : "success"}>{terms.noShowCharged ? "מחויבת" : "לא מחויבת"}</Badge>
              <Proposal seed={seed} keys={["no_show_charge_rule"]} />
            </Row>
            <Row term="אשפוז">
              {HOSPITALIZATION_TEXT[terms.hospitalizationRefund] ?? terms.hospitalizationRefund}
              {terms.notifyCompanion ? ", עם הודעה למלווה" : ""}
              <Proposal seed={seed} keys={["hospitalization_refund"]} />
            </Row>
          </>
        ) : (
          <Row term="אופן מתן">
            <Badge tone="warning">חסר: בחרו אופן מתן כדי לראות את כללי הביטול ואי-ההגעה</Badge>
          </Row>
        )}
        {s.gatedByCompanion ? (
          <Row term="פתיחה">
            באישור מלווה{s.gateReason?.trim() ? `: ${s.gateReason.trim()}` : ""}
          </Row>
        ) : null}
        {props.showShekel && !product ? (
          <Row term="מחיר לשעה">{hourly === null ? "חסרות שעות ליחידה" : `${hourly.toLocaleString("he-IL", { maximumFractionDigits: 2 })} ש"ח`}</Row>
        ) : null}
        {split ? (
          <Row term="מהארנק / על הקשיש">
            {points(split.coveredPoints)} / {points(split.copayPoints)}
            {split.copayBasis === "qol_fixed" || split.copayBasis === "qol_percent" ? (
              <span className="muted"> (איכות חיים: {qolMode(settings) === "fixed_amount" ? "סכום קבוע מהנקודות" : "אחוז השתתפות"})</span>
            ) : null}
            {split.copayBasis.startsWith("qol") ? <Proposal seed={seed} keys={["qol_mode"]} /> : null}
          </Row>
        ) : null}
      </dl>
    </section>
  );
}
