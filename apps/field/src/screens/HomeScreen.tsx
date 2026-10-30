// הרשות שלי: הגדרת הרשות והשכונות, תמונת מצב קצרה, ההגדרות הפעילות וקבלת seed מהמטה.

import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Database, MapPin, Pencil, Plus, RotateCcw, Trash2 } from "lucide-react";
import {
  COMMUNITIES,
  FileSyncAdapter,
  HOSPITALIZATION_TEXT,
  createBrowserFileIO,
  migrationGaps,
  productsQuarterlyCapPoints,
  proposalKeys,
  statusNote,
  type Neighborhood,
  type Settings,
} from "@sal-ishi/core";
import {
  Alert,
  Badge,
  Button,
  Dialog,
  EmptyState,
  PageHeader,
  ProposalBadge,
  SelectField,
  TableWrap,
  TextField,
  useToast,
} from "@sal-ishi/ui";
import { ConfirmDialog } from "../components/ConfirmDialog";
import { useAnalysis } from "../analysis";
import { newId, useField } from "../store";

// ההגדרות שמוצגות לרכזת, עם תווית בעברית.
const SETTING_LABELS: [string, string][] = [
  ["core_floor", "רצפת מגוון (שירותים רציפים לכל קטגוריית ליבה)"],
  ["min_participants", "שירות רציף: משתתפים לפחות בחודש השיא"],
  ["min_active_months", "שירות רציף: חודשים פעילים לפחות"],
  ["personal_wallet", "ארנק אישי בחודש (ש\"ח)"],
  ["utilization_target", "יעד מיצוי"],
  ["red_flag_avg", "דגל אדום מתחת ל"],
  ["utilization_window", "חלון מיצוי"],
  ["price_outlier_threshold", "חריגת מחיר מעל הייחוס"],
  ["reference_price_min_samples", "דגימות מינימום למחיר ייחוס"],
  ["points_rollover_months", "צבירת נקודות (חודשים)"],
  ["small_cell_threshold", "סף תא קטן (מוצג כ-<)"],
  ["supplier_contact_to_hq", "פרטי ספק יחיד עוברים למטה"],
  // גרסה 0.4: מודל התשלום של החשכ"ל
  ["cancellation_notice_hours", "הודעה מראש לביטול"],
  ["no_show_charge_rule", "חיוב באי-הגעה"],
  ["hospitalization_refund", "החזר באשפוז"],
  ["qol_mode", "איכות חיים: אופן הכיסוי"],
  ["reference_price_mode", "מחיר ייחוס"],
  ["low_competition_operator_threshold", "תחרות נמוכה: פחות ספקים מ"],
  ["products_quarterly_cap_share", "תקרת מוצרים ברבעון"],
  ["products_count_in_floor", "מוצרים נספרים ברצפת המגוון"],
  ["active_participant_min_sessions_month", "משתתף פעיל: מפגשים בחודש לפחות"],
  ["first_service_max_days", "זמן לשירות ראשון: עד (ימים)"],
];

const MODE_TEXT: Record<string, string> = {
  fixed_amount: "סכום קבוע מהנקודות, השאר על הקשיש",
  percent: "אחוז השתתפות עם תקרה חודשית",
  monitor: "מעקב והתראה, בלי חסימה",
  binding: "מחייב בקטגוריות ורשויות שנבחרו",
  preactivated_low_competition: "מחייב אוטומטית בתחרות נמוכה",
  individual_or_capacity_limited_only: "רק בפרטני, בבית או בקבוצה מוגבלת מקום",
  always: "תמיד",
  never: "אף פעם",
};

