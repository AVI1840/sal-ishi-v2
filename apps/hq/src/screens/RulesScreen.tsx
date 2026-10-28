// ספרייה וכללים: עריכת ההגדרות וסוגי השירות, יומן שינויים, והפצת גרסת seed
// חדשה לשטח. כל שינוי משפיע מיד על כל המסכים במטה.

import { useState } from "react";
import { Pencil, Plus, Send } from "lucide-react";
import { FileSyncAdapter, createBrowserFileIO, proposalKeys, type Seed } from "@sal-ishi/core";
import {
  Alert,
  Badge,
  Button,
  Dialog,
  PageHeader,
  ProposalBadge,
  SelectField,
  TableWrap,
  TextArea,
  TextField,
  useToast,
} from "@sal-ishi/ui";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useHqAnalysis } from "../analysis";
import { useHq } from "../store";

type Kind = "int" | "money" | "ratio" | "bool" | "window";

const EDITABLE: { key: string; label: string; kind: Kind; status?: string }[] = [
  { key: "core_floor", label: "רצפת מגוון: שירותים רציפים לכל קטגוריית ליבה", kind: "int" },
  { key: "min_participants", label: "שירות רציף: משתתפים לפחות בחודש השיא", kind: "int" },
  { key: "min_active_months", label: "שירות רציף: חודשים פעילים לפחות", kind: "int" },
  { key: "personal_wallet", label: "ארנק אישי בחודש (ש\"ח)", kind: "money" },
  { key: "utilization_target", label: "יעד מיצוי", kind: "ratio" },
  { key: "red_flag_avg", label: "דגל אדום מתחת ל", kind: "ratio" },
  { key: "utilization_window", label: "חלון מיצוי (חודשים)", kind: "window" },
  { key: "price_outlier_threshold", label: "חריגת מחיר מעל הייחוס", kind: "ratio" },
  { key: "reference_price_min_samples", label: "דגימות מינימום למחיר ייחוס", kind: "int" },
  { key: "points_rollover_months", label: "צבירת נקודות (חודשים)", kind: "int", status: "points_rollover_status" },
  { key: "no_show_free_per_quarter", label: "היעדרויות בלי חיוב ברבעון", kind: "int", status: "no_show_status" },
  { key: "small_cell_threshold", label: "סף תא קטן", kind: "int" },
  { key: "qol_counts_in_target", label: "איכות חיים נספרת ביעד המיצוי", kind: "bool" },
  { key: "supplier_contact_to_hq", label: "פרטי ספק יחיד עוברים למטה", kind: "bool" },
];

const toDisplay = (kind: Kind, v: unknown) =>
  kind === "ratio" ? String(Math.round(Number(v) * 100)) : kind === "window" ? String(/(\d+)/.exec(String(v))?.[1] ?? "") : String(v ?? "");

const fromDisplay = (kind: Kind, s: string): unknown =>
  kind === "ratio" ? Number(s) / 100 : kind === "window" ? `rolling_${Number(s)}_months` : Number(s);

