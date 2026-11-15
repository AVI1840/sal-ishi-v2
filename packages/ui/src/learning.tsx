// פנקס הלמידה, משותף לשטח ולמטה: רישום תובנה, הכרעה, וייצוא "רישום דרישות למכרז".
// נשמר בדפדפן, ועובר מהשטח למטה כקובץ.

import { useEffect, useState } from "react";
import { BookOpenCheck, Download, FileDown, Upload } from "lucide-react";
import {
  LEARNING_AREAS,
  LEARNING_PRIORITIES,
  LEARNING_STATUSES,
  XLSX_MIME,
  demoLearningEntries,
  learningEntrySchema,
  learningFile,
  mergeLearning,
  openVersionedStore,
  tenderMarkdown,
  tenderRequirements,
  writeWorkbook,
  type KeyValueStore,
  type LearningEntry,
} from "@sal-ishi/core";
import { Alert, Badge, Button, CheckboxField, SelectField, TextArea, TextField } from "./controls";
import { EmptyState, TableWrap, useToast } from "./feedback";
import { downloadBytes, pickFile, todayStamp } from "./download";
import { PageHeader } from "./shell";
import { useAppMode } from "./appMode";

const KEY = "entries";
const opts = (list: readonly string[]) => list.map((v) => ({ value: v, label: v }));

function useLearning(mode: "demo" | "pilot" | null) {
  const [store, setStore] = useState<KeyValueStore | null>(null);
  const [entries, setEntries] = useState<LearningEntry[] | null>(null);
  useEffect(() => {
    if (!mode) return;
    void openVersionedStore("sal-ishi-learning", [KEY]).then(async ({ store: s }) => {
      setStore(s);
      const saved = await s.get<LearningEntry[]>(KEY);
      setEntries(saved ?? (mode === "demo" ? demoLearningEntries() : []));
    });
  }, [mode]);
  const save = (next: LearningEntry[]) => {
    setEntries(next);
    void store?.set(KEY, next);
  };
  return { entries, save };
}

const empty = (surface: LearningEntry["surface"]): LearningEntry => ({
  id: "",
  at: "",
  surface,
  observed: "",
  area: "כלל",
  ref: "",
  proposal: "",
  status: "פתוח",
  decision: "",
  decidedBy: "",
  tender: true,
  priority: "רצוי",
});

function Editor(props: { initial: LearningEntry; onSave: (e: LearningEntry) => void; onCancel: () => void }) {
  const [e, setE] = useState(props.initial);
  const [error, setError] = useState<string | null>(null);
  const set = (patch: Partial<LearningEntry>) => setE({ ...e, ...patch });
  return (
    <form
      className="card stack"
      onSubmit={(ev) => {
        ev.preventDefault();
        if (!e.observed.trim()) return setError("צריך לכתוב מה קרה.");
        props.onSave(learningEntrySchema.parse({ ...e, id: e.id || `learn-${Date.now().toString(36)}`, at: e.at || new Date().toISOString() }));
      }}
    >
      <TextArea label="מה קרה" required value={e.observed} onChange={(x) => set({ observed: x.target.value })} error={error} hint="עובדה מהשטח, בלי שמות ובלי פרטים מזהים של אנשים." rows={3} />
      <div className="grid grid--form">
        <SelectField label="תחום" options={opts(LEARNING_AREAS)} value={e.area} onChange={(x) => set({ area: x.target.value as LearningEntry["area"] })} />
        <TextField label="כלל או שדה" value={e.ref} onChange={(x) => set({ ref: x.target.value })} hint="מפתח בהגדרות או שם שדה בתקן, למשל cancellation_notice_hours" />
        <SelectField label="עדיפות" options={opts(LEARNING_PRIORITIES)} value={e.priority} onChange={(x) => set({ priority: x.target.value as LearningEntry["priority"] })} />
      </div>
      <TextArea label="מה הוצע" value={e.proposal} onChange={(x) => set({ proposal: x.target.value })} rows={2} />
      <div className="grid grid--form">
        <SelectField label="מצב" options={opts(LEARNING_STATUSES)} value={e.status} onChange={(x) => set({ status: x.target.value as LearningEntry["status"] })} />
        <TextField label="מי הכריע" value={e.decidedBy} onChange={(x) => set({ decidedBy: x.target.value })} hint="פורום, תפקיד או צוות. לא שם של אזרח." />
      </div>
      {e.status !== "פתוח" ? <TextArea label="ההכרעה" value={e.decision} onChange={(x) => set({ decision: x.target.value })} rows={2} /> : null}
      <CheckboxField label="להכניס לרישום הדרישות למכרז" checked={e.tender} onChange={(v) => set({ tender: v })} />
      <div className="actions">
        <Button type="submit">לשמור</Button>
        <Button variant="ghost" onClick={props.onCancel}>
          ביטול
        </Button>
      </div>
    </form>
  );
}

const STATUS_TONE = { פתוח: "proposal", הוכרע: "success", נדחה: "neutral" } as const;