function formatSetting(key: string, value: unknown, settings: Settings): string {
  const hours = (h: unknown) => (typeof h === "number" ? `${h} שעות` : "טרם נקבע");
  if (key === "cancellation_notice_hours" && value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    return `קבוצה ${hours(v.group)}, בבית ${hours(v.home)}, פרטני ${hours(v.individual)}, מרחוק ${hours(v.remote)}`;
  }
  if (key === "hospitalization_refund" && value && typeof value === "object") {
    const v = value as Record<string, unknown>;
    return `קבוצה: ${HOSPITALIZATION_TEXT[String(v.group)] ?? v.group}. פרטני ובבית: ${HOSPITALIZATION_TEXT[String(v.individual)] ?? v.individual}${v.notify_companion ? ". הודעה למלווה" : ""}`;
  }
  if (key === "products_quarterly_cap_share") {
    return `${Math.round(settings.products_quarterly_cap_share.value * 100)}% מהארנק הרבעוני (${productsQuarterlyCapPoints(settings)} נקודות)`;
  }
  if (value && typeof value === "object" && "value" in value) {
    const inner = (value as { value: unknown }).value;
    return typeof inner === "string" ? (MODE_TEXT[inner] ?? inner) : formatSetting(key, inner, settings);
  }
  if (typeof value === "boolean") return value ? "כן" : "לא";
  if (typeof value === "number" && value > 0 && value < 1) return `${Math.round(value * 100)}%`;
  if (key === "utilization_window" && typeof value === "string") return value.replace(/rolling_(\d+)_months/, "$1 חודשים מתגלגלים");
  return String(value ?? "-");
}