export default function RulesScreen() {
  const { seed, idx } = useHqAnalysis();
  const pending = useHq((s) => s.pending);
  const { updateSetting, updateServiceType, addServiceType, publishSeed } = useHq.getState();
  const toast = useToast();
  const [editingType, setEditingType] = useState<Seed["service_types"][number] | "new" | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const proposals = new Set(proposalKeys(seed.settings));
  const history = ((seed.meta as { changelog?: { version: string; published_at: string; changes: unknown[] }[] }).changelog ?? []).slice().reverse();

  const markFinal = (statusKey: string) => {
    const err = updateSetting(statusKey, `סופי ${new Date().toLocaleDateString("he-IL")}`);
    toast(err ? "error" : "success", err ?? "הערך סומן כסופי");
  };

  const publish = async () => {
    const published = publishSeed();
    await new FileSyncAdapter(createBrowserFileIO()).publishSeed(published);
    setConfirmPublish(false);
    toast("success", `גרסת בסיס ${published.meta.version} פורסמה. שלחו את הקובץ לרשויות.`);
  };

  return (
    <>
      <PageHeader
        title="ספרייה וכללים"
        description="ההגדרות וספריית סוגי השירות. שינוי משפיע מיד על הכיסוי, המיצוי וחריגות המחיר במטה, ומגיע לשטח כשמפרסמים גרסת בסיס חדשה."
        actions={
          <Button icon={<Send size={18} />} disabled={!pending.length} onClick={() => setConfirmPublish(true)}>
            פרסום גרסה ({pending.length} שינויים)
          </Button>
        }
      />

      <section className="card" aria-labelledby="set-h">
        <h2 id="set-h">הגדרות</h2>
        <TableWrap label="הגדרות">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">הגדרה</th>
                <th scope="col">ערך</th>
                <th scope="col">סטטוס</th>
              </tr>
            </thead>
            <tbody>
              {EDITABLE.map((e) => {
                const value = (seed.settings as Record<string, unknown>)[e.key];
                const isProposal = proposals.has(e.key);
                return (
                  <tr key={e.key}>
                    <th scope="row"><label htmlFor={`set-${e.key}`}>{e.label}</label></th>
                    <td>
                      {e.kind === "bool" ? (
                        <input
                          id={`set-${e.key}`}
                          type="checkbox"
                          className="table-check"
                          checked={Boolean(value)}
                          onChange={(ev) => {
                            const err = updateSetting(e.key, ev.target.checked);
                            if (err) toast("error", err);
                          }}
                        />
                      ) : (
                        <span className="row" style={{ flexWrap: "nowrap" }}>
                          <input
                            id={`set-${e.key}`}
                            className="input input--narrow"
                            type="number"
                            inputMode="decimal"
                            min={0}
                            key={`${e.key}-${String(value)}`}
                            defaultValue={toDisplay(e.kind, value)}
                            onBlur={(ev) => {
                              if (ev.target.value === toDisplay(e.kind, value)) return;
                              const err = updateSetting(e.key, fromDisplay(e.kind, ev.target.value));
                              if (err) {
                                toast("error", `${e.label}: ${err}`);
                                ev.target.value = toDisplay(e.kind, value);
                              } else toast("success", `עודכן: ${e.label}`);
                            }}
                          />
                          {e.kind === "ratio" ? <span aria-hidden="true">%</span> : null}
                        </span>
                      )}
                    </td>
                    <td>
                      {isProposal ? (
                        <span className="row">
                          <ProposalBadge note={String((seed.settings as Record<string, unknown>)[e.status ?? ""] ?? "")} />
                          {e.status ? <Button small variant="ghost" onClick={() => markFinal(e.status!)}>סימון כסופי</Button> : null}
                        </span>
                      ) : (
                        <Badge tone="success">סופי</Badge>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="card" aria-labelledby="types-h">
        <div className="card__header">
          <h2 id="types-h">ספריית סוגי השירות ({seed.service_types.length})</h2>
          <Button variant="secondary" icon={<Plus size={18} />} onClick={() => setEditingType("new")}>סוג שירות חדש</Button>
        </div>
        <TableWrap label="סוגי שירות">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">קוד</th>
                <th scope="col">שם</th>
                <th scope="col">קטגוריה</th>
                <th scope="col">פורמט</th>
                <th scope="col">יחידה</th>
                <th scope="col">הערה</th>
                <th scope="col"><span className="visually-hidden">פעולות</span></th>
              </tr>
            </thead>
            <tbody>
              {seed.service_types.map((t) => (
                <tr key={t.id}>
                  <th scope="row">{t.id}</th>
                  <td>{t.name}</td>
                  <td>{t.category} {idx.categories.get(t.category)?.name}</td>
                  <td>{t.format}</td>
                  <td>{t.unit}</td>
                  <td>{t.note ?? ""}</td>
                  <td><Button small variant="ghost" icon={<Pencil size={16} />} aria-label={`עריכת ${t.name}`} onClick={() => setEditingType(t)} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="card" aria-labelledby="log-h">
        <h2 id="log-h">יומן שינויים</h2>
        <h3>ממתינים לפרסום ({pending.length})</h3>
        {pending.length ? (
          <ul>
            {pending.map((c, i) => (
              <li key={i}>
                {new Date(c.at).toLocaleString("he-IL")}: {c.kind === "setting" ? "הגדרה" : "סוג שירות"} {c.key}
                {c.kind === "setting" ? <>: {JSON.stringify(c.before)} ל-{JSON.stringify(c.after)}</> : null}
              </li>
            ))}
          </ul>
        ) : (
          <p className="muted">אין שינויים שלא פורסמו.</p>
        )}
        <h3>גרסאות שפורסמו</h3>
        {history.length ? (
          <ul>{history.map((h) => <li key={h.version}>גרסה {h.version}, {new Date(h.published_at).toLocaleDateString("he-IL")}: {h.changes.length} שינויים</li>)}</ul>
        ) : (
          <p className="muted">גרסת הבסיס הפעילה: {seed.meta.version}. עוד לא פורסמה גרסה מהמטה.</p>
        )}
      </section>

      <TypeDialog
        key={editingType === "new" ? "new" : (editingType?.id ?? "closed")}
        type={editingType}
        seed={seed}
        onClose={() => setEditingType(null)}
        onSave={(t, isNew) => {
          if (isNew) addServiceType(t);
          else updateServiceType(t.id, t);
          toast("success", `סוג השירות ${t.id} נשמר`);
          setEditingType(null);
        }}
      />

      <ConfirmDialog open={confirmPublish} title="פרסום גרסת בסיס" confirmLabel="פרסום והורדה" onClose={() => setConfirmPublish(false)} onConfirm={publish}>
        <p>תיווצר גרסה חדשה עם {pending.length} שינויים ויומן השינויים שלהם. הקובץ יורד למחשב, ומשם שולחים אותו לרשויות. בשטח טוענים אותו במסך "הרשות שלי".</p>
        <Alert tone="info">חבילות שייבנו בשטח על הגרסה הקודמת יסומנו במטה כ"גרסה שונה".</Alert>
      </ConfirmDialog>
    </>
  );
}

function nextTypeId(seed: Seed) {
  const max = seed.service_types.reduce((m, t) => Math.max(m, Number(/^T(\d+)$/.exec(t.id)?.[1] ?? 0)), 0);
  return `T${String(max + 1).padStart(2, "0")}`;
}

function TypeDialog(props: {
  type: Seed["service_types"][number] | "new" | null;
  seed: Seed;
  onClose: () => void;
  onSave: (t: Seed["service_types"][number], isNew: boolean) => void;
}) {
  const isNew = props.type === "new";
  const [draft, setDraft] = useState<Seed["service_types"][number] | null>(() =>
    props.type === "new"
      ? { id: nextTypeId(props.seed), category: "", name: "", format: "קבוצתי", unit: "חודש", scope: "מקומי", jerusalem: { tried: "לא", services: 0, participants: 0 }, note: null }
      : props.type,
  );
  const [touched, setTouched] = useState(false);
  if (!draft) return null;
  const errors = { name: draft.name.trim() ? null : "צריך שם", category: draft.category ? null : "בחרו קטגוריה" };

  return (
    <Dialog
      open={props.type !== null}
      onClose={props.onClose}
      title={isNew ? "סוג שירות חדש" : `עריכת ${draft.id}`}
      width={640}
      footer={
        <>
          <Button onClick={() => { setTouched(true); if (!errors.name && !errors.category) props.onSave({ ...draft, name: draft.name.trim() }, isNew); }}>שמירה</Button>
          <Button variant="secondary" onClick={props.onClose}>ביטול</Button>
        </>
      }
    >
      <div className="grid grid--form">
        <TextField label="קוד" value={draft.id} disabled />
        <TextField label="שם" required value={draft.name} error={touched ? errors.name : null} onChange={(e) => setDraft({ ...draft, name: e.target.value })} />
        <SelectField label="קטגוריה" required value={draft.category} disabled={!isNew} placeholder="בחרו קטגוריה" error={touched ? errors.category : null}
          onChange={(e) => setDraft({ ...draft, category: e.target.value })}
          options={props.seed.categories.map((c) => ({ value: c.code, label: `${c.code} ${c.name}` }))} />
        <TextField label="פורמט" value={draft.format} onChange={(e) => setDraft({ ...draft, format: e.target.value })} />
        <TextField label="יחידה" value={draft.unit} onChange={(e) => setDraft({ ...draft, unit: e.target.value })}
          hint="מחיר הייחוס מחושב לפי סוג שירות ויחידה" />
        <TextField label="היקף" value={draft.scope} onChange={(e) => setDraft({ ...draft, scope: e.target.value })} />
      </div>
      <TextArea label="הערה" value={draft.note ?? ""} onChange={(e) => setDraft({ ...draft, note: e.target.value || null })} />
      {!isNew ? (
        <p className="muted">
          נתוני ירושלים (מגיעים מהאטלס ולא נערכים כאן): {draft.jerusalem.tried}, {draft.jerusalem.services} שירותים, {draft.jerusalem.participants} משתתפים.
        </p>
      ) : null}
    </Dialog>
  );
}
