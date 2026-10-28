// אישור ושליחה: טיוטה, הוגש, אושר, נדחה (עם נימוק). ייצוא חבילת פיילוט למטה
// ו-Excel לוועדה.

import { useMemo, useState } from "react";
import { CheckCircle2, FileSpreadsheet, Package, Send, Undo2, XCircle } from "lucide-react";
import {
  FileSyncAdapter,
  WORKFLOW_STATUSES,
  XLSX_MIME,
  buildPilotPackage,
  committeeWorkbook,
  createBrowserFileIO,
  type WorkflowStatus,
} from "@sal-ishi/core";
import { Alert, Badge, Button, PageHeader, SelectField, TableWrap, TextArea, downloadBytes, todayStamp, useToast } from "@sal-ishi/ui";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { entryTone, useAnalysis, workflowTone } from "../analysis";
import { useField } from "../store";

export default function SubmitScreen() {
  const data = useField((s) => s.data);
  const seed = useField((s) => s.seed);
  const lastPackage = useField((s) => s.lastPackage);
  const { setStatus, markPackageSent } = useField.getState();
  const { perService, idx } = useAnalysis();
  const toast = useToast();

  const [filter, setFilter] = useState<WorkflowStatus | "">("הוגש");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);

  const nName = useMemo(() => new Map(data.neighborhoods.map((n) => [n.id, n.name])), [data.neighborhoods]);
  const list = data.services.filter((s) => !filter || s.status === filter);
  const chosen = data.services.filter((s) => selected.has(s.id));
  const allChecked = list.length > 0 && list.every((s) => selected.has(s.id));

  const act = (status: WorkflowStatus, note?: string) => {
    if (!chosen.length) return;
    setStatus(chosen.map((s) => s.id), status, note);
    toast("success", `${chosen.length} שירותים עודכנו ל"${status}"`);
    setSelected(new Set());
  };

  const notEntered = chosen.filter((s) => perService.get(s.id)?.entry.status !== "נכנס");
  const personalSuppliers = data.suppliers.filter((s) => idx.supplierTypes.get(s.type)?.personal_data).length;

  const exportPackage = async () => {
    setBusy(true);
    try {
      const pkg = await buildPilotPackage(data, seed);
      await new FileSyncAdapter(createBrowserFileIO()).sendPilotPackage(pkg);
      markPackageSent(pkg.contentHash);
      toast("success", `חבילת הפיילוט נוצרה. חתימה ${pkg.contentHash.slice(0, 8)}`);
    } catch (e) {
      toast("error", e instanceof Error ? e.message : String(e));
    } finally {
      setBusy(false);
    }
  };

  const exportCommittee = () => {
    const rows = data.services
      .filter((s) => s.status === "הוגש" || s.status === "אושר" || s.status === "נדחה")
      .map((s) => {
        const a = perService.get(s.id)!;
        const sup = data.suppliers.find((x) => x.code === s.supplierCode);
        return {
          service: s,
          neighborhoodName: nName.get(s.neighborhoodId) ?? "",
          supplierLabel: sup ? `${sup.code}${sup.displayName ? ` - ${sup.displayName}` : ""}` : s.supplierCode,
          entryStatus: a.entry.status,
          entryReason: a.entry.reason,
          missingFields: a.missing.map((m) => m.label),
          referenceMedian: a.referenceMedian,
        };
      });
    downloadBytes(`ועדה_${data.authority || "רשות"}_${todayStamp()}.xlsx`, committeeWorkbook(rows, seed), XLSX_MIME);
    toast("success", `קובץ לוועדה עם ${rows.length} שירותים`);
  };

  return (
    <>
      <PageHeader
        title="אישור ושליחה"
        description={`טיוטה, הוגש, אושר או נדחה. לכלי לאזרח מתפרסמים רק שירותים בסטטוס: ${seed.settings.publish_to_citizen_statuses.join(", ")}.`}
      />

      <div className="grid grid--kpi">
        {WORKFLOW_STATUSES.map((st) => (
          <button key={st} type="button" className={`card kpi kpi--link ${filter === st ? "kpi--active" : ""}`} aria-pressed={filter === st} onClick={() => { setFilter(st); setSelected(new Set()); }}>
            <span className="kpi__value">{data.services.filter((s) => s.status === st).length}</span>
            <span className="kpi__label"><Badge tone={workflowTone(st)}>{st}</Badge></span>
          </button>
        ))}
      </div>

      <section className="card" aria-labelledby="queue-h">
        <div className="card__header">
          <h2 id="queue-h">שירותים {filter ? `בסטטוס ${filter}` : ""}</h2>
          <div style={{ minWidth: 200 }}>
            <SelectField label="סטטוס" value={filter} onChange={(e) => { setFilter(e.target.value as WorkflowStatus | ""); setSelected(new Set()); }}
              placeholder="הכל" options={WORKFLOW_STATUSES.map((s) => ({ value: s, label: s }))} />
          </div>
        </div>

        <div className="row action-bar" role="group" aria-label="פעולות על השירותים שנבחרו">
          <span className="muted" aria-live="polite">נבחרו {chosen.length}</span>
          <Button small icon={<Send size={16} />} disabled={!chosen.some((s) => s.status === "טיוטה")} onClick={() => act("הוגש")}>הגשה לוועדה</Button>
          <Button small variant="success" icon={<CheckCircle2 size={16} />} disabled={!chosen.length} onClick={() => act("אושר")}>אישור</Button>
          <Button small variant="danger" icon={<XCircle size={16} />} disabled={!chosen.length} onClick={() => { setReason(""); setRejecting(true); }}>דחייה</Button>
          <Button small variant="ghost" icon={<Undo2 size={16} />} disabled={!chosen.length} onClick={() => act("טיוטה")}>החזרה לטיוטה</Button>
        </div>
        {notEntered.length ? (
          <Alert tone="warning">{notEntered.length} מהשירותים שנבחרו לא עברו את מבחן הכניסה. אפשר לאשר, אבל כדאי לבדוק את הסיבה.</Alert>
        ) : null}

        {list.length ? (
          <TableWrap label="שירותים לאישור">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">
                    <input
                      type="checkbox"
                      className="table-check"
                      aria-label="בחירת כל השירותים ברשימה"
                      checked={allChecked}
                      onChange={(e) => setSelected(e.target.checked ? new Set(list.map((s) => s.id)) : new Set())}
                    />
                  </th>
                  <th scope="col">שירות</th>
                  <th scope="col">שכונה</th>
                  <th scope="col">מבחן כניסה</th>
                  <th scope="col">סטטוס</th>
                  <th scope="col">הערת ועדה</th>
                </tr>
              </thead>
              <tbody>
                {list.map((s) => {
                  const a = perService.get(s.id)!;
                  return (
                    <tr key={s.id}>
                      <td>
                        <input
                          type="checkbox"
                          className="table-check"
                          aria-label={`בחירת ${s.name}`}
                          checked={selected.has(s.id)}
                          onChange={(e) => {
                            const next = new Set(selected);
                            if (e.target.checked) next.add(s.id);
                            else next.delete(s.id);
                            setSelected(next);
                          }}
                        />
                      </td>
                      <th scope="row">{s.name}</th>
                      <td>{nName.get(s.neighborhoodId)}</td>
                      <td>
                        <Badge tone={entryTone(a.entry.status)}>{a.entry.status}</Badge>
                        {a.entry.step !== null ? <div className="muted">{a.entry.reason}</div> : null}
                      </td>
                      <td><Badge tone={workflowTone(s.status)}>{s.status}</Badge></td>
                      <td>{s.committeeNote ?? ""}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </TableWrap>
        ) : (
          <p>אין שירותים בסטטוס הזה.</p>
        )}
      </section>

      <section className="card" aria-labelledby="export-h">
        <h2 id="export-h">שליחה</h2>
        <div className="grid grid--cards">
          <div className="stack">
            <h3>חבילת פיילוט למטה</h3>
            <p>
              קובץ JSON עם גרסה וחתימת תוכן: {data.neighborhoods.length} שכונות, {data.suppliers.length} ספקים, {data.services.length} שירותים
              ו-{data.activity.length} רשומות פעילות מצטברת. אין בו שום פרט של תושב.
            </p>
            {personalSuppliers ? (
              <p className="muted">
                {seed.settings.supplier_contact_to_hq
                  ? `כולל שם ופרטי קשר של ${personalSuppliers} ספקים שהם אנשים פרטיים. שלחו בערוץ מאובטח בלבד.`
                  : `${personalSuppliers} ספקים שהם אנשים פרטיים עוברים כקוד וסוג בלבד.`}
              </p>
            ) : null}
            {lastPackage ? (
              <p className="muted">חבילה אחרונה: {new Date(lastPackage.at).toLocaleString("he-IL")}, חתימה {lastPackage.hash.slice(0, 8)}</p>
            ) : null}
            <Button icon={<Package size={18} />} disabled={busy || !data.authority} onClick={exportPackage}>
              {busy ? "יוצר חבילה..." : "ייצוא חבילת פיילוט"}
            </Button>
          </div>
          <div className="stack">
            <h3>Excel לוועדה</h3>
            <p>כל השירותים שהוגשו, אושרו או נדחו, עם מבחן הכניסה, שדות חסרים ומחיר הייחוס. הקובץ נפתח מימין לשמאל.</p>
            <Button variant="secondary" icon={<FileSpreadsheet size={18} />} disabled={!data.services.length} onClick={exportCommittee}>
              הורדת Excel לוועדה
            </Button>
          </div>
        </div>
      </section>

      <ConfirmDialog
        open={rejecting}
        title={`דחיית ${chosen.length} שירותים`}
        confirmLabel="דחייה"
        danger
        confirmDisabled={!reason.trim()}
        onClose={() => setRejecting(false)}
        onConfirm={() => {
          act("נדחה", reason.trim());
          setRejecting(false);
        }}
      >
        <TextArea label="נימוק לדחייה" required value={reason} onChange={(e) => setReason(e.target.value)}
          hint="הנימוק נשמר כהערת ועדה ומופיע בקובץ לוועדה" />
      </ConfirmDialog>
    </>
  );
}