export default function HomeScreen() {
  const data = useField((s) => s.data);
  const seed = useField((s) => s.seed);
  const seedFromHq = useField((s) => s.seedFromHq);
  const seedNotice = useField((s) => s.seedNotice);
  const isDemo = useField((s) => s.isDemo);
  const { setAuthority, upsertNeighborhood, removeNeighborhood, loadDemo, reset, setSeed, dismissSeedNotice } = useField.getState();
  const { coverage, perService, labels } = useAnalysis();
  const toast = useToast();

  const [authorityDraft, setAuthorityDraft] = useState(data.authority);
  useEffect(() => setAuthorityDraft(data.authority), [data.authority]);
  const [editing, setEditing] = useState<Neighborhood | null>(null);
  const [confirmReset, setConfirmReset] = useState(false);
  const [confirmDemo, setConfirmDemo] = useState(false);

  const proposals = new Set(proposalKeys(seed.settings));
  const entered = [...perService.values()].filter((a) => a.entry.status === "נכנס").length;
  const approved = data.services.filter((s) => s.status === "אושר").length;
  const redCells = coverage.cells.filter((c) => c.level === "red").length;
  const toComplete = migrationGaps(data.services, seed).filter((g) => g.gaps.length).length;

  const receiveSeed = async () => {
    try {
      const s = await new FileSyncAdapter(createBrowserFileIO()).receiveSeed();
      if (!s) return;
      setSeed(s);
      toast("success", `נטענה גרסת כללים ${s.meta.version} מהמטה`);
    } catch (e) {
      toast("error", `קובץ הכללים לא נקלט: ${e instanceof Error ? e.message : String(e)}`);
    }
  };

  const hasData = data.authority || data.neighborhoods.length || data.services.length;

  return (
    <>
      <PageHeader
        title="הרשות שלי"
        description="הגדרת הרשות והשכונות, תמונת מצב קצרה וההגדרות שהמטה קבע. כל הספים נקראים מקובץ הכללים ולא מקודדים."
        actions={
          <>
            <Button variant="secondary" icon={<Database size={18} />} onClick={() => (hasData ? setConfirmDemo(true) : loadDemo())}>
              טעינת נתוני הדגמה
            </Button>
            {hasData ? (
              <Button variant="ghost" icon={<RotateCcw size={18} />} onClick={() => setConfirmReset(true)}>
                איפוס
              </Button>
            ) : null}
          </>
        }
      />

      {seedNotice ? (
        <div className="stack">
          <Alert tone="info" title="גרסת כללים חדשה" live>{seedNotice}</Alert>
          <div><Button small variant="secondary" onClick={dismissSeedNotice}>הבנתי</Button></div>
        </div>
      ) : null}

      {toComplete ? (
        <Alert tone="warning" title="שירותים שדורשים השלמה">
          {toComplete} שירותים חסרים שדות של מודל התשלום (שעות ליחידה או אופן מתן). הנתונים שלהם נשמרו. <Link to="/catalog">לרשימת ההשלמות בקטלוג</Link>
          {isDemo ? (
            <div style={{ marginTop: "var(--spacing-2)" }}>
              <Button small variant="secondary" icon={<Database size={16} />} onClick={() => setConfirmDemo(true)}>טעינת נתוני ההדגמה המעודכנים (0.4)</Button>
            </div>
          ) : null}
        </Alert>
      ) : null}

      {!hasData ? (
        <EmptyState icon={<MapPin size={40} />} title="עוד לא הוגדרה רשות">
          התחילו בשם הרשות ובשכונות שבפיילוט, או טענו נתוני הדגמה סינתטיים כדי להכיר את הכלי.
        </EmptyState>
      ) : null}

      <section className="card" aria-labelledby="authority-h">
        <h2 id="authority-h">הרשות</h2>
        <form
          className="row"
          onSubmit={(e) => {
            e.preventDefault();
            if (!authorityDraft.trim()) return;
            setAuthority(authorityDraft.trim());
            toast("success", "שם הרשות נשמר");
          }}
        >
          <div style={{ flex: "1 1 280px" }}>
            <TextField label="שם הרשות" required value={authorityDraft} onChange={(e) => setAuthorityDraft(e.target.value)} />
          </div>
          <Button type="submit" style={{ alignSelf: "flex-end" }}>שמירה</Button>
        </form>
      </section>

      {data.services.length ? (
        <section aria-labelledby="kpi-h" className="stack">
          <h2 id="kpi-h">תמונת מצב</h2>
          <div className="grid grid--kpi">
            <Kpi value={data.services.length} label="שירותים בקטלוג" to="/catalog" />
            <Kpi value={entered} label="עוברים את מבחן הכניסה" to="/catalog" />
            <Kpi value={approved} label="מאושרים ומתפרסמים לאזרח" to="/submit" />
            <Kpi value={redCells} label="פערי כיסוי אדומים" to="/coverage" />
          </div>
        </section>
      ) : null}

      <section className="card" aria-labelledby="nb-h">
        <div className="card__header">
          <h2 id="nb-h">שכונות</h2>
          <Button
            icon={<Plus size={18} />}
            disabled={!data.authority}
            onClick={() => setEditing({ id: newId(), authority: data.authority, name: "", community: "general" })}
          >
            הוספת שכונה
          </Button>
        </div>
        {!data.authority ? <p className="muted">הגדירו קודם את שם הרשות.</p> : null}
        {data.neighborhoods.length ? (
          <TableWrap label="שכונות ברשות">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">שכונה</th>
                  <th scope="col">פרופיל קהילתי</th>
                  <th scope="col">שירותים</th>
                  <th scope="col">ספקים</th>
                  <th scope="col"><span className="visually-hidden">פעולות</span></th>
                </tr>
              </thead>
              <tbody>
                {data.neighborhoods.map((n) => (
                  <tr key={n.id}>
                    <th scope="row">{n.name}</th>
                    <td><Badge tone={n.community === "general" ? "neutral" : "info"}>{labels.community[n.community]}</Badge></td>
                    <td className="num">{data.services.filter((s) => s.neighborhoodId === n.id).length}</td>
                    <td className="num">{data.suppliers.filter((s) => s.neighborhoods.includes(n.id)).length}</td>
                    <td>
                      <div className="row">
                        <Button small variant="ghost" icon={<Pencil size={16} />} aria-label={`עריכת ${n.name}`} onClick={() => setEditing(n)} />
                        <Button
                          small
                          variant="ghost"
                          icon={<Trash2 size={16} />}
                          aria-label={`מחיקת ${n.name}`}
                          onClick={() => {
                            const err = removeNeighborhood(n.id);
                            toast(err ? "error" : "success", err ?? `השכונה ${n.name} נמחקה`);
                          }}
                        />
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </TableWrap>
        ) : null}
      </section>

      <section className="card" aria-labelledby="settings-h">
        <div className="card__header">
          <h2 id="settings-h">ההגדרות הפעילות</h2>
          <div className="row">
            <Badge tone={seedFromHq ? "success" : "neutral"}>
              גרסת כללים {seed.meta.version} {seedFromHq ? "(מהמטה)" : "(מובנית)"}
            </Badge>
            <Button variant="secondary" small onClick={receiveSeed}>קבלת גרסת כללים מהמטה</Button>
          </div>
        </div>
        <p className="muted">ההגדרות נקבעות במטה. ערך שמסומן "הצעה" עוד ממתין להכרעה.</p>
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
              {SETTING_LABELS.map(([key, label]) => (
                <tr key={key}>
                  <th scope="row">{label}</th>
                  <td>{formatSetting(key, (seed.settings as Record<string, unknown>)[key], seed.settings)}</td>
                  <td>{proposals.has(key) ? <ProposalBadge note={statusNote(seed.settings, key)} /> : <Badge tone="success">סופי</Badge>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
        <p className="muted">השתתפות עצמית: {seed.copay_note}</p>
      </section>

      <NeighborhoodDialog
        key={editing?.id ?? "closed"}
        neighborhood={editing}
        onClose={() => setEditing(null)}
        onSave={(n) => {
          upsertNeighborhood(n);
          toast("success", `השכונה ${n.name} נשמרה`);
          setEditing(null);
        }}
      />

      <ConfirmDialog
        open={confirmReset}
        title="איפוס כל הנתונים"
        confirmLabel="איפוס"
        danger
        onClose={() => setConfirmReset(false)}
        onConfirm={() => {
          reset();
          setAuthorityDraft("");
          setConfirmReset(false);
          toast("success", "הנתונים אופסו");
        }}
      >
        <p>כל השכונות, הספקים, השירותים והפעילות יימחקו מהדפדפן הזה. אם לא ייצאתם חבילת פיילוט, לא תהיה דרך לשחזר אותם.</p>
      </ConfirmDialog>

      <ConfirmDialog
        open={confirmDemo}
        title="טעינת נתוני הדגמה"
        confirmLabel="החלפה בנתוני הדגמה"
        danger
        onClose={() => setConfirmDemo(false)}
        onConfirm={() => {
          loadDemo();
          setAuthorityDraft(useField.getState().data.authority);
          setConfirmDemo(false);
          toast("success", "נטענו נתוני הדגמה סינתטיים");
        }}
      >
        <Alert tone="warning">נתוני ההדגמה יחליפו את כל מה שנשמר בדפדפן הזה.</Alert>
      </ConfirmDialog>
    </>
  );
}

function Kpi(props: { value: number; label: string; to: string }) {
  return (
    <Link to={props.to} className="card kpi kpi--link">
      <span className="kpi__value">{props.value.toLocaleString("he-IL")}</span>
      <span className="kpi__label">{props.label}</span>
    </Link>
  );
}

// מקבל key לפי השכונה, כך שכל פתיחה מתחילה מטיוטה נקייה.
function NeighborhoodDialog(props: { neighborhood: Neighborhood | null; onClose: () => void; onSave: (n: Neighborhood) => void }) {
  const [current, setCurrent] = useState<Neighborhood | null>(props.neighborhood);
  const [touched, setTouched] = useState(false);
  const { labels } = useAnalysis();
  const error = touched && !current?.name.trim() ? "צריך שם לשכונה" : null;

  return (
    <Dialog
      open={Boolean(props.neighborhood)}
      onClose={props.onClose}
      title="שכונה"
      width={560}
      footer={
        <Button
          onClick={() => {
            setTouched(true);
            if (current && current.name.trim()) props.onSave({ ...current, name: current.name.trim() });
          }}
        >
          שמירה
        </Button>
      }
    >
      {current ? (
        <>
          <TextField label="שם השכונה" required value={current.name} error={error} onChange={(e) => setCurrent({ ...current, name: e.target.value })} />
          <SelectField
            label="פרופיל קהילתי"
            value={current.community}
            onChange={(e) => setCurrent({ ...current, community: e.target.value as Neighborhood["community"] })}
            options={COMMUNITIES.map((c) => ({ value: c, label: labels.community[c]! }))}
            hint="בשכונה חרדית או ערבית, מבחן הכיסוי בודק גם שיש שירות מותאם בכל קטגוריה"
          />
        </>
      ) : null}
    </Dialog>
  );
}
