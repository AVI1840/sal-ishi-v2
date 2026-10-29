// הקטלוג שלי: כל השירותים, עם מבחן הכניסה והסיבה, שדות חובה חסרים וחריגות מחיר.
// הוספה ידנית או ייבוא Excel עם מיפוי עמודות.

import { useMemo, useState } from "react";
import { Copy, FileSpreadsheet, ListChecks, Pencil, Plus, Trash2 } from "lucide-react";
import {
  ENTRY_STATUS,
  SERVICE_IMPORT_FIELDS,
  rowsToServices,
  serviceTemplateWorkbook,
  type Service,
} from "@sal-ishi/core";
import { Badge, Button, EmptyState, PageHeader, SelectField, TableWrap, TextField, useToast } from "@sal-ishi/ui";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { ImportDialog } from "../components/ImportDialog";
import { ServiceForm } from "../components/ServiceForm";
import { CompletionPanel } from "../components/CompletionPanel";
import { entryTone, shekel, useAnalysis, workflowTone } from "../analysis";
import { newId, useField } from "../store";

export default function CatalogScreen() {
  const data = useField((s) => s.data);
  const seed = useField((s) => s.seed);
  const { removeService, addServices } = useField.getState();
  const { perService, idx } = useAnalysis();
  const toast = useToast();

  const [neighborhood, setNeighborhood] = useState("");
  const [category, setCategory] = useState("");
  const [entry, setEntry] = useState("");
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<Service | "new" | null>(null);
  const [prefill, setPrefill] = useState<Partial<Service> | undefined>();
  const [importing, setImporting] = useState(false);
  const [deleting, setDeleting] = useState<Service | null>(null);

  const nName = useMemo(() => new Map(data.neighborhoods.map((n) => [n.id, n.name])), [data.neighborhoods]);
  const list = data.services
    .filter((s) => {
      const a = perService.get(s.id);
      if (neighborhood && s.neighborhoodId !== neighborhood) return false;
      if (category && s.categoryCode !== category) return false;
      if (entry && a?.entry.status !== entry) return false;
      if (query.trim() && !s.name.includes(query.trim())) return false;
      return true;
    })
    .sort((a, b) => (nName.get(a.neighborhoodId) ?? "").localeCompare(nName.get(b.neighborhoodId) ?? "") || a.categoryCode.localeCompare(b.categoryCode));

  const counts = Object.values(ENTRY_STATUS).map((st) => ({
    status: st,
    n: data.services.filter((s) => perService.get(s.id)?.entry.status === st).length,
  }));

  return (
    <>
      <PageHeader
        title="הקטלוג שלי"
        description={`כל שירות עובר מבחן כניסה בכל שמירה. שדות החובה: ${seed.mandatory_fields.map((f) => f.label).join(", ")}.`}
        actions={
          <>
            <Button icon={<Plus size={18} />} disabled={!data.neighborhoods.length} onClick={() => { setPrefill(undefined); setEditing("new"); }}>
              שירות חדש
            </Button>
            <Button variant="secondary" icon={<FileSpreadsheet size={18} />} disabled={!data.neighborhoods.length} onClick={() => setImporting(true)}>
              ייבוא מ-Excel
            </Button>
          </>
        }
      />

      {data.services.length ? (
        <div className="row" aria-label="סיכום מבחן הכניסה" role="group">
          {counts.filter((c) => c.n).map((c) => (
            <Badge key={c.status} tone={entryTone(c.status)}>{c.status}: {c.n}</Badge>
          ))}
        </div>
      ) : null}

      <CompletionPanel onEdit={(s) => setEditing(s)} />

      <section className="card" aria-labelledby="cat-filter-h">
        <h2 id="cat-filter-h" className="visually-hidden">סינון</h2>
        <div className="grid grid--form">
          <TextField label="חיפוש לפי שם" type="search" value={query} onChange={(e) => setQuery(e.target.value)} />
          <SelectField label="שכונה" value={neighborhood} onChange={(e) => setNeighborhood(e.target.value)} placeholder="כל השכונות"
            options={data.neighborhoods.map((n) => ({ value: n.id, label: n.name }))} />
          <SelectField label="קטגוריה" value={category} onChange={(e) => setCategory(e.target.value)} placeholder="כל הקטגוריות"
            options={seed.categories.map((c) => ({ value: c.code, label: `${c.code} ${c.name}` }))} />
          <SelectField label="מבחן כניסה" value={entry} onChange={(e) => setEntry(e.target.value)} placeholder="כל התוצאות"
            options={Object.values(ENTRY_STATUS).map((s) => ({ value: s, label: s }))} />
        </div>
      </section>

      <p role="status" aria-live="polite" className="muted">מוצגים {list.length} מתוך {data.services.length} שירותים</p>

      {list.length ? (
        <TableWrap label="שירותים בקטלוג">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">שירות</th>
                <th scope="col">שכונה</th>
                <th scope="col">סוג שירות</th>
                <th scope="col">ספק</th>
                <th scope="col">מחיר ליחידה</th>
                <th scope="col">מבחן כניסה</th>
                <th scope="col">שדות חובה</th>
                <th scope="col">סטטוס</th>
                <th scope="col"><span className="visually-hidden">פעולות</span></th>
              </tr>
            </thead>
            <tbody>
              {list.map((s) => {
                const a = perService.get(s.id)!;
                return (
                  <tr key={s.id}>
                    <th scope="row">{s.name}{s.programId ? <div className="muted">תוכנית {s.programId}</div> : null}</th>
                    <td>{nName.get(s.neighborhoodId) ?? "-"}</td>
                    <td>{idx.serviceTypes.get(s.serviceTypeId)?.name ?? (s.serviceTypeId || "-")}<div className="muted">{s.categoryCode}</div></td>
                    <td>{s.supplierCode || "-"}</td>
                    <td>
                      <span className="num-inline">{shekel(s.unitPrice)}</span> <span className="muted">/ {s.unit || "-"}</span>
                      {a.outlier ? (
                        <div><Badge tone="warning" title={`חציון ${shekel(a.outlier.median)}`}>{Math.round(a.outlier.deviation * 100)}% מעל הייחוס</Badge></div>
                      ) : null}
                    </td>
                    <td>
                      <Badge tone={entryTone(a.entry.status)}>{a.entry.status}</Badge>
                      {a.entry.step !== null ? <div className="muted">{a.entry.reason}</div> : null}
                    </td>
                    <td>
                      {a.missing.length ? (
                        <Badge tone="warning" title={a.missing.map((m) => m.label).join(", ")}>חסרים {a.missing.length}</Badge>
                      ) : (
                        <Badge tone="success">מלא</Badge>
                      )}
                      {a.missing.length ? <div className="muted">{a.missing.map((m) => m.label).join(", ")}</div> : null}
                    </td>
                    <td><Badge tone={workflowTone(s.status)}>{s.status}</Badge></td>
                    <td>
                      <div className="row" style={{ flexWrap: "nowrap" }}>
                        <Button small variant="ghost" icon={<Pencil size={16} />} aria-label={`עריכת ${s.name}`} onClick={() => setEditing(s)} />
                        <Button
                          small
                          variant="ghost"
                          icon={<Copy size={16} />}
                          aria-label={`שכפול ${s.name}`}
                          onClick={() => setEditing({ ...s, id: newId(), name: `${s.name} (עותק)`, status: "טיוטה" })}
                        />
                        <Button small variant="ghost" icon={<Trash2 size={16} />} aria-label={`מחיקת ${s.name}`} onClick={() => setDeleting(s)} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      ) : (
        <EmptyState icon={<ListChecks size={40} />} title={data.services.length ? "אין שירותים שמתאימים לסינון" : "הקטלוג ריק"}>
          {data.services.length ? "נסו להסיר חלק מהמסננים." : "הוסיפו שירות, ייבאו מ-Excel, או בחרו סוג שירות במסך ההשראה."}
        </EmptyState>
      )}

      <ServiceForm
        open={editing !== null}
        service={editing && editing !== "new" ? editing : undefined}
        prefill={prefill}
        onClose={() => setEditing(null)}
      />

      <ImportDialog
        open={importing}
        onClose={() => setImporting(false)}
        title="ייבוא שירותים מ-Excel"
        description="כל שורה היא שירות. השירותים נכנסים כטיוטה ועוברים מבחן כניסה. שכונה מזוהה לפי שמה כפי שהוגדר ברשות, וסוג שירות לפי קוד (T01) או שם."
        fields={SERVICE_IMPORT_FIELDS}
        template={serviceTemplateWorkbook}
        templateName="תבנית_שירותים"
        onImport={(rows, mapping) => {
          const { services, errors } = rowsToServices(rows, mapping, {
            authority: data.authority,
            neighborhoods: data.neighborhoods,
            suppliers: data.suppliers,
            seed,
            newId,
            defaultStartMonth: new Date().toISOString().slice(0, 7),
          });
          addServices(services);
          if (services.length) toast("success", `נוספו ${services.length} שירותים כטיוטה`);
          return { imported: services.length, errors };
        }}
      />

      <ConfirmDialog
        open={deleting !== null}
        title="מחיקת שירות"
        confirmLabel="מחיקה"
        danger
        onClose={() => setDeleting(null)}
        onConfirm={() => {
          if (deleting) {
            removeService(deleting.id);
            toast("success", `השירות "${deleting.name}" נמחק`);
          }
          setDeleting(null);
        }}
      >
        <p>השירות "{deleting?.name}" והפעילות החודשית שלו יימחקו.</p>
      </ConfirmDialog>
    </>
  );
}