export function LearningNotebook(props: { surface: "שטח" | "מטה" }) {
  const mode = useAppMode();
  const { entries, save } = useLearning(mode);
  const [editing, setEditing] = useState<LearningEntry | null>(null);
  const toast = useToast();
  if (!entries) return <p role="status">טוען...</p>;
  const reqs = tenderRequirements(entries);

  const upsert = (e: LearningEntry) => {
    save(entries.some((x) => x.id === e.id) ? entries.map((x) => (x.id === e.id ? e : x)) : [...entries, e]);
    setEditing(null);
    toast("success", "התובנה נשמרה בפנקס.");
  };

  return (
    <>
      <PageHeader
        title="פנקס למידה"
        description="כל תובנה מהשטח: מה קרה, איזה כלל או שדה, מה הוצע ומי הכריע. מהפנקס יוצא רישום הדרישות למכרז."
        actions={
          <>
            <Button icon={<BookOpenCheck size={18} />} onClick={() => setEditing(empty(props.surface))}>
              תובנה חדשה
            </Button>
            <Button
              variant="secondary"
              icon={<Download size={18} />}
              disabled={!reqs.length}
              onClick={() =>
                downloadBytes(
                  `רישום_דרישות_למכרז_${todayStamp()}.xlsx`,
                  writeWorkbook([{ name: "דרישות", rows: reqs.map((r) => ({ "מזהה": r.id, "תחום": r.area, "הדרישה": r.requirement, "נימוק מהשטח": r.rationale, "עדיפות": r.priority, "מצב": r.status, "מקור": r.source })) }]),
                  XLSX_MIME,
                )
              }
            >
              רישום דרישות למכרז (Excel)
            </Button>
            <Button
              variant="secondary"
              icon={<FileDown size={18} />}
              disabled={!reqs.length}
              onClick={() => downloadBytes(`רישום_דרישות_למכרז_${todayStamp()}.md`, new TextEncoder().encode(tenderMarkdown(reqs)), "text/markdown")}
            >
              (Markdown)
            </Button>
          </>
        }
      />
      {mode === "demo" ? <Alert tone="info">שלוש הרשומות הראשונות הן דוגמה להדגמה.</Alert> : null}
      {editing ? <Editor initial={editing} onSave={upsert} onCancel={() => setEditing(null)} /> : null}

      {entries.length === 0 ? (
        <EmptyState title="הפנקס ריק">רשמו כאן כל דבר שהתגלה בפיילוט ומשנה כלל, שדה או תהליך.</EmptyState>
      ) : (
        <TableWrap label="רשומות הפנקס">
          <table className="table">
            <caption className="visually-hidden">רשומות פנקס הלמידה</caption>
            <thead>
              <tr>
                <th scope="col">תאריך</th>
                <th scope="col">מקור</th>
                <th scope="col">מה קרה</th>
                <th scope="col">כלל או שדה</th>
                <th scope="col">מה הוצע</th>
                <th scope="col">מצב</th>
                <th scope="col">פעולה</th>
              </tr>
            </thead>
            <tbody>
              {entries.map((e) => (
                <tr key={e.id}>
                  <td>{e.at.slice(0, 10)}</td>
                  <td>
                    {e.surface}, {e.area}
                  </td>
                  <td>{e.observed}</td>
                  <td dir="ltr" style={{ textAlign: "right" }}>{e.ref || "-"}</td>
                  <td>{e.proposal || "-"}</td>
                  <td>
                    <Badge tone={STATUS_TONE[e.status]}>{e.status === "פתוח" ? "הצעה, ממתין להכרעה" : e.status}</Badge>
                    {e.decision ? <p className="muted">{e.decision}{e.decidedBy ? ` (${e.decidedBy})` : ""}</p> : null}
                  </td>
                  <td>
                    <Button small variant="ghost" onClick={() => setEditing(e)}>
                      לעדכן<span className="visually-hidden">: {e.observed.slice(0, 40)}</span>
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </TableWrap>
      )}

      <section className="card stack" aria-labelledby="move-h">
        <h2 id="move-h">העברה בין השטח למטה</h2>
        <p className="muted">הפנקס נשמר בדפדפן. השטח מוריד קובץ ושולח למטה, והמטה קולט אותו ומאחד.</p>
        <div className="actions">
          <Button
            variant="secondary"
            icon={<Download size={18} />}
            onClick={() => downloadBytes(`פנקס_למידה_${props.surface}_${todayStamp()}.json`, new TextEncoder().encode(JSON.stringify(learningFile(entries, props.surface), null, 2)), "application/json")}
          >
            להוריד את הפנקס (קובץ)
          </Button>
          <Button
            variant="secondary"
            icon={<Upload size={18} />}
            onClick={async () => {
              const file = await pickFile("application/json,.json");
              if (!file) return;
              try {
                const result = mergeLearning(entries, JSON.parse(await file.text()));
                save(result.entries);
                toast("success", `נקלטו ${result.added} רשומות חדשות, ${result.updated} עודכנו.`);
              } catch {
                toast("error", "הקובץ לא נקרא. צריך קובץ פנקס למידה מהכלי.");
              }
            }}
          >
            לקלוט פנקס מקובץ
          </Button>
        </div>
      </section>
    </>
  );
}
