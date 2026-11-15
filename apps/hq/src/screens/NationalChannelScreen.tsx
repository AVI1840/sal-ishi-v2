// ערוץ ארצי: מוצרים ושירותים ארציים (בעיקר מוצרי מניעה ובטיחות) מספקים
// ארציים. מנוהל במטה, מופיע בקטלוג של כל שכונה, ולא נספר ברצפה של שכונה.

import { useState } from "react";
import { Globe2, Plus } from "lucide-react";
import {
  NATIONAL_AUTHORITY,
  competitionFlags,
  productsQuarterlyCapPoints,
  supplierScore,
  type Service,
  type Supplier, quarterText } from "@sal-ishi/core";
import { Alert, Badge, Button, Dialog, EmptyState, PageHeader, SelectField, TableWrap, TextField, useToast } from "@sal-ishi/ui";
import { useHqAnalysis } from "../analysis";
import { useHq } from "../store";

const newId = () => `nat-${globalThis.crypto.randomUUID().slice(0, 8)}`;

export default function NationalChannelScreen() {
  const { state, seed, idx } = useHqAnalysis();
  const { upsertNationalService, upsertNationalSupplier } = useHq.getState();
  const toast = useToast();
  const [editing, setEditing] = useState<Service | null>(null);
  const [newSupplier, setNewSupplier] = useState(false);

  const services = state.services.filter((s) => s.reach === "national");
  const suppliers = state.suppliers.filter((s) => s.authority === NATIONAL_AUTHORITY);
  const supName = new Map(suppliers.map((s) => [s.code, s]));
  const flags = competitionFlags(services, seed.settings);
  const maxNational = seed.settings.competition_max_suppliers_national ?? 5;

  const blank = (): Service => ({
    id: newId(),
    authority: NATIONAL_AUTHORITY,
    neighborhoodId: "",
    name: "",
    categoryCode: "6",
    serviceTypeId: "T54",
    supplierCode: suppliers[0]?.code ?? "",
    languages: ["עברית", "ערבית", "רוסית"],
    format: "מוצר",
    unit: "מוצר",
    copayTier: "core_and_prevention",
    communityFit: ["general", "haredi", "arab"],
    deliveryMode: "home",
    attendanceMethod: ["companion"],
    otherFunder: false,
    enforceable: true,
    reach: "national",
    startMonth: new Date().toISOString().slice(0, 7),
    status: "טיוטה",
  });

  return (
    <>
      <PageHeader
        title="ערוץ ארצי"
        description={`מוצרים ושירותים ארציים מספקים ארציים, בעיקר מוצרי מניעה ובטיחות (קטגוריה 6). מופיעים בקטלוג של כל שכונה בכל הפיילוטים${seed.settings.products_count_in_floor ? ", ונספרים ברצפה" : ", ולא נספרים ברצפה של שכונה"}. תקרה לאדם: ${productsQuarterlyCapPoints(seed.settings)} נקודות ברבעון (${Math.round(seed.settings.products_quarterly_cap_share.value * 100)}% מהארנק הרבעוני).`}
        actions={
          <>
            <Button icon={<Plus size={18} />} disabled={!suppliers.length} onClick={() => setEditing(blank())}>פריט ארצי חדש</Button>
            <Button variant="secondary" onClick={() => setNewSupplier(true)}>ספק ארצי חדש</Button>
          </>
        }
      />

      {flags.length ? (
        <Alert tone="info" title="מדד תחרות">
          {flags.map((f) => `${idx.serviceTypes.get(f.serviceTypeId)?.name}: ${f.suppliers} ספקים (עד ${f.max})`).join(". ")}
        </Alert>
      ) : null}

      {services.length ? (
        <TableWrap label="פריטים בערוץ הארצי">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">פריט</th>
                <th scope="col">סוג</th>
                <th scope="col">ספק</th>
                <th scope="col">דירוג ספק</th>
                <th scope="col">נקודות</th>
                <th scope="col">סטטוס</th>
                <th scope="col"><span className="visually-hidden">פעולות</span></th>
              </tr>
            </thead>
            <tbody>
              {services.map((s) => {
                const sup = supName.get(s.supplierCode);
                const sc = sup ? supplierScore(sup, seed.settings) : null;
                return (
                  <tr key={s.id}>
                    <th scope="row">{s.name}</th>
                    <td>{idx.serviceTypes.get(s.serviceTypeId)?.name ?? s.serviceTypeId}</td>
                    <td>{sup?.displayName ?? s.supplierCode}</td>
                    <td>{sc ? <Badge tone={sc.score >= 4 ? "success" : "info"}>{sc.score.toFixed(1)}</Badge> : "-"}</td>
                    <td className="num-inline">{s.pricePoints ?? "-"}</td>
                    <td><Badge tone={s.status === "אושר" ? "success" : "neutral"}>{s.status}</Badge></td>
                    <td>
                      <div className="row" style={{ flexWrap: "nowrap" }}>
                        <Button small variant="ghost" onClick={() => setEditing(s)} aria-label={`עריכת ${s.name}`}>עריכה</Button>
                        <Button
                          small
                          variant={s.status === "אושר" ? "ghost" : "success"}
                          onClick={() => {
                            upsertNationalService({ ...s, status: s.status === "אושר" ? "טיוטה" : "אושר" });
                            toast("success", s.status === "אושר" ? `${s.name} הוחזר לטיוטה` : `${s.name} אושר ויופיע בכל הקטלוגים`);
                          }}
                        >
                          {s.status === "אושר" ? "ביטול אישור" : "אישור"}
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <EmptyState icon={<Globe2 size={40} />} title="הערוץ הארצי ריק">הוסיפו ספק ארצי ואז פריט, או טענו חבילות הדגמה במסך קליטת החבילות.</EmptyState>
      )}

      <section className="stack" aria-labelledby="nat-sup-h">
        <h2 id="nat-sup-h">ספקים ארציים ({suppliers.length})</h2>
        <TableWrap label="ספקים ארציים">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">קוד</th>
                <th scope="col">שם</th>
                <th scope="col">דירוג</th>
                <th scope="col">פריטים</th>
              </tr>
            </thead>
            <tbody>
              {suppliers.map((s) => {
                const sc = supplierScore(s, seed.settings);
                return (
                  <tr key={s.code}>
                    <th scope="row">{s.code}</th>
                    <td>{s.displayName}</td>
                    <td>{sc ? (sc.newSupplier ? "ספק חדש" : `${sc.score.toFixed(1)} מתוך 5 (${quarterText(sc.quarter)})`) : "אין הערכה"}</td>
                    <td className="num">{services.filter((x) => x.supplierCode === s.code).length}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <ItemDialog
        key={editing?.id ?? "closed"}
        item={editing}
        suppliers={suppliers}
        onClose={() => setEditing(null)}
        onSave={(s) => {
          upsertNationalService(s);
          toast("success", `${s.name} נשמר`);
          setEditing(null);
        }}
      />
      <SupplierDialog
        open={newSupplier}
        next={`N-${String(suppliers.length + 1).padStart(3, "0")}`}
        onClose={() => setNewSupplier(false)}
        onSave={(s) => {
          upsertNationalSupplier(s);
          toast("success", `הספק ${s.code} נוסף`);
          setNewSupplier(false);
        }}
      />
    </>
  );
}

function ItemDialog(props: { item: Service | null; suppliers: Supplier[]; onClose: () => void; onSave: (s: Service) => void }) {
  const { seed } = useHqAnalysis();
  const [draft, setDraft] = useState<Service | null>(props.item);
  const [price, setPrice] = useState(props.item?.pricePoints?.toString() ?? "");
  const [touched, setTouched] = useState(false);
  if (!draft) return null;
  const types = seed.service_types.filter((t) => t.category === "6" || t.scope.includes("ארצי"));
  const err = draft.name.trim() ? null : "צריך שם";
  return (
    <Dialog
      open={props.item !== null}
      onClose={props.onClose}
      title={props.item?.name ? `עריכת ${props.item.name}` : "פריט ארצי חדש"}
      width={640}
      footer={
        <>
          <Button
            onClick={() => {
              setTouched(true);
              if (err) return;
              const p = Number(price);
              const type = seed.service_types.find((t) => t.id === draft.serviceTypeId);
              props.onSave({
                ...draft,
                name: draft.name.trim(),
                categoryCode: type?.category ?? draft.categoryCode,
                unit: type?.unit ?? draft.unit,
                format: type?.format ?? draft.format,
                ...(price && Number.isFinite(p) ? { pricePoints: p, unitPrice: p, marketPrice: draft.marketPrice ?? p } : {}),
              });
            }}
          >
            שמירה
          </Button>
          <Button variant="secondary" onClick={props.onClose}>ביטול</Button>
        </>
      }
    >
      <div className="grid grid--form">
        <TextField label="שם הפריט" required value={draft.name} error={touched ? err : null} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <SelectField label="סוג" value={draft.serviceTypeId} onChange={(e) => setDraft({ ...draft, serviceTypeId: e.target.value })}
          options={types.map((t) => ({ value: t.id, label: `${t.id} ${t.name}` }))} />
        <SelectField label="ספק ארצי" value={draft.supplierCode} onChange={(e) => setDraft({ ...draft, supplierCode: e.target.value })}
          options={props.suppliers.map((s) => ({ value: s.code, label: `${s.code} ${s.displayName ?? ""}` }))} />
        <TextField label="מחיר בנקודות" inputMode="decimal" value={price} onChange={(e) => setPrice(e.target.value)} hint="נקודה = שקל" />
      </div>
    </Dialog>
  );
}

function SupplierDialog(props: { open: boolean; next: string; onClose: () => void; onSave: (s: Supplier) => void }) {
  const [name, setName] = useState("");
  const [touched, setTouched] = useState(false);
  return (
    <Dialog
      open={props.open}
      onClose={props.onClose}
      title="ספק ארצי חדש"
      width={520}
      footer={
        <Button
          onClick={() => {
            setTouched(true);
            if (!name.trim()) return;
            props.onSave({
              code: props.next,
              authority: NATIONAL_AUTHORITY,
              type: "company",
              displayName: name.trim(),
              neighborhoods: [],
              languages: ["עברית", "ערבית", "רוסית"],
              communityFit: ["general", "haredi", "arab"],
              accessible: true,
              deliveryModes: ["home"],
            });
            setName("");
            setTouched(false);
          }}
        >
          הוספה
        </Button>
      }
    >
      <TextField label="קוד" value={props.next} disabled />
      <TextField label="שם הספק" required value={name} error={touched && !name.trim() ? "צריך שם" : null} onChange={(e) => setName(e.target.value)} />
      <p className="muted">דירוג רבעוני לספק ארצי נקלט כמו לספק ברשות (איכות, תוצאות מניעה, שביעות רצון, עלות-תועלת).</p>
    </Dialog>
  );
}

