// אטלס ספקים: מי פועל ברשות, באיזה סוג עוסק, באילו שכונות ושפות, ולמי הוא מתאים.

import { useMemo, useState } from "react";
import { Building2, Pencil, Plus, Trash2 } from "lucide-react";
import { SUPPLIER_TYPES, competitionFlags, supplierScore, type Supplier } from "@sal-ishi/core";
import { Alert, Badge, Button, EmptyState, PageHeader, SelectField, TableWrap, useToast } from "@sal-ishi/ui";
import { SupplierForm } from "../components/SupplierForm";
import { useAnalysis } from "../analysis";
import { useField } from "../store";

export default function SuppliersScreen() {
  const data = useField((s) => s.data);
  const seed = useField((s) => s.seed);
  const removeSupplier = useField((s) => s.removeSupplier);
  const { labels, idx } = useAnalysis();
  const toast = useToast();
  const [neighborhood, setNeighborhood] = useState("");
  const [type, setType] = useState("");
  const [editing, setEditing] = useState<Supplier | "new" | null>(null);

  const nName = useMemo(() => new Map(data.neighborhoods.map((n) => [n.id, n.name])), [data.neighborhoods]);
  const list = data.suppliers.filter(
    (s) => (!neighborhood || s.neighborhoods.includes(neighborhood)) && (!type || s.type === type),
  );
  const personalCount = data.suppliers.filter((s) => idx.supplierTypes.get(s.type)?.personal_data).length;

  return (
    <>
      <PageHeader
        title="אטלס ספקים"
        description="הספקים ברשות: סוג עוסק, שכונות, שפות, התאמה קהילתית, נגישות ושירות בבית או מרחוק."
        actions={
          <Button icon={<Plus size={18} />} disabled={!data.neighborhoods.length} onClick={() => setEditing("new")}>
            ספק חדש
          </Button>
        }
      />

      {personalCount ? (
        <Alert tone="info" title={`${personalCount} ספקים הם אנשים פרטיים (עוסק פטור או מורשה)`}>
          {seed.settings.supplier_contact_to_hq
            ? "השם ופרטי הקשר שלהם עוברים למטה בחבילת הפיילוט, ולא עוברים לספק העל ולכלי לאזרח."
            : "השם ופרטי הקשר שלהם נשארים ברשות. למטה עוברים קוד וסוג בלבד."}
        </Alert>
      ) : null}

      {(() => {
        const flags = competitionFlags(data.services, seed.settings);
        return flags.length ? (
          <Alert tone="info" title="מדד תחרות (הצעה)">
            {flags.map((f) => `${nName.get(f.neighborhoodId) ?? f.neighborhoodId}: ${f.suppliers} ספקים לסוג שירות ${f.serviceTypeId} (עד ${f.max})`).join(". ")}
          </Alert>
        ) : null;
      })()}

      <section className="card" aria-labelledby="sup-filter-h">
        <h2 id="sup-filter-h" className="visually-hidden">סינון</h2>
        <div className="grid grid--form">
          <SelectField label="שכונה" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="כל השכונות"
            options={data.neighborhoods.map((n) => ({ value: n.id, label: n.name }))} />
          <SelectField label="סוג עוסק" value={type} onChange={(e) => setType(e.target.value)} placeholder="כל הסוגים"
            options={SUPPLIER_TYPES.map((t) => ({ value: t, label: labels.supplierType[t]! }))} />
        </div>
      </section>

      {list.length ? (
        <TableWrap label="ספקים">
          <table className="table">
            <caption className="visually-hidden">{list.length} ספקים</caption>
            <thead>
              <tr>
                <th scope="col">קוד</th>
                <th scope="col">שם</th>
                <th scope="col">סוג עוסק</th>
                <th scope="col">שכונות</th>
                <th scope="col">שפות</th>
                <th scope="col">התאמה</th>
                <th scope="col">מסירה</th>
                <th scope="col">נגיש</th>
                <th scope="col">פרטי קשר</th>
                <th scope="col">שירותים</th>
                <th scope="col">דירוג</th>
                <th scope="col"><span className="visually-hidden">פעולות</span></th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => (
                <tr key={s.code}>
                  <th scope="row">{s.code}</th>
                  <td>{s.displayName ?? "-"}</td>
                  <td>
                    <Badge tone={idx.supplierTypes.get(s.type)?.personal_data ? "warning" : "neutral"}>{labels.supplierType[s.type]}</Badge>
                  </td>
                  <td>{s.neighborhoods.map((id) => nName.get(id) ?? id).join(", ")}</td>
                  <td>{s.languages.join(", ")}</td>
                  <td>{s.communityFit.map((c) => labels.community[c]).join(", ")}</td>
                  <td>{(s.deliveryModes ?? []).map((m) => labels.deliveryMode[m]).join(", ") || "-"}</td>
                  <td>{s.accessible ? "כן" : "לא"}</td>
                  <td dir="ltr" style={{ textAlign: "right" }}>
                    {[s.contact?.phone, s.contact?.email].filter(Boolean).join(" | ") || "-"}
                  </td>
                  <td className="num">{data.services.filter((x) => x.supplierCode === s.code).length}</td>
                  <td>
                    {(() => {
                      const sc = supplierScore(s, seed.settings);
                      return sc ? <Badge tone={sc.score >= 4 ? "success" : sc.score >= 3 ? "info" : "warning"}>{sc.score.toFixed(1)} מתוך 5</Badge> : <span className="muted">אין</span>;
                    })()}
                  </td>
                  <td>
                    <div className="row" style={{ flexWrap: "nowrap" }}>
                      <Button small variant="ghost" icon={<Pencil size={16} />} aria-label={`עריכת ספק ${s.code}`} onClick={() => setEditing(s)} />
                      <Button
                        small
                        variant="ghost"
                        icon={<Trash2 size={16} />}
                        aria-label={`מחיקת ספק ${s.code}`}
                        onClick={() => {
                          const err = removeSupplier(s.code);
                          toast(err ? "error" : "success", err ?? `הספק ${s.code} נמחק`);
                        }}
                      />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <EmptyState icon={<Building2 size={40} />} title={data.suppliers.length ? "אין ספקים שמתאימים לסינון" : "עוד אין ספקים"}>
          {data.neighborhoods.length ? "הוסיפו ספק כדי לשייך אליו שירותים." : "הגדירו קודם שכונות במסך הרשות שלי."}
        </EmptyState>
      )}

      <SupplierForm open={editing !== null} supplier={editing && editing !== "new" ? editing : undefined} onClose={() => setEditing(null)} />
    </>
  );
}
