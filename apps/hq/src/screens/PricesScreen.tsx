// מחירי ייחוס: חציון לכל סוג שירות ויחידה על פני כל הפיילוטים, וחריגות.
// בלי מחיר גג (הכרעת החשכ"ל 28.10). חריגה מסומנת ולא חוסמת. גרסה 0.4: מצב
// מחיר הייחוס (מעקב, מחייב, מחייב בתחרות נמוכה), ומדד מחיר לשעה.

import { useState } from "react";
import { Link } from "react-router-dom";
import {
  XLSX_MIME,
  hourlyPriceIndex,
  isProposal,
  metricName,
  pricePeriod,
  referenceBindings,
  referencePriceMode,
  statusNote,
  writeWorkbook,
} from "@sal-ishi/core";
import { Alert, Badge, Button, PageHeader, ProposalBadge, SelectField, TableWrap, downloadBytes, todayStamp } from "@sal-ishi/ui";
import { percent, shekel, useHqAnalysis } from "../analysis";

export default function PricesScreen() {
  const { state, seed, refs, outliers, idx } = useHqAnalysis();
  const [category, setCategory] = useState("");
  const sById = new Map(state.services.map((s) => [s.id, s]));
  const proposal = String(seed.settings.price_outlier_status ?? "").startsWith("proposal");
  const mode = referencePriceMode(seed.settings);
  const MODE_LABEL: Record<string, string> = {
    monitor: "מעקב: חציון והתראה, בלי חסימה",
    binding: "מחייב בקטגוריות ורשויות שנבחרו",
    preactivated_low_competition: `מחייב אוטומטית בתחרות נמוכה (פחות מ-${seed.settings.low_competition_operator_threshold} ספקים בקטגוריה ושכונה)`,
  };
  const bindingOf = referenceBindings(state.services, seed);
  const bound = state.services
    .filter((s) => s.status === "אושר" && s.unitPrice !== undefined)
    .map((s) => ({ s, b: bindingOf(s) }))
    .filter(({ b }) => b.binding)
    .filter(({ s }) => !category || s.categoryCode === category);
  const latest = state.activity.map((a) => a.month).sort().at(-1) ?? new Date().toISOString().slice(0, 7);
  const hourly = hourlyPriceIndex(state.services, seed, latest).filter((r) => !category || r.categoryCode === category);

  const rows = refs
    .filter((r) => !category || idx.serviceTypes.get(r.serviceTypeId)?.category === category)
    .map((r) => {
      const prices = state.services
        .filter((s) => s.serviceTypeId === r.serviceTypeId && s.unit === r.unit && s.unitPrice !== undefined)
        .map((s) => s.unitPrice!);
      return {
        ...r,
        name: idx.serviceTypes.get(r.serviceTypeId)?.name ?? r.serviceTypeId,
        min: Math.min(...prices),
        max: Math.max(...prices),
        authorities: new Set(state.services.filter((s) => s.serviceTypeId === r.serviceTypeId && s.unit === r.unit).map((s) => s.authority)).size,
        outliers: outliers.filter((o) => o.serviceTypeId === r.serviceTypeId && o.unit === r.unit).length,
      };
    });

  const exportExcel = () => {
    const data = rows.map((r) => ({
      "סוג שירות": `${r.serviceTypeId} ${r.name}`,
      יחידה: r.unit,
      דגימות: r.samples,
      פיילוטים: r.authorities,
      "מחיר ייחוס (חציון)": r.median,
      מינימום: r.min,
      מקסימום: r.max,
      חריגות: r.outliers,
    }));
    downloadBytes(`מחירי_ייחוס_${todayStamp()}.xlsx`, writeWorkbook([{ name: "מחירי ייחוס", rows: data }]), XLSX_MIME);
  };

  return (
    <>
      <PageHeader
        title="מחירי ייחוס"
        description={`חציון של המחיר ליחידה לכל סוג שירות ויחידה, על פני כל הפיילוטים. מחושב רק כשיש לפחות ${seed.settings.reference_price_min_samples} דגימות. חריגה: יותר מ-${percent(seed.settings.price_outlier_threshold)} מעל החציון.`}
        actions={<Button variant="secondary" onClick={exportExcel} disabled={!rows.length}>הורדה ל-Excel</Button>}
      />
      {proposal ? <p><ProposalBadge /> סף החריגה עדיין בהכרעה.</p> : null}
      <Alert tone="info" title={`מצב מחיר הייחוס: ${MODE_LABEL[mode]}`}>
        {mode === "monitor"
          ? "המחיר לא מוגבל. חריגה מסומנת לבדיקה ולא חוסמת."
          : "בשירות שבו מחיר הייחוס מחייב, הארנק מכסה עד מחיר הייחוס, וההפרש מוצג כתשלום של הקשיש. הייצוא לספק העל מחושב לפי זה."}
        {" "}
        {isProposal(seed.settings, "reference_price_mode") ? <ProposalBadge note={statusNote(seed.settings, "reference_price_mode")} /> : null}
        {" "}<Link to="/rules">שינוי המצב בספרייה וכללים</Link>
      </Alert>
      <div style={{ maxWidth: 360 }}>
        <SelectField label="קטגוריה" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="כל הקטגוריות"
          options={seed.categories.map((c) => ({ value: c.code, label: `${c.code} ${c.name}` }))} />
      </div>

      <TableWrap label="מחירי ייחוס">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">סוג שירות</th>
              <th scope="col">יחידה</th>
              <th scope="col">דגימות</th>
              <th scope="col">פיילוטים</th>
              <th scope="col">מחיר ייחוס</th>
              <th scope="col">טווח</th>
              <th scope="col">חריגות</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={`${r.serviceTypeId}|${r.unit}`}>
                <th scope="row">{r.serviceTypeId} {r.name}</th>
                <td>{r.unit}</td>
                <td className="num">{r.samples}</td>
                <td className="num">{r.authorities}</td>
                <td>{r.median === null ? <Badge tone="neutral">אין מספיק דגימות</Badge> : <span className="num-inline">{shekel(r.median)}</span>}</td>
                <td className="num-inline">{shekel(r.min)} עד {shekel(r.max)}</td>
                <td>{r.outliers ? <Badge tone="warning">{r.outliers}</Badge> : "-"}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>

      {mode !== "monitor" ? (
        <section className="stack" aria-labelledby="bind-h">
          <h2 id="bind-h">שירותים מאושרים שבהם מחיר הייחוס מחייב ({bound.length})</h2>
          {bound.length ? (
            <TableWrap label="שירותים שבהם מחיר הייחוס מחייב">
              <table className="table">
                <thead>
                  <tr>
                    <th scope="col">שירות</th>
                    <th scope="col">פיילוט</th>
                    <th scope="col">סיבה</th>
                    <th scope="col">מחיר</th>
                    <th scope="col">מחיר ייחוס</th>
                    <th scope="col">על הקשיש מעבר לייחוס</th>
                  </tr>
                </thead>
                <tbody>
                  {bound.map(({ s, b }) => {
                    const ref = b.referencePoints === null ? null : b.referencePoints / seed.settings.points_per_shekel;
                    const over = ref === null ? null : Math.max(0, s.unitPrice! - ref);
                    return (
                      <tr key={s.id}>
                        <th scope="row">{s.name}<div className="muted">{s.serviceTypeId}, {s.unit}</div></th>
                        <td>{s.authority}</td>
                        <td>{b.reason === "scope" ? "קטגוריה ורשות שנבחרו" : `תחרות נמוכה (${b.operators} ספקים)`}</td>
                        <td className="num-inline">{shekel(s.unitPrice)}</td>
                        <td>{ref === null ? <Badge tone="neutral">אין מספיק דגימות</Badge> : <span className="num-inline">{shekel(ref)}</span>}</td>
                        <td>{over === null ? "-" : over > 0 ? <Badge tone="warning">{shekel(over)}</Badge> : <Badge tone="success">אין</Badge>}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </TableWrap>
          ) : (
            <p>אין שירות מאושר שמחיר הייחוס מחייב בו במצב הזה.</p>
          )}
        </section>
      ) : null}

      <section className="stack" aria-labelledby="hourly-h">
        <h2 id="hourly-h">{metricName(seed, "hourly_price_index")}, {pricePeriod(latest, seed.settings)}</h2>
        <p className="muted">ממוצע של מחיר ליחידה חלקי שעות השירות ביחידה, לפי קטגוריה ורשות (אזור = רשות). שירות בלי שעות ליחידה לא נכנס עד שיושלם.</p>
        {hourly.length ? (
          <TableWrap label={metricName(seed, "hourly_price_index")}>
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">קטגוריה</th>
                  <th scope="col">רשות</th>
                  <th scope="col">שירותים</th>
                  <th scope="col">מחיר ממוצע לשעה</th>
                </tr>
              </thead>
              <tbody>
                {hourly.map((r) => (
                  <tr key={`${r.categoryCode}|${r.authority}`}>
                    <th scope="row">{r.categoryCode} {idx.categories.get(r.categoryCode)?.name ?? ""}</th>
                    <td>{r.authority}</td>
                    <td className="num">{r.services}</td>
                    <td className="num">{r.avgHourly.toLocaleString("he-IL", { maximumFractionDigits: 2 })} ש"ח</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <p>אין עדיין שירותים עם שעות ליחידה.</p>
        )}
      </section>

      <section className="stack" aria-labelledby="out-h">
        <h2 id="out-h">חריגות ({outliers.length})</h2>
        {outliers.length ? (
          <TableWrap label="חריגות מחיר">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">שירות</th>
                  <th scope="col">פיילוט</th>
                  <th scope="col">מחיר</th>
                  <th scope="col">חציון</th>
                  <th scope="col">מעל החציון</th>
                </tr>
              </thead>
              <tbody>
                {outliers.map((o) => {
                  const s = sById.get(o.serviceId)!;
                  return (
                    <tr key={o.serviceId}>
                      <th scope="row">{s.name}<div className="muted">{o.serviceTypeId}, {o.unit}</div></th>
                      <td>{s.authority}</td>
                      <td className="num-inline">{shekel(o.unitPrice)}</td>
                      <td className="num-inline">{shekel(o.median)}</td>
                      <td><Badge tone="warning">{percent(o.deviation)}</Badge></td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <p>אין חריגות.</p>
        )}
      </section>
    </>
  );
}
