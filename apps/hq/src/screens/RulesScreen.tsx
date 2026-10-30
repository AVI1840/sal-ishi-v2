// ספרייה וכללים: עריכת ההגדרות וסוגי השירות, יומן שינויים, והפצת גרסת seed
// חדשה לשטח. כל שינוי משפיע מיד על כל המסכים במטה.

import { useState } from "react";
import { Pencil, Plus, Send } from "lucide-react";
import { FileSyncAdapter, SUPPLIER_RATING_COMPONENTS, createBrowserFileIO, proposalKeys, statusNote, type Seed } from "@sal-ishi/core";
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
import { WeightsCard } from "../components/WeightsCard";
import { PaymentRulesCard, finalizeSetting } from "../components/PaymentRulesCard";
import { useHqAnalysis } from "../analysis";
import { useHq } from "../store";

// nested: הגדרה בפורמט של 0.4, { value, status }, שהערך שלה נערך כאן.
type Kind = "int" | "money" | "ratio" | "bool" | "window" | "nested-int" | "nested-ratio";

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
  { key: "small_cell_threshold", label: "סף תא קטן", kind: "int" },
  { key: "qol_counts_in_target", label: "איכות חיים נספרת ביעד המיצוי", kind: "bool" },
  { key: "supplier_contact_to_hq", label: "פרטי ספק יחיד עוברים למטה", kind: "bool" },
  { key: "subcategory_breadth_min", label: "רוחב: תתי-קטגוריות שונות לפחות בכל קטגוריית ליבה", kind: "int", status: "subcategory_status" },
  { key: "subarea_alert_min", label: "התראה קוגניטיבית מתחת ל (שירותים רציפים)", kind: "int", status: "subarea_status" },
  { key: "selection_min_per_domain", label: "בחירת האזרח: מינימום שירותים מכל תחום", kind: "int", status: "selection_status" },
  { key: "selection_max_active", label: "בחירת האזרח: מקסימום שירותים פעילים במקביל", kind: "int", status: "selection_status" },
  { key: "selection_change_months", label: "בחירת האזרח: אפשרות החלפה כל (חודשים)", kind: "int", status: "selection_status" },
  { key: "suggestions_per_domain", label: "הצעות לאזרח בכל תחום", kind: "int", status: "selection_status" },
  // גרסה 0.4: מודל התשלום של החשכ"ל
  { key: "qol_copay", label: "איכות חיים במצב אחוז: השתתפות עצמית", kind: "ratio" },
  { key: "qol_cap_month", label: "איכות חיים במצב אחוז: תקרה חודשית מהארנק (ש\"ח)", kind: "money" },
  { key: "products_quarterly_cap_share", label: "תקרת מוצרים: שיעור מהארנק הרבעוני", kind: "nested-ratio" },
  { key: "products_count_in_floor", label: "מוצרים נספרים ברצפת המגוון", kind: "bool" },
  { key: "low_competition_operator_threshold", label: "תחרות נמוכה: פחות ספקים מ (לקטגוריה ושכונה)", kind: "int" },
  { key: "active_participant_min_sessions_month", label: "משתתף פעיל: מפגשים בחודש לפחות", kind: "nested-int" },
  { key: "first_service_max_days", label: "זמן לשירות ראשון: התראה מעל (ימים)", kind: "int" },
  { key: "supplier_rating_enabled", label: "דירוג ספקים פעיל (מתג אחד לכל המסכים)", kind: "bool", status: "supplier_rating_status" },
  { key: "supplier_rating_min_evaluations", label: "דירוג ספקים: הערכות לפחות לפני שמוצג ציון", kind: "int", status: "supplier_rating_status" },
];

/** סוגים שמחוץ להיקף הסל (תעסוקה), לא מוצגים בספרייה. נשארים ב-seed לקריאת קבצים ישנים. */
const HIDDEN_TYPES = new Set(["T14"]);

const MATCHING_LAYERS = [
  { key: "prevention", label: "מניעת הידרדרות", source: "קטגוריה וסוג השירות בספרייה (שיווי משקל, גירוי קוגניטיבי, תזונה)" },
  { key: "motivation", label: "רצון ומוטיבציה", source: "תחום הליבה של השירות מול המוטיבציות שהאדם ביטא בשיחה עם המלווה" },
  { key: "profileFit", label: "התאמה לפרופיל", source: "שפות, התאמה קהילתית ואופן מסירה (בבית, מרחוק) מהקטלוג" },
  { key: "socialProof", label: "המלצות וניסיון", source: "מספק העל, כשיהיו נתוני ניסיון" },
  { key: "proximity", label: "זמינות מעשית", source: "שכונה, היקף (רשותי, אזורי, ארצי) והשתתפות עצמית" },
];

const inner = (v: unknown) => (v && typeof v === "object" && "value" in v ? (v as { value: unknown }).value : v);

const toDisplay = (kind: Kind, v: unknown) => {
  const x = inner(v);
  if (kind === "ratio" || kind === "nested-ratio") return String(Math.round(Number(x) * 100));
  if (kind === "window") return String(/(\d+)/.exec(String(x))?.[1] ?? "");
  return String(x ?? "");
};

const fromDisplay = (kind: Kind, s: string, current: unknown): unknown => {
  if (kind === "nested-ratio") return { ...(current as object), value: Number(s) / 100 };
  if (kind === "nested-int") return { ...(current as object), value: Number(s) };
  return kind === "ratio" ? Number(s) / 100 : kind === "window" ? `rolling_${Number(s)}_months` : Number(s);
};

