// ספקים בכל הפיילוטים. פרטי ספק יחיד מגיעים לכאן לפי supplier_contact_to_hq
// (הכרעה 28.10.2026) ולא יוצאים מהמטה: לא לאינטגרטור ולא לכלי לאזרח.

import { useState } from "react";
import { SUPPLIER_TYPES, competitionFlags, supplierScore, quarterText } from "@sal-ishi/core";
import { Alert, Badge, PageHeader, SelectField, TableWrap } from "@sal-ishi/ui";
import { useHqAnalysis } from "../analysis";

export default function SuppliersScreen() {
  const { state, seed, labels, idx } = useHqAnalysis();
  const [authority, setAuthority] = useState("");
  const [type, setType] = useState("");
  const authorities = [...new Set(state.suppliers.map((s) => s.authority))].sort();
  const nName = new Map(state.neighborhoods.map((n) => [n.id, n.name]));
  const list = state.suppliers
    .filter((s) => (!authority || s.authority === authority) && (!type || s.type === type))
    .sort((a, b) => a.authority.localeCompare(b.authority) || a.code.localeCompare(b.code));

  return (
    <>
      <PageHeader title="ספקים" description="כל הספקים בפיילוטים, לפי רשות. הקוד של ספק ייחודי בתוך הרשות." />
      <Alert tone="info" title="פרטי ספקים שהם אנשים פרטיים">
        {seed.settings.supplier_contact_to_hq
          ? "שם ופרטי קשר של עוסק פטור ומורשה מגיעים למטה בחבילה ונשמרים כאן לניהול. הם לא נכללים בתקן קליטת המפעילים ולא בקטלוג לאזרח."
          : "לפי ההגדרות, ספקים שהם אנשים פרטיים מגיעים למטה כקוד וסוג בלבד."}
      </Alert>
      {(() => {
        const flags = competitionFlags(state.services, seed.settings);
        const nName = new Map(state.neighborhoods.map((n) => [n.id, n.name]));
        return flags.length ? (
          <Alert tone="info" title={`מדד תחרות: ${flags.length} חריגות (הצעה, לא חוסם)`}>
            {flags.map((f) => `${f.authority} ${nName.get(f.neighborhoodId) ?? ""}: ${f.suppliers} ספקים ל-${f.serviceTypeId} (עד ${f.max})`).join(". ")}
          </Alert>
        ) : null;
      })()}
      <div className="card">
        <div className="grid grid--form">
          <SelectField label="פיילוט" value={authority} onChange={(e) => setAuthority(e.target.value)} placeholder="כל הפיילוטים"
            options={authorities.map((a) => ({ value: a, label: a }))} />
          <SelectField label="סוג עוסק" value={type} onChange={(e) => setType(e.target.value)} placeholder="כל הסוגים"
            options={SUPPLIER_TYPES.map((t) => ({ value: t, label: labels.supplierType[t]! }))} />
        </div>
      </div>
      <p className="muted" role="status" aria-live="polite">{list.length} ספקים</p>
      <TableWrap label="ספקים בכל הפיילוטים">
        <table className="table">
          <thead>
            <tr>
              <th scope="col">פיילוט</th>
              <th scope="col">קוד</th>
              <th scope="col">שם</th>
              <th scope="col">סוג עוסק</th>
              <th scope="col">שכונות</th>
              <th scope="col">שפות</th>
              <th scope="col">התאמה</th>
              <th scope="col">פרטי קשר</th>
              <th scope="col">שירותים</th>
              <th scope="col">דירוג</th>
            </tr>
          </thead>
          <tbody>
            {list.map((s) => (
              <tr key={`${s.authority}|${s.code}`}>
                <td>{s.authority}</td>
                <th scope="row">{s.code}</th>
                <td>{s.displayName ?? "-"}</td>
                <td><Badge tone={idx.supplierTypes.get(s.type)?.personal_data ? "warning" : "neutral"}>{labels.supplierType[s.type]}</Badge></td>
                <td>{s.neighborhoods.map((id) => nName.get(id) ?? id).join(", ")}</td>
                <td>{s.languages.join(", ")}</td>
                <td>{s.communityFit.map((c) => labels.community[c]).join(", ")}</td>
                <td dir="ltr" style={{ textAlign: "right" }}>{[s.contact?.phone, s.contact?.email].filter(Boolean).join(" | ") || "-"}</td>
                <td className="num">{state.services.filter((x) => x.authority === s.authority && x.supplierCode === s.code).length}</td>
                <td>
                  {(() => {
                    const sc = supplierScore(s, seed.settings);
                    return sc ? (sc.newSupplier ? <span className="muted">ספק חדש</span> : <Badge tone={sc.score >= 4 ? "success" : sc.score >= 3 ? "info" : "warning"}>{sc.score.toFixed(1)} ({quarterText(sc.quarter)})</Badge>) : <span className="muted">{seed.settings.supplier_rating_enabled === false ? "הדירוג כבוי" : "אין"}</span>;
                  })()}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </TableWrap>
    </>
  );
}
