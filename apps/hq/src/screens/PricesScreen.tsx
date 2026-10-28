// מחירי ייחוס: חציון לכל סוג שירות ויחידה על פני כל הפיילוטים, וחריגות.
// בלי מחיר גג (הכרעת החשכ"ל 28.10). חריגה מסומנת ולא חוסמת.

import { useState } from "react";
import { XLSX_MIME, writeWorkbook } from "@sal-ishi/core";
import { Badge, Button, PageHeader, ProposalBadge, SelectField, TableWrap, downloadBytes, todayStamp } from "@sal-ishi/ui";
import { percent, shekel, useHqAnalysis } from "../analysis";

export default function PricesScreen() {
  const { state, seed, refs, outliers, idx } = useHqAnalysis();
  const [category, setCategory] = useState("");
  const sById = new Map(state.services.map((s) => [s.id, s]));
  const proposal = String(seed.settings.price_outlier_status ?? "").startsWith("proposal");

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