export default function RulesScreen() {
  const { seed, idx, state } = useHqAnalysis();
  const pending = useHq((s) => s.pending);
  const { updateSetting, updateServiceType, addServiceType, publishSeed } = useHq.getState();
  const toast = useToast();
  const [editingType, setEditingType] = useState<Seed["service_types"][number] | "new" | null>(null);
  const [confirmPublish, setConfirmPublish] = useState(false);
  const proposals = new Set(proposalKeys(seed.settings));
  const history = ((seed.meta as { changelog?: { version: string; published_at: string; changes: unknown[] }[] }).changelog ?? []).slice().reverse();

  const markFinal = (key: string, statusKey?: string) => {
    const [k, v] = finalizeSetting(seed.settings, key, statusKey);
    const err = updateSetting(k, v);
    toast(err ? "error" : "success", err ?? "הערך סומן כסופי");
  };
  const authorities = [...new Set(state.neighborhoods.map((n) => n.authority))].sort();

  const publish = async () => {
    const published = publishSeed();
    await new FileSyncAdapter(createBrowserFileIO()).publishSeed(published);
    setConfirmPublish(false);
    toast("success", `גרסת כללים ${published.meta.version} פורסמה. שלחו את הקובץ לרשויות.`);
  };

  return (
    <>
      <PageHeader
        title="ספרייה וכללים"
        description="ההגדרות, כללי מודל התשלום וספריית סוגי השירות. שינוי משפיע מיד על הכיסוי, המדדים, המחירים והייצוא במטה, ומגיע לשטח כשמפרסמים גרסת כללים חדשה."
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
                              const err = updateSetting(e.key, fromDisplay(e.kind, ev.target.value, value));
                              if (err) {
                                toast("error", `${e.label}: ${err}`);
                                ev.target.value = toDisplay(e.kind, value);
                              } else toast("success", `עודכן: ${e.label}`);
                            }}
                          />
                          {e.kind === "ratio" || e.kind === "nested-ratio" ? <span aria-hidden="true">%</span> : null}
                        </span>
                      )}
                    </td>
                    <td>
                      {isProposal ? (
                        <span className="row">
                          <ProposalBadge note={statusNote(seed.settings, e.key)} />
                          <Button small variant="ghost" onClick={() => markFinal(e.key, e.status)}>סימון כסופי</Button>
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

      <PaymentRulesCard seed={seed} authorities={authorities} />

      <WeightsCard
        id="layers-h"
        title="שכבות ההתאמה לאזרח"
        description="המשקלות שמנוע ההתאמה בכלי לאזרח ולמלווה משתמש בהם. ועדת הסל קובעת אותם. המלצות וניסיון על 0 עד שיהיו נתוני ניסיון. הכלי המרכזי קורא אותם מגרסת הכללים שמתפרסמת."
        settingKey="matching_weights"
        statusKey="matching_weights_status"
        items={MATCHING_LAYERS}
        defaults={{ prevention: 0.3, motivation: 0.3, profileFit: 0.25, socialProof: 0, proximity: 0.15 }}
        settings={seed.settings}
      />

      <section className="card" aria-labelledby="rating-h">
        <div className="card__header">
          <h2 id="rating-h">דירוג ספקים</h2>
          <ProposalBadge note={statusNote(seed.settings, "supplier_rating_enabled")} />
        </div>
        <p className="muted">
          הגדרה אחת לכל המסכים: המטה, השטח והשוק לאזרח. מתג אחד בטבלת ההגדרות. הציון מוצג רק מעל מספר מינימלי של הערכות, ואחרת "ספק חדש". לא חוסם שירות ולא נכנס לתקן קליטת המפעילים. הדירוג המחייב אצל ספק העל.
        </p>
        <TableWrap label="רכיבי הדירוג">
          <table className="table">
            <thead>
              <tr>
                <th scope="col">רכיב</th>
                <th scope="col">משקל</th>
              </tr>
            </thead>
            <tbody>
              {SUPPLIER_RATING_COMPONENTS.map((c) => (
                <tr key={c.key}>
                  <th scope="row">{c.label}</th>
                  <td>{seed.settings.supplier_rating_component_weights?.[c.key] != null ? `${Math.round(seed.settings.supplier_rating_component_weights[c.key]! * 100)}%` : "ייקבע"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      </section>

      <section className="card" aria-labelledby="types-h">
        <div className="card__header">
          <h2 id="types-h">ספריית סוגי השירות ({seed.service_types.filter((t) => !HIDDEN_TYPES.has(t.id)).length})</h2>
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
              {seed.service_types.filter((t) => !HIDDEN_TYPES.has(t.id)).map((t) => (
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
                {c.kind === "setting" ? (
                  <>
                    : <code dir="ltr" className="log-value">{JSON.stringify(c.before)}</code> ל-<code dir="ltr" className="log-value">{JSON.stringify(c.after)}</code>
                  </>
                ) : null}
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
          <p className="muted">גרסת הכללים הפעילה: {seed.meta.version}. עוד לא פורסמה גרסה מהמטה.</p>
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

      <ConfirmDialog open={confirmPublish} title="פרסום גרסת כללים" confirmLabel="פרסום והורדה" onClose={() => setConfirmPublish(false)} onConfirm={publish}>
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
